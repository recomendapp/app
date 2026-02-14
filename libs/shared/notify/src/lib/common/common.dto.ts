import z from "zod";

export const LangSchema = z.object({
	lang: z.enum(['en']).default("en"),
});