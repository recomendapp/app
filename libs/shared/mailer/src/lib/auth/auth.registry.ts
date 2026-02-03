import { SendVerificationEmailDto } from "./auth.dto";

export type MailerAuthRegistry = {
  'auth:verification-email': SendVerificationEmailDto;
};