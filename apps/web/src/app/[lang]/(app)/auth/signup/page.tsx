
"use client"

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
  } from "@/components/ui/card"
import { Icons } from '@/config/icons';
import { Images } from '@/config/images';
import { useRandomImage } from '@/hooks/use-random-image';
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useSupabaseClient } from '@/context/supabase-context';
import { useLocale, useTranslations } from 'next-intl';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import toast from 'react-hot-toast';
import { AuthError } from '@supabase/supabase-js';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/use-debounce';
import { useUsernameAvailability } from '@/hooks/use-username-availability';
import { InputPassword } from '@/components/ui/input-password';
import { Turnstile } from "next-turnstile";
import { upperFirst } from 'lodash';

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 15;
const FULL_NAME_MIN_LENGTH = 1;
const FULL_NAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;

export default function Signup() {
	const supabase = useSupabaseClient();
	const { signup, loginWithOtp } = useAuth();
	const t = useTranslations('pages.auth.signup');
	const common = useTranslations('common');

	const locale = useLocale();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get('redirect');
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const bgImage = useRandomImage(Images.auth.signup.background);
	const [turnstileStatus, setTurnstileStatus] = useState<"success" | "error" | "expired" | "required">("required");
	const [turnstileError, setTurnstileError] = useState<string | null>(null);
	/* ------------------------------- FORM SCHEMA ------------------------------ */
	const signupSchema = z.object({
		email: z.string().email({
		message: common('form.email.error.invalid'),
		}),
		username: z
		.string()
		.min(USERNAME_MIN_LENGTH, {
			message: common('form.length.char_min', { count: USERNAME_MIN_LENGTH }),
		})
		.max(USERNAME_MAX_LENGTH, {
			message: common('form.length.char_max', { count: USERNAME_MAX_LENGTH }),
		})
		.regex(/^[^\W]/, {
			message: common('form.username.schema.first_char'),
		})
		.regex(/^(?!.*\.\.)/, {
			message: common('form.username.schema.double_dot'),
		})
		.regex(/^(?!.*\.$)/, {
			message: common('form.username.schema.ends_with_dot'),
		})
		.regex(/^[\w.]+$/, {
			message: common('form.username.schema.format'),
		}),
		full_name: z
		.string()
		.min(FULL_NAME_MIN_LENGTH, {
			message: common('form.length.char_min', { count: FULL_NAME_MIN_LENGTH }),
		})
		.max(FULL_NAME_MAX_LENGTH, {
			message: common('form.length.char_max', { count: FULL_NAME_MAX_LENGTH }),
		})
		.regex(/^[a-zA-Z0-9\s\S]*$/, {
			message: common('form.full_name.schema.format'),
		}),
		password: z
		.string()
		.min(PASSWORD_MIN_LENGTH, {
			message: common('form.length.char_min', { count: PASSWORD_MIN_LENGTH }),
		})
		.regex(/[A-Z]/, {
			message: common('form.password.schema.uppercase'),
		})
		.regex(/[a-z]/, {
			message: common('form.password.schema.lowercase'),
		})
		.regex(/[0-9]/, {
			message: common('form.password.schema.number'),
		})
		.regex(/[\W_]/, {
			message: common('form.password.schema.special'),
		}),
		confirm_password: z
		.string()
	}).refine(data => data.password === data.confirm_password, {
		message: common('form.password.schema.match'),
		path: ['confirm_password'],
	});

	type SignupFormValues = z.infer<typeof signupSchema>;

	const defaultValues: Partial<SignupFormValues> = {
		email: '',
		full_name: '',
		username: '',
		password: '',
		confirm_password: '',
	};
	/* -------------------------------------------------------------------------- */

	const form = useForm<SignupFormValues>({
		resolver: zodResolver(signupSchema),
		defaultValues: defaultValues,
		mode: 'onChange',
	});
	// OTP
	const numberOfDigits = 6;
	const [showOtp, setShowOtp] = useState<boolean>(false);
	const usernameAvailability = useUsernameAvailability();
	const usernameToCheck = useDebounce(form.watch('username'), 500);

	useEffect(() => {
		if (!form.formState.errors.username?.message && usernameToCheck) {
			usernameAvailability.check(usernameToCheck);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usernameToCheck]);

	useEffect(() => {
		if (usernameAvailability.isAvailable === false) {
			form.setError('username', {
				message: common('form.username.schema.unavailable'),
			});
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usernameAvailability.isAvailable, common]);
	
	const handleSubmit = useCallback(async (data: SignupFormValues) => {
		try {
			setIsLoading(true);
			if (turnstileStatus !== 'success') {
				toast.error(common('form.error.turnstile'));
				return;
			}
			await signup({
				email: data.email,
				name: data.full_name,
				username: data.username,
				password: data.password,
				language: locale,
			});
			toast.success(t('form.success', { email: data.email }));
			setShowOtp(true);
		} catch (error) {
			if (error instanceof AuthError) {
				switch (error.status) {
					case 422:
						toast.error(common('form.email.error.unavailable'));
						break;
					case 500:
						toast.error(common('form.username.schema.unavailable'));
						break;
					default:
						toast.error(error.message);
				}
			} else {
				toast.error(upperFirst(common('messages.an_error_occurred')));
			}
		} finally {
			setIsLoading(false);
		}
	}, [signup, t, common, locale, turnstileStatus]);

	const resendOtp = useCallback(async () => {
		try {
			setIsLoading(true);
			await loginWithOtp(form.getValues('email'), redirectTo);
			toast.success(common('form.code_sent'));
		} catch (error) {
			if (error instanceof AuthError) {
				switch (error.status) {
					case 429:
						toast.error(common('form.error.too_many_attempts'));
						break;
					default:
						toast.error(error.message);
				}
			} else {
				toast.error(upperFirst(common('messages.an_error_occurred')));
			}
		} finally {
			setIsLoading(false);
		}
	}, [loginWithOtp, redirectTo, form, common]);

	const handleVerifyOtp = useCallback(async (otp: string) => {
		try {
		  setIsLoading(true);
		  const { error } = await supabase.auth.verifyOtp({
			email: form.getValues('email'),
			token: otp,
			type: 'email',
		  });
		  if (error) throw error;
		  toast.success(common('form.email.verified'));
		  router.push(redirectTo || '/');
		  router.refresh();
		} catch (error) {
		  if (error instanceof AuthError) {
			switch (error.status) {
			  case 403:
				toast.error(common('form.error.invalid_code'));
				break
			  default:
				toast.error(error.message);
			}
		  } else {
			toast.error(upperFirst(common('messages.an_error_occurred')));
		  }
		} finally {
		  setIsLoading(false);
		}
	}, [supabase, router, redirectTo, form, common]);
	
	return (
	<div
		className="h-full w-full flex flex-col items-center justify-center"
		style={{
			backgroundImage: `url(${bgImage?.src})`,
			backgroundSize: 'cover',
			backgroundPosition: 'center',
			backgroundRepeat: 'no-repeat',
		}}
    >
	{!showOtp ? (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				<Card className="w-full max-w-[400px]">
					<CardHeader className='gap-2'>
					<CardTitle className='inline-flex gap-2 items-center justify-center'>
						<Icons.site.icon className='fill-accent-yellow w-8' />
						{upperFirst(common('messages.signup'))}
					</CardTitle>
					<CardDescription className='text-center'>{t('description')}</CardDescription>
					</CardHeader>
					<CardContent className='grid gap-2'>
						<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
						<FormItem>
							<FormLabel>{common('form.email.label')}</FormLabel>
							<FormControl>
								<Input
								autoComplete="email"
								disabled={isLoading}
								placeholder={common('form.email.placeholder')}
								{...field}
								/>
							</FormControl>
							<FormMessage className='sr-only' />
						</FormItem>
						)}
						/>
						<FormField
						control={form.control}
						name="username"
						render={({ field }) => (
							<FormItem>
							<FormLabel className='w-full flex justify-between gap-2'>
							{common('form.username.label')}
							<span className='text-xs text-destructive'>{(field?.value && field?.value?.length > USERNAME_MAX_LENGTH) ? `${field.value.length} / ${USERNAME_MAX_LENGTH}` : ''}</span>
							</FormLabel>
								<FormControl>
									<div className='relative'>
										<Input
										autoComplete="username"
										disabled={isLoading}
										placeholder={common('form.username.placeholder')}
										className={usernameAvailability.isLoading ? 'pr-8' : ''}
										{...field}
										/>
										{usernameAvailability.isLoading ?
										<div className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full flex justify-center items-center h-6 w-6">
											<Icons.loader className='w-4' />
										</div>
										: null}
									</div>
								</FormControl>
							<FormDescription></FormDescription>
							<FormMessage />
							</FormItem>
						)}
						/>
						<FormField
						control={form.control}
						name="full_name"
						render={({ field }) => (
							<FormItem>
							<FormLabel className="w-full flex justify-between gap-2">
							{common('form.full_name.label')}
							<span className='text-xs text-destructive'>{(field?.value && field?.value?.length > FULL_NAME_MAX_LENGTH) ? `${field.value.length} / ${FULL_NAME_MAX_LENGTH}` : ''}</span>
							</FormLabel>
							<FormControl>
								<Input
								autoComplete="given-name"
								disabled={isLoading}
								placeholder={common('form.full_name.placeholder')}
								{...field}
								/>
							</FormControl>
							<FormDescription></FormDescription>
							<FormMessage />
							</FormItem>
						)}
						/>
						<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
							<FormLabel>{common('form.password.label')}</FormLabel>
							<FormControl>
								<InputPassword
								disabled={isLoading}
								type="password"
								autoComplete="new-password"
								placeholder={common('form.password.placeholder')}
								{...field}
								/>
							</FormControl>
							<FormDescription></FormDescription>
							<FormMessage />
							</FormItem>
						)}
						/>
						<FormField
						control={form.control}
						name="confirm_password"
						render={({ field }) => (
							<FormItem>
							<FormLabel>{common('form.password.confirm.label')}</FormLabel>
							<FormControl>
								<InputPassword
								disabled={isLoading}
								type="password"
								autoComplete="new-password"
								placeholder={common('form.password.confirm.placeholder')}
								{...field}
								/>
							</FormControl>
							<FormDescription></FormDescription>
							<FormMessage />
							</FormItem>
						)}
						/>
						<div className="flex flex-col items-center justify-center gap-2">
							<Turnstile
							siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
							retry="auto"
							refreshExpired="auto"
							language={locale}
							sandbox={process.env.NODE_ENV === "development"}
							onError={() => {
								setTurnstileStatus("error");
								setTurnstileError("Security check failed. Please try again.");
							}}
							onExpire={() => {
								setTurnstileStatus("expired");
								setTurnstileError("Security check expired. Please verify again.");
							}}
							onLoad={() => {
								setTurnstileStatus("required");
								setTurnstileError(null);
							}}
							onVerify={(token) => {
								setTurnstileStatus("success");
								setTurnstileError(null);
							}}
							/>
							{turnstileError && (
								<p className="text-sm text-destructive text-center">
									{turnstileError}
								</p>
							)}
						</div>
					</CardContent>
					<CardFooter className='grid gap-2'>
						<Button
						className="w-full"
						disabled={isLoading || turnstileStatus !== 'success' || !form.formState.isValid}
						>
							{isLoading ? (<Icons.loader />) : null}
							{upperFirst(common('messages.signup'))}
						</Button>
						<p className="px-8 text-center text-sm text-muted-foreground">
							{t('return_to_login')}{' '}
							<Button variant={'link'} className='text-accent-yellow inline p-0' asChild>
								<Link href={{ pathname: '/auth/login', query: redirectTo ? { redirect: redirectTo } : undefined }}>
								{upperFirst(common('messages.login'))}
								</Link>
							</Button>
						</p>
					</CardFooter>
				</Card>
			</form>
		</Form>
	) : (
		<Card className='w-full max-w-[400px]'>
			<CardHeader className='gap-2'>
				<CardTitle className='inline-flex gap-2 items-center justify-center'>
					<Icons.site.icon className='fill-accent-yellow w-8' />
					{t('confirm_form.label')}
				</CardTitle>
				<CardDescription>{t('confirm_form.description', { email: form.getValues('email') })}</CardDescription>
			</CardHeader>
			<CardContent className='grid gap-2 justify-items-center'>
				<InputOTP disabled={isLoading} maxLength={numberOfDigits} onChange={(e) => e.length === numberOfDigits && handleVerifyOtp(e)}>
					<InputOTPGroup>
						{Array.from({ length: numberOfDigits }).map((_, index) => (
						<InputOTPSlot key={index} index={index}/>
						))}
					</InputOTPGroup>
				</InputOTP>
			</CardContent>
			<CardFooter>
				<p className="px-8 text-center text-sm text-muted-foreground">
					{common('form.error.not_received_code')}{' '}
					<Button variant='link' className='text-accent-yellow p-0' disabled={isLoading} onClick={resendOtp}>
					{common('form.resend_code')}
					</Button>
				</p>
			</CardFooter>
		</Card>
	)}
	</div>
	)
}
