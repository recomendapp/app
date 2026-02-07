import { SendDeleteAccountVerificationEmailDto, SendVerificationEmailDto } from "./auth.dto";

export type MailerAuthRegistry = {
  'auth:verification-email': SendVerificationEmailDto;
  'auth:delete-account-email': SendDeleteAccountVerificationEmailDto;
};