import { z } from 'zod'; 
import { LangSchema } from '../common/common.dto';

export const SendVerificationEmailSchema = LangSchema.extend({
  email: z.email(),
  url: z.url(),
  token: z.string(),
});
export type SendVerificationEmailDto = z.infer<typeof SendVerificationEmailSchema>;