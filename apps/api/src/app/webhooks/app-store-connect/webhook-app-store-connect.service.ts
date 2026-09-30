import { Inject, Injectable, Logger } from '@nestjs/common';
import { ENV_SERVICE, type EnvService } from '@libs/env';
import { SystemService } from '../../system/system.service';
import { AppStoreConnectService } from '../../../common/modules/app-store-connect/app-store-connect.service';

// The only state that means "the store confirms this version is actually downloadable" --
// every other value (IN_REVIEW, WAITING_FOR_REVIEW, PENDING_DEVELOPER_RELEASE, ...) is a
// transient step in the review process we don't act on.
const LIVE_APP_VERSION_STATE = 'READY_FOR_DISTRIBUTION';
const EVENT_TYPE_APP_VERSION_STATE_UPDATED = 'appStoreVersionAppVersionStateUpdated';

@Injectable()
export class WebhookAppStoreConnectService {
  private readonly logger = new Logger(WebhookAppStoreConnectService.name);

  constructor(
    @Inject(ENV_SERVICE) private readonly env: EnvService,
    private readonly systemService: SystemService,
    private readonly appStoreConnect: AppStoreConnectService,
  ) {}

  async handleEvent(event: any): Promise<{ success: true }> {
    const type = event?.type;

    // Covers `webhookPingCreated` (Apple's "Test webhook delivery") and any other
    // trigger enabled on the webhook we don't act on -- always acknowledged, never
    // an error, so Apple doesn't treat it as a failed delivery and retry it.
    if (type !== EVENT_TYPE_APP_VERSION_STATE_UPDATED) {
      this.logger.log(`Ignoring ${type ?? 'unrecognized'} event`);
      return { success: true };
    }

    const newValue = event.attributes?.newValue;
    const versionId = event.relationships?.instance?.data?.id;

    if (newValue !== LIVE_APP_VERSION_STATE || !versionId) {
      this.logger.log(`Ignoring app version state change to ${newValue}`);
      return { success: true };
    }

    const version = await this.appStoreConnect.getAppStoreVersion(versionId);
    if (!version) {
      this.logger.warn(`appStoreVersions/${versionId} not found, ignoring`);
      return { success: true };
    }

    if (version.appId && version.appId !== this.env.APP_STORE_CONNECT_APP_ID) {
      this.logger.warn(
        `appStoreVersions/${versionId} belongs to app ${version.appId}, not ` +
          `${this.env.APP_STORE_CONNECT_APP_ID}; ignoring`,
      );
      return { success: true };
    }

    if (version.platform !== 'IOS') {
      this.logger.log(`Ignoring non-iOS platform ${version.platform}`);
      return { success: true };
    }

    this.logger.log(`ios@${version.versionString} is now live`);

    await this.systemService.confirmVersionLive('ios', version.versionString);

    return { success: true };
  }
}
