const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

jest.mock('../env', () => ({
  env: { RESEND_API_KEY: 're_test_key', RESEND_FROM_EMAIL: 'noreply@recomend.test' },
}));

import { NotifyService } from './notify.service';

describe('NotifyService', () => {
  let fcmService: { sendMulticast: jest.Mock };
  let apnsService: { sendToDevices: jest.Mock };
  let service: NotifyService;

  beforeEach(() => {
    mockSend.mockReset();
    fcmService = { sendMulticast: jest.fn().mockResolvedValue([]) };
    apnsService = { sendToDevices: jest.fn().mockResolvedValue([]) };
    service = new NotifyService(fcmService as any, apnsService as any);
  });

  describe('sendEmail', () => {
    it('sends via Resend using the configured from address and returns the response', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

      const result = await service.sendEmail('to@example.com', 'Subject', '<p>Hi</p>');

      expect(mockSend).toHaveBeenCalledWith({
        from: 'noreply@recomend.test',
        to: ['to@example.com'],
        subject: 'Subject',
        html: '<p>Hi</p>',
      });
      expect(result).toEqual({ data: { id: 'email-1' }, error: null });
    });

    it('throws when Resend reports an error in the response body', async () => {
      mockSend.mockResolvedValue({ data: null, error: { message: 'invalid recipient' } });

      await expect(service.sendEmail('bad@example.com', 'Subject', '<p>Hi</p>')).rejects.toThrow(
        'invalid recipient',
      );
    });

    it('rethrows when the Resend call itself throws', async () => {
      mockSend.mockRejectedValue(new Error('network down'));

      await expect(service.sendEmail('to@example.com', 'Subject', '<p>Hi</p>')).rejects.toThrow(
        'network down',
      );
    });
  });

  describe('sendPushNotifications', () => {
    it('splits devices by provider and forwards each group to the matching SDK service', async () => {
      const devices = [
        { provider: 'fcm' as const, token: 'fcm-1' },
        { provider: 'apns' as const, token: 'apns-1' },
        { provider: 'fcm' as const, token: 'fcm-2' },
      ];

      await service.sendPushNotifications(devices, {
        title: 'Title',
        body: 'Body',
        data: { type: 'follow:new' } as any,
      });

      expect(fcmService.sendMulticast).toHaveBeenCalledWith(
        ['fcm-1', 'fcm-2'],
        'Title',
        'Body',
        { type: 'follow:new' },
        undefined,
      );
      expect(apnsService.sendToDevices).toHaveBeenCalledWith(
        ['apns-1'],
        'Title',
        'Body',
        { type: 'follow:new' },
        { avatar: undefined, attachmentUrl: undefined },
      );
    });

    it('prefers the avatar url over the attachment url as the FCM image', async () => {
      await service.sendPushNotifications([{ provider: 'fcm' as const, token: 'fcm-1' }], {
        title: 'Title',
        body: 'Body',
        data: {} as any,
        avatar: { url: 'https://example.com/avatar.png', name: 'Alice', id: 'user-1' },
        attachmentUrl: 'https://example.com/poster.png',
      });

      expect(fcmService.sendMulticast).toHaveBeenCalledWith(
        ['fcm-1'],
        'Title',
        'Body',
        {},
        'https://example.com/avatar.png',
      );
    });

    it('falls back to the attachment url as the FCM image when there is no avatar', async () => {
      await service.sendPushNotifications([{ provider: 'fcm' as const, token: 'fcm-1' }], {
        title: 'Title',
        body: 'Body',
        data: {} as any,
        attachmentUrl: 'https://example.com/poster.png',
      });

      expect(fcmService.sendMulticast).toHaveBeenCalledWith(
        ['fcm-1'],
        'Title',
        'Body',
        {},
        'https://example.com/poster.png',
      );
    });

    it('does not throw when some tokens fail to deliver', async () => {
      fcmService.sendMulticast.mockResolvedValue(['fcm-1']);
      apnsService.sendToDevices.mockResolvedValue(['apns-1']);

      await expect(
        service.sendPushNotifications(
          [
            { provider: 'fcm' as const, token: 'fcm-1' },
            { provider: 'apns' as const, token: 'apns-1' },
          ],
          { title: 'Title', body: 'Body', data: {} as any },
        ),
      ).resolves.toBeUndefined();
    });
  });
});
