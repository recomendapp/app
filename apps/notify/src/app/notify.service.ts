import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { env } from '../env';

@Injectable()
export class NotifyService {
  private readonly resend: Resend;
  private readonly logger = new Logger(NotifyService.name);

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const data = await this.resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html,
      });

      if (data.error) {
        this.logger.error(`Resend error: ${data.error.message}`);
        throw new Error(data.error.message);
      }
      return data;
    } catch (error) {
      this.logger.error(`❌ Failed to send email: ${error}`);
      throw error;
    }
  }
}