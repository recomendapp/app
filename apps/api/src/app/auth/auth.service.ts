import { Provider } from '@nestjs/common';
import { APIError, betterAuth } from 'better-auth';
import { emailOTP, openAPI, username } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { ENV_SERVICE, EnvService } from '@libs/env';
import { NotifyClient } from '@shared/notify';
import { WorkerClient } from '@shared/worker';
import { profile, user } from '@libs/db/schemas';
import { v7 as uuidv7 } from 'uuid';
import { USER_RULES } from '../../config/validation-rules';
import bcrypt from "bcrypt"; 
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { defaultSupportedLocale, SupportedLocale } from '@libs/i18n';
import { additionalFields, auth } from '@libs/db';
import { generateUniqueUsername } from '../../utils/generate-username';
import { eq } from 'drizzle-orm';
import { createAuthMiddleware } from 'better-auth/api';

export const AUTH_SERVICE = 'AUTH_SERVICE';

const createBetterAuth = ({
	env,
	db,
	notify,
	worker,
}: {
	env: EnvService;
	db: DrizzleService;
	notify: NotifyClient;
	worker: WorkerClient;
}) => {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'pg',
		}),
		cookie: {
            domain: env.NODE_ENV === 'production' ? env.AUTH_COOKIE_DOMAIN : undefined,
        },
		trustedOrigins: [
			"http://localhost:3000",
			env.WEB_APP_URL,
			env.MOBILE_APP_SCHEME,
		],
		baseURL: env.API_URL,
		basePath: '/auth',
		secret: env.AUTH_SECRET,
		advanced: {
			useSecureCookies: env.NODE_ENV === 'production',
			database: {
				generateId: () => uuidv7(),
			}
		},
		plugins: [
			username({
				minUsernameLength: USER_RULES.USERNAME.MIN,
				maxUsernameLength: USER_RULES.USERNAME.MAX,
				usernameValidator: (username) => USER_RULES.USERNAME.REGEX.test(username),
				usernameNormalization: USER_RULES.USERNAME.normalization,
			}),
			openAPI(),
			// magicLink({
			// 	sendMagicLink: async ({ email, token, url }, ctx) => {
			// 	},
			// 	disableSignUp: true,
			// }),
			emailOTP({
				async sendVerificationOTP({ email, otp, type }) { 
					const userDb = await db.query.user.findFirst({
						where: (eq(user.email, email)),
						columns: {
							language: true,
						}
					});
					switch (type) {
						case 'sign-in':
							await notify.emit('auth:sign-in-otp-email', {
								email,
								otp,
								type,
								lang: (userDb?.language as SupportedLocale) || defaultSupportedLocale,
							});
							break;
						case 'email-verification':
							await notify.emit('auth:verification-otp-email', {
								email,
								otp,
								type,
								lang: (userDb?.language as SupportedLocale) || defaultSupportedLocale,
							});
							break;
						case 'forget-password':
							await notify.emit('auth:password-reset-otp-email', {
								email,
								otp,
								type,
								lang: (userDb?.language as SupportedLocale) || defaultSupportedLocale,
							});
							break;
					}
				}, 
			}),
			expo(),
		],
		databaseHooks: {
			user: {
				create: {
					before: async (userData) => {
                        let finalUsername = userData.username as string | undefined;
                        let finalName = userData.name;

                        if (!finalUsername) {
                            finalUsername = await generateUniqueUsername({
								email: userData.email,
								db,
							});
                        }

                        if (!finalName) {
                            finalName = finalUsername;
                        }

                        return {
                            data: {
                                ...userData,
                                username: finalUsername,
                                name: finalName,
                            }
                        };
                    },
					after: async (user) => {
						await db.insert(profile).values({
							id: user.id,
						});

						await worker.emit('search:sync-user', { userId: user.id, action: 'upsert' });
					},
				},
				update: {
					after: async (user) => {
						await worker.emit('search:sync-user', { userId: user.id, action: 'upsert' });
					},
				},
				delete: {
					after: async (user) => {
						await worker.emit('search:sync-user', { userId: user.id, action: 'delete' });
					},
				}
			}
		},
		disabledPaths: [
			'/update-user',
		],
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
			password: { 
				hash: async (password) => { 
					return await bcrypt.hash(password, 10); 
				}, 
				verify: async ({ hash, password }) => { 
					return await bcrypt.compare(password, hash); 
				} 
			},
			sendResetPassword: async ({ user, url, token }) => {
				const u = user as typeof auth.$Infer.Session.user;
				await notify.emit('auth:reset-password', {
					email: user.email,
					url,
					token,
					lang: (u.language as SupportedLocale) || defaultSupportedLocale,
				});
			},
		},
		emailVerification: {
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, token, url }) => {
				const u = user as typeof auth.$Infer.Session.user;
				await notify.emit('auth:verification-email', {
					email: user.email,
					token,
					url,
					lang: (u.language as SupportedLocale) || defaultSupportedLocale,
				});
			},
		},
		user: {
			changeEmail: {
				enabled: true,
			},
			deleteUser: {
				enabled: true,
				sendDeleteAccountVerification: async ({ user, token, url }) => {
					const u = user as typeof auth.$Infer.Session.user;
					await notify.emit('auth:delete-account-email', {
						email: user.email,
						token,
						url,
						lang: (u.language as SupportedLocale) || defaultSupportedLocale,
					});
				},
			},
			additionalFields: additionalFields,
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

export type Session = AuthService['$Infer']['Session']['session'];
export type User = AuthService['$Infer']['Session']['user'];

export const AuthProvider: Provider = {
	provide: AUTH_SERVICE,
	inject: [ENV_SERVICE, DRIZZLE_SERVICE, NotifyClient, WorkerClient],
	useFactory: (
		env: EnvService,
		db: DrizzleService,
		notify: NotifyClient,
		worker: WorkerClient,
	) => { 
		return createBetterAuth({ env, db, notify, worker });
	},
};