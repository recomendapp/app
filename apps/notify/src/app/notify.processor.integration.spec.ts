// @react-email/render's `render()` does a dynamic `import('react-dom/server')`
// internally, which Jest's CJS runtime can't execute without
// --experimental-vm-modules. react-dom/server has a synchronous CJS export
// (renderToStaticMarkup) that produces equivalent markup for our purposes
// (asserting translated copy landed in the rendered html), so we use that
// instead of pulling in the ESM-only code path.
jest.mock('@react-email/render', () => ({
  render: async (element: any) => {
    const ReactDOMServer = require('react-dom/server');
    return ReactDOMServer.renderToStaticMarkup(element);
  },
}));

jest.mock('../env', () => ({
  env: {
    TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    S3_ENDPOINT: 'https://s3.internal.test',
    S3_PUBLIC_ENDPOINT: 'https://cdn.test',
    S3_BUCKET: 'medias',
    ASSETS_BASE_URL: 'https://assets.test',
  },
}));

import { randomUUID } from 'node:crypto';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AcceptLanguageResolver, I18nModule, I18nService } from 'nestjs-i18n';
import { defaultSupportedLocale, SupportedLocale } from '@libs/i18n';
import { pushToken, tmdbMovieImage } from '@libs/db/schemas';
import {
  createTestMovie,
  createTestSession,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { NotifyProcessor } from './notify.processor';

type Device = { userId: string; provider: 'fcm' | 'apns'; token?: string };

async function createDevice(testDb: TestDatabase, device: Device) {
  const session = await createTestSession(testDb.db, { userId: device.userId });
  const [row] = await testDb.db
    .insert(pushToken)
    .values({
      userId: device.userId,
      sessionId: session.id,
      provider: device.provider,
      token: device.token ?? `token-${randomUUID()}`,
    })
    .returning();
  return row;
}

async function createExpiredDevice(testDb: TestDatabase, device: Device) {
  const session = await createTestSession(
    testDb.db,
    { userId: device.userId },
    { expiresAt: new Date(Date.now() - 60_000).toISOString() },
  );
  const [row] = await testDb.db
    .insert(pushToken)
    .values({
      userId: device.userId,
      sessionId: session.id,
      provider: device.provider,
      token: device.token ?? `token-${randomUUID()}`,
    })
    .returning();
  return row;
}

describe('NotifyProcessor', () => {
  let testDb: TestDatabase;
  let app: INestApplication;
  let i18n: I18nService;
  let notifyService: { sendEmail: jest.Mock; sendPushNotifications: jest.Mock };
  let processor: NotifyProcessor;

  beforeAll(async () => {
    testDb = await TestDatabase.create();

    const moduleRef = await Test.createTestingModule({
      imports: [
        I18nModule.forRoot({
          fallbackLanguage: defaultSupportedLocale,
          fallbacks: {
            'en-*': 'en-US' as SupportedLocale,
            'fr-*': 'fr-FR' as SupportedLocale,
          },
          loaderOptions: {
            path: path.join(__dirname, '../assets/i18n/'),
            watch: false,
          },
          resolvers: [AcceptLanguageResolver],
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    i18n = app.get(I18nService);
  });

  afterEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  beforeEach(() => {
    notifyService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
      sendPushNotifications: jest.fn().mockResolvedValue(undefined),
    };
    processor = new NotifyProcessor(notifyService as any, i18n, testDb.db);
  });

  describe('auth:verification-email', () => {
    it('sends the translated subject and rendered html', async () => {
      await processor.process({
        name: 'auth:verification-email',
        data: {
          email: 'user@example.com',
          url: 'https://app.test/verify',
          token: 't',
          lang: 'en-US',
        },
      } as any);

      expect(notifyService.sendEmail).toHaveBeenCalledTimes(1);
      const [to, subject, html] = notifyService.sendEmail.mock.calls[0];
      expect(to).toBe('user@example.com');
      expect(subject).toBe('Verify your account');
      expect(html).toContain('Welcome to Recomend!');
      expect(html).toContain('Verify my email');
    });

    it('translates to French when lang is fr-FR', async () => {
      await processor.process({
        name: 'auth:verification-email',
        data: {
          email: 'user@example.com',
          url: 'https://app.test/verify',
          token: 't',
          lang: 'fr-FR',
        },
      } as any);

      const [, subject, html] = notifyService.sendEmail.mock.calls[0];
      expect(subject).toBe('Vérifiez votre compte');
      expect(html).toContain('Bienvenue sur Recomend !');
    });
  });

  describe('auth:delete-account-email', () => {
    it('sends the delete-account subject/copy (regression: these keys were previously missing)', async () => {
      await processor.process({
        name: 'auth:delete-account-email',
        data: {
          email: 'user@example.com',
          url: 'https://app.test/delete',
          token: 't',
          lang: 'en-US',
        },
      } as any);

      const [, subject, html] = notifyService.sendEmail.mock.calls[0];
      expect(subject).toBe('Confirm account deletion');
      expect(subject).not.toBe('auth.delete_account_email.subject');
      expect(html).toContain('Delete your account?');
      expect(html).toContain('Delete my account');
    });

    it('translates to French when lang is fr-FR', async () => {
      await processor.process({
        name: 'auth:delete-account-email',
        data: {
          email: 'user@example.com',
          url: 'https://app.test/delete',
          token: 't',
          lang: 'fr-FR',
        },
      } as any);

      const [, subject, html] = notifyService.sendEmail.mock.calls[0];
      expect(subject).toBe('Confirmez la suppression du compte');
      expect(html).toContain('Supprimer votre compte ?');
    });
  });

  describe('auth:reset-password', () => {
    it('sends the reset-password subject/copy', async () => {
      await processor.process({
        name: 'auth:reset-password',
        data: {
          email: 'user@example.com',
          url: 'https://app.test/reset',
          token: 't',
          lang: 'en-US',
        },
      } as any);

      const [, subject, html] = notifyService.sendEmail.mock.calls[0];
      expect(subject).toBe('Reset your password');
      expect(html).toContain('Forgot Password?');
    });
  });

  describe('OTP email jobs', () => {
    it.each([
      [
        'auth:sign-in-otp-email',
        'sign-in',
        'Your sign-in code',
        'Here is your sign-in code: 123456.',
      ],
      [
        'auth:verification-otp-email',
        'email-verification',
        'Verify your email address',
        'Here is your verification code: 123456.',
      ],
      [
        'auth:password-reset-otp-email',
        'forget-password',
        'Reset your password',
        'Here is your code to reset your password: 123456.',
      ],
    ])(
      '%s renders the %s-specific subject and interpolates the otp',
      async (jobName, type, subject, textSnippet) => {
        await processor.process({
          name: jobName,
          data: { email: 'user@example.com', otp: '123456', type, lang: 'en-US' },
        } as any);

        const [, sentSubject, html] = notifyService.sendEmail.mock.calls[0];
        expect(sentSubject).toBe(subject);
        expect(html).toContain(textSnippet);
      },
    );

    it('throws (and lets the outer handler rethrow) for an unrecognized otp type', async () => {
      await expect(
        processor.process({
          name: 'auth:sign-in-otp-email',
          data: { email: 'user@example.com', otp: '123456', type: 'bogus', lang: 'en-US' },
        } as any),
      ).rejects.toThrow('Invalid OTP email type');

      expect(notifyService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('follow:new', () => {
    it('pushes to the target user with the actor name and profile url', async () => {
      const { user: actor } = await createTestUser(testDb.db, { user: { name: 'Alice' } });
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });

      await processor.process({
        name: 'follow:new',
        data: { actorId: actor.id, targetUserId: target.id },
      } as any);

      expect(notifyService.sendPushNotifications).toHaveBeenCalledTimes(1);
      const [devices, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(devices).toHaveLength(1);
      expect(payload.title).toBe('New follower !');
      expect(payload.body).toBe('Alice started following you');
      expect(payload.data).toEqual({
        type: 'follow:new',
        url: `/@${actor.username}`,
        actorId: actor.id,
        actorUsername: actor.username,
      });
    });

    it('does nothing when the actor no longer exists', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });

      await processor.process({
        name: 'follow:new',
        data: { actorId: randomUUID(), targetUserId: target.id },
      } as any);

      expect(notifyService.sendPushNotifications).not.toHaveBeenCalled();
    });

    it('does not push when the target has no active devices', async () => {
      const { user: actor } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);

      await processor.process({
        name: 'follow:new',
        data: { actorId: actor.id, targetUserId: target.id },
      } as any);

      expect(notifyService.sendPushNotifications).not.toHaveBeenCalled();
    });

    it('excludes devices whose session has expired', async () => {
      const { user: actor } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await createExpiredDevice(testDb, { userId: target.id, provider: 'fcm' });

      await processor.process({
        name: 'follow:new',
        data: { actorId: actor.id, targetUserId: target.id },
      } as any);

      expect(notifyService.sendPushNotifications).not.toHaveBeenCalled();
    });

    it('builds an absolute avatar url from a stored filename, and omits avatar when there is none', async () => {
      const { user: actorWithAvatar } = await createTestUser(testDb.db, {
        user: { name: 'Alice', image: 'avatar.png' },
      });
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });

      await processor.process({
        name: 'follow:new',
        data: { actorId: actorWithAvatar.id, targetUserId: target.id },
      } as any);

      const [, payloadWithAvatar] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payloadWithAvatar.avatar).toEqual({
        url: 'https://cdn.test/medias/avatars/avatar.png',
        name: 'Alice',
        id: actorWithAvatar.id,
      });

      const { user: actorNoAvatar } = await createTestUser(testDb.db);
      await processor.process({
        name: 'follow:new',
        data: { actorId: actorNoAvatar.id, targetUserId: target.id },
      } as any);

      const [, payloadNoAvatar] = notifyService.sendPushNotifications.mock.calls[1];
      expect(payloadNoAvatar.avatar).toBeUndefined();
    });

    it('passes an absolute image url straight through unchanged', async () => {
      const { user: actor } = await createTestUser(testDb.db, {
        user: { image: 'https://external.example.com/pic.jpg' },
      });
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });

      await processor.process({
        name: 'follow:new',
        data: { actorId: actor.id, targetUserId: target.id },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.avatar.url).toBe('https://external.example.com/pic.jpg');
    });
  });

  describe('follow:request / follow:accepted', () => {
    it('follow:request uses the follow-request copy', async () => {
      const { user: actor } = await createTestUser(testDb.db, { user: { name: 'Bob' } });
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });

      await processor.process({
        name: 'follow:request',
        data: { actorId: actor.id, targetUserId: target.id },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.title).toBe('New follow request !');
      expect(payload.body).toBe('Bob requested to follow you');
      expect(payload.data.type).toBe('follow:request');
    });

    it('follow:accepted uses the follow-accepted copy', async () => {
      const { user: actor } = await createTestUser(testDb.db, { user: { name: 'Carol' } });
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });

      await processor.process({
        name: 'follow:accepted',
        data: { actorId: actor.id, targetUserId: target.id },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.title).toBe('Follow request accepted !');
      expect(payload.body).toBe('Carol accepted your follow request');
      expect(payload.data.type).toBe('follow:accepted');
    });
  });

  describe('reco:completed', () => {
    it('does nothing when there are no senders', async () => {
      const { user: watcher } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);

      await processor.process({
        name: 'reco:completed',
        data: { userId: watcher.id, senderIds: [], mediaId: movie.id, type: 'movie' },
      } as any);

      expect(notifyService.sendPushNotifications).not.toHaveBeenCalled();
    });

    it('throws when the watcher no longer exists', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);

      await expect(
        processor.process({
          name: 'reco:completed',
          data: { userId: randomUUID(), senderIds: [sender.id], mediaId: movie.id, type: 'movie' },
        } as any),
      ).rejects.toThrow('Watcher not found');
    });

    it('notifies each sender with the watcher name correctly interpolated (regression for the receiverName arg-key bug)', async () => {
      const { user: watcher } = await createTestUser(testDb.db, { user: { name: 'Dana' } });
      const { user: sender } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: sender.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db, { originalTitle: 'The Great Movie' });

      await processor.process({
        name: 'reco:completed',
        data: { userId: watcher.id, senderIds: [sender.id], mediaId: movie.id, type: 'movie' },
      } as any);

      expect(notifyService.sendPushNotifications).toHaveBeenCalledTimes(1);
      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.title).toBe('Your reco has been completed !');
      expect(payload.body).toBe("Dana watched The Great Movie that you reco'd");
      expect(payload.body).not.toContain('undefined');
      expect(payload.data.mediaType).toBe('movie');
    });

    it('resolves a tv_series title through the series view', async () => {
      const { user: watcher } = await createTestUser(testDb.db, { user: { name: 'Eli' } });
      const { user: sender } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: sender.id, provider: 'fcm' });
      const series = await createTestTvSeries(testDb.db, { originalName: 'The Great Series' });

      await processor.process({
        name: 'reco:completed',
        data: { userId: watcher.id, senderIds: [sender.id], mediaId: series.id, type: 'tv_series' },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.body).toBe("Eli watched The Great Series that you reco'd");
      expect(payload.data.mediaType).toBe('tv_series');
    });

    it('does not push when none of the senders have active devices', async () => {
      const { user: watcher } = await createTestUser(testDb.db);
      const { user: sender } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);

      await processor.process({
        name: 'reco:completed',
        data: { userId: watcher.id, senderIds: [sender.id], mediaId: movie.id, type: 'movie' },
      } as any);

      expect(notifyService.sendPushNotifications).not.toHaveBeenCalled();
    });
  });

  describe('reco:received', () => {
    it('does nothing when there are no receivers', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);

      await processor.process({
        name: 'reco:received',
        data: { senderId: sender.id, receiverIds: [], mediaId: movie.id, type: 'movie' },
      } as any);

      expect(notifyService.sendPushNotifications).not.toHaveBeenCalled();
    });

    it('does not push when the sender no longer exists (regression: previously sent a broken/blank-name notification)', async () => {
      const { user: receiver } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: receiver.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db);

      await processor.process({
        name: 'reco:received',
        data: {
          senderId: randomUUID(),
          receiverIds: [receiver.id],
          mediaId: movie.id,
          type: 'movie',
        },
      } as any);

      expect(notifyService.sendPushNotifications).not.toHaveBeenCalled();
    });

    it('sends the with-comment body variant when a comment is present', async () => {
      const { user: sender } = await createTestUser(testDb.db, { user: { name: 'Finn' } });
      const { user: receiver } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: receiver.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db, { originalTitle: 'Some Movie' });

      await processor.process({
        name: 'reco:received',
        data: {
          senderId: sender.id,
          receiverIds: [receiver.id],
          mediaId: movie.id,
          type: 'movie',
          comment: 'You have to see this!',
        },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.body).toBe('Finn: You have to see this!');
    });

    it('sends the plain body variant (with media title) when there is no comment', async () => {
      const { user: sender } = await createTestUser(testDb.db, { user: { name: 'Gwen' } });
      const { user: receiver } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: receiver.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db, { originalTitle: 'Another Movie' });

      await processor.process({
        name: 'reco:received',
        data: { senderId: sender.id, receiverIds: [receiver.id], mediaId: movie.id, type: 'movie' },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.body).toBe("Gwen just reco'd Another Movie");
    });

    it('groups receivers by language and sends one localized push per language', async () => {
      const { user: sender } = await createTestUser(testDb.db, { user: { name: 'Hana' } });
      const { user: receiverEn } = await createTestUser(testDb.db, { user: { language: 'en-US' } });
      const { user: receiverFr } = await createTestUser(testDb.db, { user: { language: 'fr-FR' } });
      await createDevice(testDb, { userId: receiverEn.id, provider: 'fcm' });
      await createDevice(testDb, { userId: receiverFr.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db, { originalTitle: 'Multilang Movie' });

      await processor.process({
        name: 'reco:received',
        data: {
          senderId: sender.id,
          receiverIds: [receiverEn.id, receiverFr.id],
          mediaId: movie.id,
          type: 'movie',
        },
      } as any);

      expect(notifyService.sendPushNotifications).toHaveBeenCalledTimes(2);
      const bodies = notifyService.sendPushNotifications.mock.calls.map(
        ([, payload]) => payload.body,
      );
      expect(bodies).toContain("Hana just reco'd Multilang Movie");
      expect(bodies).toContain('Hana vous a reco Multilang Movie');
    });

    it('dedupes devices sharing the same provider+token across different receivers (e.g. a shared physical device)', async () => {
      const { user: sender } = await createTestUser(testDb.db, { user: { name: 'Ivan' } });
      const { user: receiverA } = await createTestUser(testDb.db);
      const { user: receiverB } = await createTestUser(testDb.db);
      await createDevice(testDb, {
        userId: receiverA.id,
        provider: 'fcm',
        token: 'shared-device-token',
      });
      await createDevice(testDb, {
        userId: receiverB.id,
        provider: 'fcm',
        token: 'shared-device-token',
      });
      const movie = await createTestMovie(testDb.db, { originalTitle: 'Shared Device Movie' });

      await processor.process({
        name: 'reco:received',
        data: {
          senderId: sender.id,
          receiverIds: [receiverA.id, receiverB.id],
          mediaId: movie.id,
          type: 'movie',
        },
      } as any);

      expect(notifyService.sendPushNotifications).toHaveBeenCalledTimes(1);
      const [devices] = notifyService.sendPushNotifications.mock.calls[0];
      expect(devices).toHaveLength(1);
    });
  });

  describe('review:liked', () => {
    it('does nothing when the actor no longer exists', async () => {
      const { user: reviewAuthor } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db);

      await processor.process({
        name: 'review:liked',
        data: {
          actorId: randomUUID(),
          targetUserId: target.id,
          reviewAuthorId: reviewAuthor.id,
          reviewId: 1,
          mediaId: movie.id,
          mediaType: 'movie',
        },
      } as any);

      expect(notifyService.sendPushNotifications).not.toHaveBeenCalled();
    });

    it('does nothing when the review author no longer exists', async () => {
      const { user: actor } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db);

      await processor.process({
        name: 'review:liked',
        data: {
          actorId: actor.id,
          targetUserId: target.id,
          reviewAuthorId: randomUUID(),
          reviewId: 1,
          mediaId: movie.id,
          mediaType: 'movie',
        },
      } as any);

      expect(notifyService.sendPushNotifications).not.toHaveBeenCalled();
    });

    it('pushes with the actor name, media title/poster, and the review author username', async () => {
      const { user: actor } = await createTestUser(testDb.db, { user: { name: 'Ivy' } });
      const { user: reviewAuthor } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db, { originalTitle: 'Reviewed Movie' });
      await testDb.db.insert(tmdbMovieImage).values({
        movieId: movie.id,
        filePath: '/poster.jpg',
        type: 'poster',
      });

      await processor.process({
        name: 'review:liked',
        data: {
          actorId: actor.id,
          targetUserId: target.id,
          reviewAuthorId: reviewAuthor.id,
          reviewId: 1,
          mediaId: movie.id,
          mediaType: 'movie',
        },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.title).toBe('Ivy liked your review !');
      expect(payload.body).toBe('Ivy liked your review of Reviewed Movie');
      expect(payload.attachmentUrl).toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
      expect(payload.data.reviewAuthorUsername).toBe(reviewAuthor.username);
    });
  });

  describe('review:commented', () => {
    it('sends the with-comment body variant when a comment is present', async () => {
      const { user: actor } = await createTestUser(testDb.db, { user: { name: 'Jack' } });
      const { user: reviewAuthor } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db);

      await processor.process({
        name: 'review:commented',
        data: {
          actorId: actor.id,
          targetUserId: target.id,
          reviewAuthorId: reviewAuthor.id,
          reviewId: 1,
          mediaId: movie.id,
          mediaType: 'movie',
          comment: 'Nice review!',
        },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.title).toBe('New comment on your review !');
      expect(payload.body).toBe('Jack: Nice review!');
    });

    it('sends the plain body variant (with media title) when there is no comment', async () => {
      const { user: actor } = await createTestUser(testDb.db, { user: { name: 'Kim' } });
      const { user: reviewAuthor } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db, { originalTitle: 'Commented Movie' });

      await processor.process({
        name: 'review:commented',
        data: {
          actorId: actor.id,
          targetUserId: target.id,
          reviewAuthorId: reviewAuthor.id,
          reviewId: 1,
          mediaId: movie.id,
          mediaType: 'movie',
        },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.body).toBe('Kim commented on your review of Commented Movie');
    });
  });

  describe('review-comment:liked', () => {
    it('pushes with the comment-liked copy', async () => {
      const { user: actor } = await createTestUser(testDb.db, { user: { name: 'Liam' } });
      const { user: reviewAuthor } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db, { originalTitle: 'Liked Comment Movie' });

      await processor.process({
        name: 'review-comment:liked',
        data: {
          actorId: actor.id,
          targetUserId: target.id,
          reviewAuthorId: reviewAuthor.id,
          reviewId: 1,
          commentId: 1,
          mediaId: movie.id,
          mediaType: 'movie',
        },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.title).toBe('Liam liked your comment !');
      expect(payload.body).toBe('Liam liked your comment on Liked Comment Movie');
    });
  });

  describe('review-comment:replied', () => {
    it('sends the with-comment body variant when a comment is present', async () => {
      const { user: actor } = await createTestUser(testDb.db, { user: { name: 'Mona' } });
      const { user: reviewAuthor } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await createDevice(testDb, { userId: target.id, provider: 'fcm' });
      const movie = await createTestMovie(testDb.db);

      await processor.process({
        name: 'review-comment:replied',
        data: {
          actorId: actor.id,
          targetUserId: target.id,
          reviewAuthorId: reviewAuthor.id,
          reviewId: 1,
          commentId: 1,
          parentCommentId: 2,
          mediaId: movie.id,
          mediaType: 'movie',
          comment: 'Totally agree!',
        },
      } as any);

      const [, payload] = notifyService.sendPushNotifications.mock.calls[0];
      expect(payload.title).toBe('New reply to your comment !');
      expect(payload.body).toBe('Mona: Totally agree!');
    });
  });

  describe('unhandled job names', () => {
    it('logs a warning and does not call the notify service', async () => {
      await expect(
        processor.process({ name: 'something:unknown', data: {} } as any),
      ).resolves.toBeUndefined();

      expect(notifyService.sendEmail).not.toHaveBeenCalled();
      expect(notifyService.sendPushNotifications).not.toHaveBeenCalled();
    });
  });
});
