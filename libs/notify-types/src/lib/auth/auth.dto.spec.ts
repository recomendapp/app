import { SendOtpEmailSchema, SendVerificationEmailSchema } from './auth.dto';

describe('SendVerificationEmailSchema', () => {
  const valid = { email: 'user@example.com', url: 'https://app.test/verify', token: 't' };

  it('accepts a valid payload and defaults lang', () => {
    const result = SendVerificationEmailSchema.parse(valid);
    expect(result).toEqual({ ...valid, lang: 'en-US' });
  });

  it('rejects an invalid email', () => {
    expect(SendVerificationEmailSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(
      false,
    );
  });

  it('rejects an invalid url', () => {
    expect(SendVerificationEmailSchema.safeParse({ ...valid, url: 'not-a-url' }).success).toBe(
      false,
    );
  });

  it('rejects a missing token', () => {
    const { token, ...rest } = valid;
    expect(SendVerificationEmailSchema.safeParse(rest).success).toBe(false);
  });
});

describe('SendOtpEmailSchema', () => {
  const valid = { email: 'user@example.com', otp: '123456', type: 'sign-in' as const };

  it('accepts every documented otp type', () => {
    for (const type of ['sign-in', 'email-verification', 'forget-password']) {
      expect(SendOtpEmailSchema.safeParse({ ...valid, type }).success).toBe(true);
    }
  });

  it('rejects an unrecognized otp type', () => {
    expect(SendOtpEmailSchema.safeParse({ ...valid, type: 'bogus' }).success).toBe(false);
  });
});
