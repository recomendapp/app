import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { importPKCS8, SignJWT } from 'jose';
import { ENV_SERVICE, type EnvService } from '@libs/env';

export interface AppStoreVersionInfo {
  versionString: string;
  /** Only `IOS` maps to our `AppPlatform` today; other values (MAC_OS, TV_OS...) are ignored by callers. */
  platform: string;
  /** The `appStoreVersions.relationships.app` id, when present -- lets callers cross-check the event is about our app. */
  appId: string | null;
}

interface AppStoreVersionResource {
  data: {
    attributes: { versionString: string; platform: string };
    relationships?: { app?: { data?: { id: string } } };
  };
}

// App Store Connect API JWTs are ES256, signed with the same kind of .p8 key as Sign in
// with Apple (see auth.utils.ts). Apple caps their lifetime at 20 minutes; we mint one
// and reuse it until shortly before that, rather than signing a fresh one per request.
const TOKEN_LIFETIME_SECONDS = 19 * 60;
const TOKEN_REFRESH_MARGIN_SECONDS = 30;

// Thin, reusable client for the App Store Connect REST API. Its only job today is
// resolving the `appStoreVersions` id a webhook event refers to (see
// apps/api/src/app/webhooks/app-store-connect) into an actual version string and
// platform -- the webhook payload itself only carries the id and the new state.
@Injectable()
export class AppStoreConnectService {
  private readonly logger = new Logger(AppStoreConnectService.name);
  private token: { value: string; expiresAt: number } | null = null;

  constructor(@Inject(ENV_SERVICE) private readonly env: EnvService) {}

  async getAppStoreVersion(id: string): Promise<AppStoreVersionInfo | null> {
    const resource = await this.request<AppStoreVersionResource>(
      `/v1/appStoreVersions/${id}?fields[appStoreVersions]=versionString,platform`,
    );
    if (!resource) return null;

    return {
      versionString: resource.data.attributes.versionString,
      platform: resource.data.attributes.platform,
      appId: resource.data.relationships?.app?.data?.id ?? null,
    };
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;

    const privateKey = this.env.APP_STORE_CONNECT_PRIVATE_KEY.replace(/\\n/g, '\n');
    const key = await importPKCS8(privateKey, 'ES256');
    const now = Math.floor(Date.now() / 1000);
    const exp = now + TOKEN_LIFETIME_SECONDS;

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: this.env.APP_STORE_CONNECT_KEY_ID, typ: 'JWT' })
      .setIssuer(this.env.APP_STORE_CONNECT_ISSUER_ID)
      .setAudience('appstoreconnect-v1')
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(key);

    this.token = { value: token, expiresAt: (exp - TOKEN_REFRESH_MARGIN_SECONDS) * 1000 };
    return token;
  }

  private async request<T>(path: string): Promise<T | null> {
    const token = await this.getToken();
    const response = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(
        `App Store Connect API request failed (${response.status}) ${path}: ${body}`,
      );
      throw new InternalServerErrorException('Failed to reach the App Store Connect API');
    }

    return response.json() as Promise<T>;
  }
}
