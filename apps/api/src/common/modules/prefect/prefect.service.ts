import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { EnvService, ENV_SERVICE } from '@libs/env';

// Thin client for Prefect's REST API (self-hosted server, basic auth — see
// infra/apps/services/prefect). We trigger flow runs by deployment name (not a
// hardcoded deployment UUID) so a redeploy of db-sync can never silently break this.
@Injectable()
export class PrefectService {
  private readonly logger = new Logger(PrefectService.name);
  private readonly apiUrl: string;
  private readonly authHeader: string;

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

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.authHeader,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`Prefect API request failed (${response.status}) ${path}: ${body}`);
      throw new InternalServerErrorException('Failed to reach Prefect API');
    }

    return response.json() as Promise<T>;
  }
}
