import { Inject, Injectable, Logger } from '@nestjs/common';
import * as apn from '@parse/node-apn';
import { env } from '../../env';
import { APNS_CLIENT } from './apns.provider';

@Injectable()
export class ApnsService {
  private readonly logger = new Logger(ApnsService.name);

  constructor(@Inject(APNS_CLIENT) private readonly apnProvider: apn.Provider) {}

  async sendToDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
    image?: { avatar?: { url: string; name: string; id: string }; attachmentUrl?: string },
  ) {
    if (!tokens.length) return [];

    const note = new apn.Notification();
    note.alert = { title, body };
    // Nested under `data`, not spread at the top level: the mobile client
    // reads click-through data at request.trigger.payload.data on iOS,
    // mirroring where Android/FCM puts it (request.content.data).
    note.payload = {
      data: data || {},
      avatarUrl: image?.avatar?.url,
      senderName: image?.avatar?.name,
      senderId: image?.avatar?.id,
      attachmentUrl: image?.attachmentUrl,
    };
    note.topic = env.APNS_BUNDLE_ID;
    note.sound = 'ping.aiff';
    note.priority = 10;
    // Required so iOS invokes the notification-service-extension, which
    // downloads the image(s) above and attaches them before the
    // notification is shown.
    if (image?.avatar?.url || image?.attachmentUrl) note.mutableContent = true;

    try {
      const result = await this.apnProvider.send(note, tokens);

      if (result.failed.length > 0) {
        this.logger.warn(`Failed to send to ${result.failed.length} APNs tokens`);
        result.failed.forEach((f) => {
          if (f.error) {
            this.logger.error(`APNs error for token ${f.device}: ${f.error.message}`);
          } else if (f.status) {
            this.logger.error(`APNs failed for token ${f.device} with status ${f.status}`);
          } else {
            this.logger.error(`APNs failed for token ${f.device} with unknown error`);
          }
        });
        return result.failed.map((f) => f.device);
      }

      return [];
    } catch (error) {
      this.logger.error(`APNs Error: ${error.message}`);
      return tokens;
    }
  }
}
