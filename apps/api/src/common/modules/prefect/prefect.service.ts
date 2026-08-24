import { randomUUID } from 'crypto';
import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { EnvService, ENV_SERVICE } from '@libs/env';

interface CsrfTokenResponse {
  token: string;
  client: string;
  expiration: string;
}

// Thin client for Prefect's REST API (self-hosted server, basic auth — see
// infra/apps/services/prefect). We trigger flow runs by deployment name (not a
// hardcoded deployment UUID) so a redeploy of db-sync can never silently break this.
@Injectable()
export class PrefectService {
  private readonly logger = new Logger(PrefectService.name);
  private readonly apiUrl: string;
  private readonly authHeader: string;
  // The server has PREFECT_SERVER_API_CSRF_PROTECTION_ENABLED=true (infra/apps/applications/
  // prefect.yaml) — every mutating request needs a token fetched via GET /csrf-token first,
  // sent back as Prefect-Csrf-Token alongside the client id that requested it as
  // Prefect-Csrf-Client. `client` is just an arbitrary id we generate once per process, not a
  // Prefect-issued value. Cached until it expires so we're not fetching a token per request.
  private readonly csrfClientId = randomUUID();
  private csrfToken: { token: string; expiresAt: Date } | null = null;

  constructor(@Inject(ENV_SERVICE) private readonly env: EnvService) {
    this.apiUrl = this.env.PREFECT_API_URL.replace(/\/$/, '');
    this.authHeader = `Basic ${Buffer.from(this.env.PREFECT_API_AUTH_STRING).toString('base64')}`;
  }

  async triggerImportFlow(payload: {
    importId: number;
    userId: string;
    s3Key: string;
    provider: string;
  }): Promise<{ id: string }> {
    return this.triggerFlowRun('run_import', 'run_import', {
      import_id: String(payload.importId),
      user_id: payload.userId,
      s3_key: payload.s3Key,
      provider: payload.provider,
    });
  }

  private async triggerFlowRun(
    flowName: string,
    deploymentName: string,
    parameters: Record<string, unknown>,
  ): Promise<{ id: string }> {
    const deployment = await this.request<{ id: string }>(
      `/deployments/name/${flowName}/${deploymentName}`,
    );

    return this.request<{ id: string }>(`/deployments/${deployment.id}/create_flow_run`, {
      method: 'POST',
      body: JSON.stringify({ parameters }),
    });
  }

  private async getCsrfToken(): Promise<string> {
    if (this.csrfToken && this.csrfToken.expiresAt.getTime() > Date.now()) {
      return this.csrfToken.token;
    }

    const { token, expiration } = await this.request<CsrfTokenResponse>(
      `/csrf-token?client=${this.csrfClientId}`,
    );
    this.csrfToken = { token, expiresAt: new Date(expiration) };
    return token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: this.authHeader,
      ...(init?.headers as Record<string, string> | undefined),
    };

    // GET /csrf-token is itself unauthenticated-by-CSRF (it's how you get the token), so only
    // attach it to state-changing requests — otherwise this would recurse into itself.
    if (init?.method && init.method !== 'GET') {
      headers['Prefect-Csrf-Token'] = await this.getCsrfToken();
      headers['Prefect-Csrf-Client'] = this.csrfClientId;
    }

    const response = await fetch(`${this.apiUrl}${path}`, { ...init, headers });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`Prefect API request failed (${response.status}) ${path}: ${body}`);
      throw new InternalServerErrorException('Failed to reach Prefect API');
    }

    return response.json() as Promise<T>;
  }
}
