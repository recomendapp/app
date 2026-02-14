import { SendDeleteAccountVerificationEmailDto, SendVerificationEmailDto } from "./auth.dto";

export type NotifyAuthRegistry = {
  'auth:verification-email': SendVerificationEmailDto;
  'auth:delete-account-email': SendDeleteAccountVerificationEmailDto;
};