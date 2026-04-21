import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { NOTIFY_QUEUE, NotifyJob } from '@shared/notify';
import { NotifyService } from './notify.service';
import { I18nService } from 'nestjs-i18n';
import { render } from '@react-email/render';
import { VerificationEmail } from '../templates/auth/verification-email';
import { DeleteAccount } from '../templates/auth/delete-account';
import { DRIZZLE_SERVICE, DrizzleService } from '../common/modules/drizzle.module';
import { eq, inArray, sql } from 'drizzle-orm';
import { pushToken, tmdbMovieView, tmdbTvSeriesView, user } from '@libs/db/schemas';
import { defaultSupportedLocale } from '@libs/i18n';

@Processor(NOTIFY_QUEUE)
export class NotifyProcessor extends WorkerHost {
  private readonly logger = new Logger(NotifyProcessor.name);

  constructor(
    private readonly notifyService: NotifyService,
    private readonly i18n: I18nService,
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {
    super();
  }

  async process(job: NotifyJob) {
    this.logger.log(`📩 Job received: ${job.name}`);

    try {
      switch (job.name) {
        case 'auth:verification-email': {
          const { email, url, lang } = job.data;
          await this.notifyService.sendEmail(
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
          await this.notifyService.sendEmail(
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
        case 'auth:reset-password': {
          const { email, url, lang } = job.data;
          await this.notifyService.sendEmail(
            email,
            this.i18n.t('auth.reset_password.subject', { lang }),
            await render(VerificationEmail({
              url,
              dictionary: {
                title: this.i18n.t('auth.reset_password.title', { lang }),
                text: this.i18n.t('auth.reset_password.text', { lang }),
                button: this.i18n.t('auth.reset_password.button', { lang }),
              },
            }))
          );
          break;
        }
        case 'auth:sign-in-otp-email':
        case 'auth:verification-otp-email':
        case 'auth:password-reset-otp-email': {
          const { email, otp, type, lang } = job.data;

          let subjectKey: string;
          let titleKey: string;
          let textKey: string;

          switch (type) {
            case 'sign-in':
              subjectKey = 'auth.sign_in_otp_email.subject';
              titleKey = 'auth.sign_in_otp_email.title';
              textKey = 'auth.sign_in_otp_email.text';
              break;
            case 'email-verification':
              subjectKey = 'auth.verification_otp_email.subject';
              titleKey = 'auth.verification_otp_email.title';
              textKey = 'auth.verification_otp_email.text';
              break;
            case 'forget-password':
              subjectKey = 'auth.password_reset_otp_email.subject';
              titleKey = 'auth.password_reset_otp_email.title';
              textKey = 'auth.password_reset_otp_email.text';
              break;
            default:
              throw new Error('Invalid OTP email type');
          }

          await this.notifyService.sendEmail(
            email,
            this.i18n.t(subjectKey, { lang }),
            await render(VerificationEmail({
              dictionary: {
                title: this.i18n.t(titleKey, { lang }),
                text: this.i18n.t(textKey, { lang, args: { otp } }),
                button: this.i18n.t('auth.otp_email.button', { lang }),
              },
            }))
          );
          break;
        }
        case 'follow:new': {
          const { actorId, targetUserId } = job.data;

          const actor = await this.db.query.user.findFirst({
            where: eq(user.id, actorId),
            columns: { username: true, name: true },
          });
          if (!actor) break;

          const actorName = actor.name ?? actor.username;

          const groupedByLang = await this.getDevicesGroupedByLang([targetUserId]);

          await Promise.all(
            Object.entries(groupedByLang).map(async ([lang, devices]) => {
              const title = this.i18n.t('follow.new.subject', { lang });
              const body = this.i18n.t('follow.new.body', { 
                lang, 
                args: { actorName } 
              });

              await this.notifyService.sendPushNotifications(devices, {
                title,
                body,
                data: {
                  type: job.name,
                  url: `/@${actor.username}`,
                  actorId: actorId,
                  actorUsername: actor.username,
                }
              });
            })
          );

          break;
        }
        case 'follow:request': {
          const { actorId, targetUserId } = job.data;

          const actor = await this.db.query.user.findFirst({
            where: eq(user.id, actorId),
            columns: { username: true, name: true },
          });
          if (!actor) break;

          const actorName = actor.name ?? actor.username;

          const groupedByLang = await this.getDevicesGroupedByLang([targetUserId]);

          await Promise.all(
            Object.entries(groupedByLang).map(async ([lang, devices]) => {
              const title = this.i18n.t('follow.request.subject', { lang });
              const body = this.i18n.t('follow.request.body', { 
                lang, 
                args: { actorName } 
              });

              await this.notifyService.sendPushNotifications(devices, {
                title,
                body,
                data: {
                  type: job.name,
                  url: `/@${actor.username}`,
                  actorId: actorId,
                  actorUsername: actor.username,
                }
              });
            })
          );
          break;
        }
        case 'follow:accepted': {
          const { actorId, targetUserId } = job.data;

          const actor = await this.db.query.user.findFirst({
            where: eq(user.id, actorId),
            columns: { username: true, name: true },
          });
          if (!actor) break;

          const actorName = actor.name ?? actor.username;

          const groupedByLang = await this.getDevicesGroupedByLang([targetUserId]);

          await Promise.all(
            Object.entries(groupedByLang).map(async ([lang, devices]) => {
              const title = this.i18n.t('follow.accepted.subject', { lang });
              const body = this.i18n.t('follow.accepted.body', { 
                lang, 
                args: { actorName } 
              });

              await this.notifyService.sendPushNotifications(devices, {
                title,
                body,
                data: {
                  type: job.name,
                  url: `/@${actor.username}`,
                  actorId: actorId,
                  actorUsername: actor.username,
                }
              });
            })
          );
          break;
        }
        case 'reco:completed': {
          const { userId, senderIds, mediaId, type } = job.data;
          if (!senderIds.length) break;

          const watcher = await this.db.query.user.findFirst({
            where: eq(user.id, userId),
            columns: { username: true, name: true },
          });
          if (!watcher) throw new Error('Watcher not found');

          const watcherName = watcher.name ?? watcher.username;

          const sendersData = await this.db
            .select({
              userId: pushToken.userId,
              token: pushToken.token,
              provider: pushToken.provider,
              deviceType: pushToken.deviceType,
              language: user.language,
            })
            .from(pushToken)
            .innerJoin(user, eq(user.id, pushToken.userId))
            .where(inArray(pushToken.userId, senderIds));
          
          if (!sendersData.length) break;

          const groupedByLang = sendersData.reduce((acc, current) => {
            const lang = current.language || defaultSupportedLocale;
            if (!acc[lang]) acc[lang] = [];
            acc[lang].push(current);
            return acc;
          }, {} as Record<string, typeof sendersData>);

          await Promise.all(
            Object.entries(groupedByLang).map(async ([lang, devices]) => {
              const mediaData = await this.db.transaction(async (tx) => {
                await tx.execute(sql`SELECT set_config('app.current_language', ${lang}, true)`);
                
                if (type === 'movie') {
                  const result = await tx.select({ title: tmdbMovieView.title, url: tmdbMovieView.url })
                    .from(tmdbMovieView)
                    .where(eq(tmdbMovieView.id, mediaId))
                    .limit(1);
                  return result[0];
                } else {
                  const result = await tx.select({ title: tmdbTvSeriesView.name, url: tmdbTvSeriesView.url })
                    .from(tmdbTvSeriesView)
                    .where(eq(tmdbTvSeriesView.id, mediaId))
                    .limit(1);
                  return result[0];
                }
              });

              if (!mediaData) return;

              const title = this.i18n.t('reco.completed.subject', { 
                lang, 
                args: { watcherName } 
              });
              
              const body = this.i18n.t('reco.completed.body', { 
                lang, 
                args: { watcherName, mediaTitle: mediaData.title } 
              });

              await this.notifyService.sendPushNotifications(devices, {
                title,
                body,
                data: {
                  type: job.name,
                  url: mediaData.url || '/',
                  mediaId: mediaId.toString(),
                  mediaType: type,
                }
              });
            })
          );

          break;
        }
        case 'reco:received': {
          const { senderId, receiverIds, mediaId, type, comment } = job.data;
          if (!receiverIds.length) break;

          const sender = await this.db.query.user.findFirst({
            where: eq(user.id, senderId),
            columns: { username: true, name: true },
          });

          const senderName = sender?.name ?? sender?.username;

          const receiversData = await this.db
            .select({
              userId: pushToken.userId,
              token: pushToken.token,
              provider: pushToken.provider,
              deviceType: pushToken.deviceType,
              language: user.language,
            })
            .from(pushToken)
            .innerJoin(user, eq(user.id, pushToken.userId))
            .where(inArray(pushToken.userId, receiverIds));
          
          if (!receiversData.length) break;

          const groupedByLang = receiversData.reduce((acc, current) => {
            const lang = current.language || defaultSupportedLocale;
            if (!acc[lang]) acc[lang] = [];
            acc[lang].push(current);
            return acc;
          }, {} as Record<string, typeof receiversData>);

          await Promise.all(
            Object.entries(groupedByLang).map(async ([lang, devices]) => {
              const mediaTitle = await this.db.transaction(async (tx) => {
                await tx.execute(sql`SELECT set_config('app.current_language', ${lang}, true)`);
                
                if (type === 'movie') {
                  const result = await tx.select({ title: tmdbMovieView.title, url: tmdbMovieView.url })
                    .from(tmdbMovieView)
                    .where(eq(tmdbMovieView.id, mediaId))
                    .limit(1);
                  return result[0];
                } else {
                  const result = await tx.select({ title: tmdbTvSeriesView.name, url: tmdbTvSeriesView.url })
                    .from(tmdbTvSeriesView)
                    .where(eq(tmdbTvSeriesView.id, mediaId))
                    .limit(1);
                  return result[0];
                }
              });

              if (!mediaTitle) return;

              const title = this.i18n.t('reco.received.subject', { 
                lang, 
                args: { senderName } 
              });
              
              const body = comment 
                ? comment 
                : this.i18n.t('reco.received.body', { 
                    lang, 
                    args: { senderName, mediaTitle: mediaTitle.title } 
                  });

              await this.notifyService.sendPushNotifications(devices, {
                title,
                body,
                data: {
                  type: job.name,
                  url: mediaTitle.url || '/',
                  mediaId: mediaId.toString(),
                  mediaType: type,
                }
              });
            })
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

  private async getDevicesGroupedByLang(userIds: string[]) {
    if (!userIds.length) return {};

    const receiversData = await this.db
      .select({
        userId: pushToken.userId,
        token: pushToken.token,
        provider: pushToken.provider,
        deviceType: pushToken.deviceType,
        language: user.language,
      })
      .from(pushToken)
      .innerJoin(user, eq(user.id, pushToken.userId))
      .where(inArray(pushToken.userId, userIds));

    return receiversData.reduce((acc, current) => {
      const lang = current.language || defaultSupportedLocale;
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(current);
      return acc;
    }, {} as Record<string, typeof receiversData>);
  }
}