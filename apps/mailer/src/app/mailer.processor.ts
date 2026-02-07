import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { MAILER_QUEUE, MailerJob } from '@shared/mailer';
import { MailerService } from './mailer.service';
import { I18nService } from 'nestjs-i18n';
import { render } from '@react-email/render';
import { VerificationEmail } from '../templates/auth/verification-email';
import { DeleteAccount } from '../templates/auth/delete-account';

@Processor(MAILER_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async process(job: MailerJob) {
    this.logger.log(`📩 Job received: ${job.name}`);

    try {
      switch (job.name) {
        case 'auth:verification-email': {
          const { email, url, lang } = job.data;
          await this.mailerService.sendEmail(
            email,
            this.i18n.t('auth.verify_email.subject', { lang }),
            await render(VerificationEmail({
              url,
              dictionary: {
                title: this.i18n.t('auth.verify_email.title', { lang }),
                text: this.i18n.t('auth.verify_email.text', { lang }),
                button: this.i18n.t('auth.verify_email.button', { lang }),
              },
            })) 
          );
          break;
        }
        case 'auth:delete-account-email': {
          const { email, url, lang } = job.data;
          await this.mailerService.sendEmail(
            email,
            this.i18n.t('auth.delete_account_email.subject', { lang }),
            await render(DeleteAccount({
              url,
              dictionary: {
                title: this.i18n.t('auth.delete_account_email.title', { lang }),
                text: this.i18n.t('auth.delete_account_email.text', { lang }),
                button: this.i18n.t('auth.delete_account_email.button', { lang }),
              },
            }))
          );
          break;
        }
        default:
          this.logger.warn(`Unhandled job`);
      }
    } catch (error) {
      this.logger.error(`Failed to process job ${job.name}: ${error}`);
      throw error;
    }
  }
}