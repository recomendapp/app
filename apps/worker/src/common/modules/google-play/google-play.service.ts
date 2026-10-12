import { Inject, Injectable, Logger } from '@nestjs/common';
import { importPKCS8, SignJWT } from 'jose';
import { ENV_SERVICE, type WorkerEnvService } from '@libs/env';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

// Google caps service-account assertions at an hour; we reuse the access token it
// buys until shortly before that rather than re-signing one per request.
const TOKEN_LIFETIME_SECONDS = 3600;
const TOKEN_REFRESH_MARGIN_SECONDS = 60;

const LIVE_RELEASE_STATUS = 'completed';

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

interface TrackResource {
  releases?: { name?: string; status?: string }[];
}

/**
 * Reads what the Play production track currently serves. Unlike App Store Connect,
 * Play has no release webhook -- its only push channel (RTDN) carries purchase and
 * subscription events only -- so the version a release went live at can only be
 * discovered by asking (see apps/worker/src/app/store-release).
 */
@Injectable()
export class GooglePlayService {
  private readonly logger = new Logger(GooglePlayService.name);
  private token: { value: string; expiresAt: number } | null = null;

  constructor(@Inject(ENV_SERVICE) private readonly env: WorkerEnvService) {}

  get isConfigured(): boolean {
    return !!this.env.GOOGLE_PLAY_RELEASE_READER_B64 && !!this.env.ANDROID_PACKAGE_NAME;
  }

  /**
   * The version names the production track currently serves to users. Reading a track
   * requires an "edit" -- Play's unit of change -- even for a pure read, so one is
   * opened and discarded here; nothing is ever committed, so this publishes nothing.
   */
  async getLiveProductionVersions(): Promise<string[]> {
    const packageName = this.env.ANDROID_PACKAGE_NAME;
    if (!packageName) throw new Error('ANDROID_PACKAGE_NAME is not set');

    const edit = await this.request<{ id: string }>('POST', `/applications/${packageName}/edits`);

    try {
      const track = await this.request<TrackResource>(
        'GET',
        `/applications/${packageName}/edits/${edit.id}/tracks/production`,
      );

      return (track.releases ?? [])
        .filter((release) => release.status === LIVE_RELEASE_STATUS)
        .map((release) => parseVersionName(release.name))
        .filter((version): version is string => version !== null);
    } finally {
      await this.request('DELETE', `/applications/${packageName}/edits/${edit.id}`).catch((error) =>
        this.logger.warn(`Failed to discard Play edit ${edit.id}`, error),
      );
    }
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;

    const serviceAccount = this.env.GOOGLE_PLAY_RELEASE_READER_B64;
    if (!serviceAccount) throw new Error('GOOGLE_PLAY_RELEASE_READER_B64 is not set');

    const credentials = JSON.parse(serviceAccount) as ServiceAccountKey;
    const key = await importPKCS8(credentials.private_key.replace(/\\n/g, '\n'), 'RS256');
    const now = Math.floor(Date.now() / 1000);

    const assertion = await new SignJWT({ scope: SCOPE })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(credentials.client_email)
      .setAudience(TOKEN_URL)
      .setIssuedAt(now)
      .setExpirationTime(now + TOKEN_LIFETIME_SECONDS)
      .sign(key);

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Google token exchange failed (${response.status}): ${await response.text().catch(() => '')}`,
      );
    }

    const { access_token, expires_in } = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    this.token = {
      value: access_token,
      expiresAt: (Math.floor(Date.now() / 1000) + expires_in - TOKEN_REFRESH_MARGIN_SECONDS) * 1000,
    };
    return access_token;
  }

  private async request<T>(method: string, path: string): Promise<T> {
    const token = await this.getToken();
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(
        `Play Developer API ${method} ${path} failed (${response.status}): ${await response.text().catch(() => '')}`,
      );
    }

    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  }
}

/**
 * A release's `name` is free text, and the production track really does mix formats:
 * uploads that named themselves give "1.7.0", while Play's own default is
 * "<versionCode> (<versionName>)" -- e.g. "77 (1.5.1)", where the leading number is a
 * build counter and the version we want is in the parentheses. Reading left to right
 * would pick the version code every time.
 *
 * `bundles.list` carries no version name, so this is the only place the store exposes
 * one: a name we can't parse yields null and that release is ignored rather than
 * guessed at. At least one dot is required, so a bare version code ("77") can never be
 * mistaken for a version -- release-please only ever produces x.y.z anyway.
 */
export function parseVersionName(name: string | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const version = /^v?(\d+(?:\.\d+){1,2})$/;
  const parenthesized = trimmed.match(/\(([^)]+)\)\s*$/)?.[1]?.trim();

  return parenthesized?.match(version)?.[1] ?? trimmed.match(version)?.[1] ?? null;
}
