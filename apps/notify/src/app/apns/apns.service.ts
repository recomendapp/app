import { Inject, Injectable, Logger } from '@nestjs/common';
import * as apn from '@parse/node-apn';
import { env } from '../../env';
import { APNS_CLIENT } from './apns.provider';

@Injectable()
export class ApnsService {
  private readonly logger = new Logger(ApnsService.name);

  constructor(
    @Inject(APNS_CLIENT) private readonly apnProvider: apn.Provider,
  ) {}

  async sendToDevices(tokens: string[], title: string, body: string, data?: Record<string, any>) {
    if (!tokens.length) return [];

    const note = new apn.Notification();
    note.alert = { title, body };
    note.payload = data || {};
    note.topic = env.APNS_BUNDLE_ID;
    note.sound = 'ping.aiff';
    note.priority = 10;

    try {
      const result = await this.apnProvider.send(note, tokens);
      
      if (result.failed.length > 0) {
        this.logger.warn(`Failed to send to ${result.failed.length} APNs tokens`);
        return result.failed.map(f => f.device);
      }
      
      return [];
    } catch (error) {
      this.logger.error(`APNs Error: ${error.message}`);
      return tokens;
    }
  }
}