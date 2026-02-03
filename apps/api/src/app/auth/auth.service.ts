import { Provider } from '@nestjs/common';
import { APIError, betterAuth } from 'better-auth';
import { createAuthMiddleware, magicLink, openAPI, username } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { ENV_SERVICE, EnvService } from '@libs/env'; // Ton token
import { DRIZZLE_SERVICE, DrizzleService } from '@libs/core';
import { MailerClient } from '@shared/mailer';
import { profile } from '@libs/core/schemas';
import { v7 as uuidv7 } from "uuid";

export const AUTH_SERVICE = 'AUTH_SERVICE';

const createBetterAuth = ({
	env,
	db,
	mailer,
}: {
	env: EnvService;
	db: DrizzleService;
	mailer: MailerClient;
}) => {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'pg',
		}),
		trustedOrigins: [
			"http://localhost:3000",
			env.WEB_APP_URL,
		],
		baseURL: env.API_URL,
		basePath: '/auth',
		secret: env.AUTH_SECRET,
		advanced: {
			database: {
				generateId: () => uuidv7(),
			}
		},
		plugins: [
			username({
				minUsernameLength: 3,
				maxUsernameLength: 15,
				usernameValidator: (username) => {
					const usernameRegex = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{2,14}$/;
					return usernameRegex.test(username);
				},
				usernameNormalization: (username) => username.trim().toLowerCase(),
			}),
			openAPI(),
			magicLink({
				sendMagicLink: async ({ email, token, url }, ctx) => {
					// TODO: Add mailer service to send email
				},
				disableSignUp: true,
			}),
		],
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						await db.insert(profile).values({
							id: user.id,
						});
					},
				}
			}
		},
		hooks: {
			before: createAuthMiddleware(async (ctx) => {
				if (ctx.path !== '/sign-up/email' && ctx.path !== '/update-user') return

				const body = ctx.body as { username?: string }; 

				if (!body.username) {
					throw new APIError('BAD_REQUEST', {
						code: 'USERNAME_REQUIRED',
						message: 'Username is required'
					});
				}
			})
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
		},
		emailVerification: {
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, token, url }) => {
				await mailer.emit('auth:verification-email', {
					email: user.email,
					token,
					url,
					lang: 'en',
				});
			},
		},
		user: {
			additionalFields: {
				usernameUpdatedAt: {
					type: 'date',
					required: false,
					defaultValue: null,
					input: false,
				},
			},
		},
		socialProviders: {
			github: {
				clientId: env.AUTH_GITHUB_CLIENT_ID,
				clientSecret: env.AUTH_GITHUB_CLIENT_SECRET,
			}
		},
		experimental: {
			joins: true,
		},
	})
};

export type AuthService = ReturnType<typeof createBetterAuth>;

export const AuthProvider: Provider = {
  provide: AUTH_SERVICE,
  inject: [ENV_SERVICE, DRIZZLE_SERVICE, MailerClient],
  useFactory: (env: EnvService, db: DrizzleService, mailer: MailerClient) => { 
    return createBetterAuth({ env, db, mailer });
  },
};