import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useRouter, Stack } from 'expo-router';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useDebounce from '../../hooks/useDebounce';
import { useUsernameAvailability } from '../../hooks/useUsernameAvailability';
import { Icons } from '../../constants/Icons';
import tw from '../../lib/tw';
import { useTheme } from '../../providers/ThemeProvider';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { upperFirst } from 'lodash';
import { Text } from '../../components/ui/text';
import { useLocale, useTranslations } from 'use-intl';
import { View } from '../../components/ui/view';
import { useToast } from '../../components/Toast';
import { OAuthProviders } from '../../components/OAuth/OAuthProviders';
import { logger } from '../../logger';
import { authClient } from '../../lib/auth/client';
import { makeRedirectUri } from 'expo-auth-session';
import { issueEmailHandoverToken } from '../../lib/auth/emailHandover';
import { MultiStepScreen } from '../../components/ui/MultistepScreen';
import { useModalHeaderOptions } from '../../hooks/useModalHeaderOptions';
import { useConfirmLeave } from '../../hooks/useConfirmLeave';
import { USER_RULES } from '@libs/rules';

enum STEPS {
  EMAIL = 1,
  USERNAME = 2,
  DISPLAY_NAME = 3,
  PASSWORD = 4,
  CONFIRM_PASSWORD = 5,
  EMAIL_VERIFICATION = 6,
}

// Before the verification email can be asked for again.
const RESEND_COOLDOWN_SECONDS = 30;

const verificationCallbackURL = async () => {
  // The link comes back on an unauthenticated channel, so it carries a nonce
  // this device issued -- see `lib/auth/emailHandover`. Failing to issue one
  // only costs the sign-in on arrival, so the mail still goes out without it.
  let handover: string | null = null;
  try {
    handover = await issueEmailHandoverToken();
  } catch (error) {
    logger.error('could not issue the email handover token', { error });
  }
  return makeRedirectUri({
    path: '/auth/email-confirmed',
    queryParams: handover ? { handover } : undefined,
  });
};

const SignupScreen = () => {
  const { colors, theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const modalHeaderOptions = useModalHeaderOptions({ forceCross: true });

  /* ------------------------------- FORM SCHEMA ------------------------------ */
  const signupSchema = useMemo(
    () =>
      z
        .object({
          email: z.email({
            error: t('common.form.email.error.invalid'),
          }),
          username: z
            .string()
            .min(USER_RULES.USERNAME.MIN, {
              message: t('common.form.length.char_min', { count: USER_RULES.USERNAME.MIN }),
            })
            .max(USER_RULES.USERNAME.MAX, {
              message: t('common.form.length.char_max', { count: USER_RULES.USERNAME.MAX }),
            })
            .regex(/^[^\W]/, {
              message: t('common.form.username.schema.first_char'),
            })
            .regex(/^(?!.*\.\.)/, {
              message: t('common.form.username.schema.double_dot'),
            })
            .regex(/^(?!.*\.$)/, {
              message: t('common.form.username.schema.ends_with_dot'),
            })
            .regex(/^[\w.]+$/, {
              message: t('common.form.username.schema.format'),
            }),
          // Left empty on purpose falls back to the username at submit, so the
          // length floor only applies to a name actually typed.
          full_name: z
            .string()
            .max(USER_RULES.NAME.MAX, {
              message: t('common.form.length.char_max', { count: USER_RULES.NAME.MAX }),
            })
            .refine((value) => value === '' || value.trim().length >= USER_RULES.NAME.MIN, {
              message: t('common.form.length.char_min', { count: USER_RULES.NAME.MIN }),
            }),
          password: z
            .string()
            .min(USER_RULES.PASSWORD.MIN, {
              message: t('common.form.length.char_min', { count: USER_RULES.PASSWORD.MIN }),
            })
            .max(USER_RULES.PASSWORD.MAX, {
              message: t('common.form.length.char_max', { count: USER_RULES.PASSWORD.MAX }),
            })
            .regex(/[A-Z]/, {
              message: t('common.form.password.schema.uppercase'),
            })
            .regex(/[a-z]/, {
              message: t('common.form.password.schema.lowercase'),
            })
            .regex(/[0-9]/, {
              message: t('common.form.password.schema.number'),
            })
            .regex(/[\W_]/, {
              message: t('common.form.password.schema.special'),
            }),
          confirm_password: z.string(),
        })
        .refine((data) => data.password === data.confirm_password, {
          message: t('common.form.password.schema.match'),
          path: ['confirm_password'],
        }),
    [t],
  );
  type SignupFormValues = z.infer<typeof signupSchema>;
  /* -------------------------------------------------------------------------- */

  const {
    setError: formSetError,
    getValues: formGetValues,
    ...form
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      username: '',
      full_name: '',
      password: '',
      confirm_password: '',
    },
    mode: 'onChange',
  });

  const username = form.watch('username');
  const usernameToCheck = useDebounce(username, 500);
  const { data: isUsernameAvailable, isLoading: isUsernameChecking } = useUsernameAvailability(
    !form.formState.errors.username?.message && usernameToCheck ? usernameToCheck : undefined,
  );

  /* ---------------------------------- STEPS --------------------------------- */
  const steps = useMemo(
    (): { id: STEPS; fields: readonly (keyof SignupFormValues)[] }[] => [
      { id: STEPS.EMAIL, fields: ['email'] },
      { id: STEPS.USERNAME, fields: ['username'] },
      { id: STEPS.DISPLAY_NAME, fields: ['full_name'] },
      { id: STEPS.PASSWORD, fields: ['password'] },
      { id: STEPS.CONFIRM_PASSWORD, fields: ['confirm_password'] },
    ],
    [],
  );
  const [currentStep, setCurrentStep] = useState(STEPS.EMAIL);

  /**
   * What the backend can reject that belongs to one field. Anything outside
   * this map is nothing the reader could fix by editing a step, so it stays a
   * toast.
   */
  const fieldErrorByCode = useMemo(
    (): Record<string, { field: keyof SignupFormValues; message: string }> => ({
      USER_ALREADY_EXISTS: {
        field: 'email',
        message: t('common.form.email.error.unavailable'),
      },
      USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
        field: 'email',
        message: t('common.form.email.error.unavailable'),
      },
      INVALID_EMAIL: { field: 'email', message: t('common.form.email.error.invalid') },
      USERNAME_IS_ALREADY_TAKEN: {
        field: 'username',
        message: t('common.form.username.schema.unavailable'),
      },
      USERNAME_TOO_SHORT: {
        field: 'username',
        message: t('common.form.length.char_min', { count: USER_RULES.USERNAME.MIN }),
      },
      USERNAME_TOO_LONG: {
        field: 'username',
        message: t('common.form.length.char_max', { count: USER_RULES.USERNAME.MAX }),
      },
      INVALID_USERNAME: { field: 'username', message: t('common.form.username.schema.format') },
      INVALID_DISPLAY_USERNAME: {
        field: 'username',
        message: t('common.form.username.schema.format'),
      },
      PASSWORD_TOO_SHORT: {
        field: 'password',
        message: t('common.form.length.char_min', { count: USER_RULES.PASSWORD.MIN }),
      },
      PASSWORD_TOO_LONG: {
        field: 'password',
        message: t('common.form.length.char_max', { count: USER_RULES.PASSWORD.MAX }),
      },
    }),
    [t],
  );

  /* ---------------------------- RESEND COOLDOWN ----------------------------- */
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const startResendCooldown = useCallback(
    () => setCooldownEndsAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000),
    [],
  );

  /* -------------------------------- HANDLERS -------------------------------- */
  const goToFirstInvalidStep = useCallback(() => {
    // `steps` is in order, so the first match is the earliest step to fix --
    // several fields can be at fault at once, and the reader walks forward
    // through the rest anyway.
    const step = steps.find((candidate) =>
      candidate.fields.some((field) => form.getFieldState(field).invalid),
    );
    if (step) setCurrentStep(step.id);
  }, [form, steps]);
  const handleFinish = useCallback(() => {
    if (router.canDismiss()) {
      router.dismissTo({ pathname: '/auth' });
    } else {
      router.replace({ pathname: '/auth' });
    }
  }, [router]);

  const handleFinalSubmit = useCallback(async () => {
    // Each step only validates its own fields as it is left, so the form gets
    // one last pass as a whole before anything is sent.
    if (!(await form.trigger())) {
      goToFirstInvalidStep();
      return;
    }
    try {
      setIsLoading(true);
      const data = formGetValues();
      const { error } = await authClient.signUp.email({
        email: data.email,
        // An empty display name is allowed: the username stands in for it.
        name: data.full_name.trim() || data.username,
        username: data.username,
        password: data.password,
        language: locale,
        callbackURL: await verificationCallbackURL(),
      });
      if (error) {
        const fieldError = error.code ? fieldErrorByCode[error.code] : undefined;
        if (!fieldError) {
          toast.error(t('common.messages.an_error_occurred'));
          logger.error('signup error', { error });
          return;
        }
        // The message lands on the field itself, and the stepper goes back to
        // the step holding it instead of leaving the reader on the last one.
        formSetError(fieldError.field, { message: fieldError.message });
        goToFirstInvalidStep();
        return;
      }
      setCurrentStep(STEPS.EMAIL_VERIFICATION);
      startResendCooldown();
    } finally {
      setIsLoading(false);
    }
  }, [
    form,
    formGetValues,
    formSetError,
    goToFirstInvalidStep,
    fieldErrorByCode,
    startResendCooldown,
    locale,
    t,
    toast,
  ]);

  const handleNext = useCallback(async () => {
    const step = steps[currentStep - 1];
    if (!step) return;
    const isStepValid = await form.trigger(step.fields);
    if (!isStepValid) return;

    if (currentStep === STEPS.EMAIL_VERIFICATION - 1) {
      await handleFinalSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [form, steps, currentStep, handleFinalSubmit]);

  const handleBack = useCallback(() => {
    if (currentStep === STEPS.EMAIL) return;
    if (currentStep === STEPS.EMAIL_VERIFICATION) return;
    setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const handleResendEmail = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await authClient.sendVerificationEmail({
        email: formGetValues('email'),
        callbackURL: await verificationCallbackURL(),
      });
      if (error) {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
        logger.error('resend verification email error', { error });
        throw error;
      }
      toast.success(t('common.messages.confirmation_email_sent'));
      startResendCooldown();
    } finally {
      setIsLoading(false);
    }
  }, [formGetValues, startResendCooldown, toast, t]);

  useConfirmLeave({
    enabled: currentStep !== STEPS.EMAIL_VERIFICATION && form.formState.isDirty,
    title: upperFirst(t('common.messages.are_u_sure')),
    cancelLabel: upperFirst(t('common.messages.continue')),
    confirmLabel: upperFirst(t('common.messages.ignore')),
  });

  /* --------------------------------- EFFECTS -------------------------------- */
  useEffect(() => {
    if (isUsernameAvailable === false) {
      formSetError('username', {
        message: t('common.form.username.schema.unavailable'),
      });
    }
  }, [isUsernameAvailable, t, formSetError]);

  useEffect(() => {
    if (cooldownEndsAt === null) return;
    // Counted off a wall-clock deadline rather than by decrementing: an
    // interval drifts, and stops ticking at all while the app is backgrounded.
    const tick = () => {
      const left = Math.max(Math.ceil((cooldownEndsAt - Date.now()) / 1000), 0);
      setResendIn(left);
      if (left === 0) setCooldownEndsAt(null);
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [cooldownEndsAt]);

  return (
    <>
      <Stack.Screen options={modalHeaderOptions} />
      <MultiStepScreen
        currentStepKey={currentStep}
        stepCount={STEPS.EMAIL_VERIFICATION}
        onNext={currentStep === STEPS.EMAIL_VERIFICATION ? handleFinish : handleNext}
        onBack={handleBack}
        canGoBack={currentStep > STEPS.EMAIL && currentStep < STEPS.EMAIL_VERIFICATION}
        isLoading={isLoading}
        isNextDisabled={
          currentStep === STEPS.USERNAME && (isUsernameChecking || isUsernameAvailable === false)
        }
        nextLabel={
          currentStep === STEPS.EMAIL_VERIFICATION
            ? t('common.messages.finish')
            : t('common.messages.continue')
        }
        nextIcon={currentStep === STEPS.EMAIL_VERIFICATION ? Icons.Check : Icons.ChevronRight}
      >
        <View
          style={[
            tw`flex-1 items-center justify-center`,
            { gap: theme.spaces.md, paddingHorizontal: theme.spaces.horizontal },
          ]}
        >
          {(() => {
            switch (currentStep) {
              case STEPS.EMAIL:
                return (
                  <>
                    <Text variant="title">{upperFirst(t('common.form.email.label'))}</Text>
                    <Controller
                      name="email"
                      control={form.control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          icon={Icons.Mail}
                          placeholder={t('common.form.email.placeholder')}
                          autoFocus
                          nativeID="email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          disabled={isLoading}
                          keyboardType="email-address"
                          error={form.formState.errors.email?.message}
                        />
                      )}
                    />
                    {/* SEPARATOR */}
                    <View
                      style={[
                        tw`flex-row items-center`,
                        { gap: theme.spaces.md, paddingVertical: theme.spaces.md },
                      ]}
                    >
                      <View style={[tw`flex-1`, { height: 1, backgroundColor: colors.border }]} />
                      <Text textColor="muted">
                        {upperFirst(t('common.messages.or_continue_with'))}
                      </Text>
                      <View style={[tw`flex-1`, { height: 1, backgroundColor: colors.border }]} />
                    </View>
                    {/* OAUTH */}
                    <OAuthProviders iconOnly />
                    {/* LOGIN */}
                    <Text style={[{ color: colors.mutedForeground }, tw`text-center`]}>
                      {t('pages.auth.signup.return_to_login')}{' '}
                      <Link href="/auth/login" replace style={{ color: colors.accentYellow }}>
                        {upperFirst(t('common.messages.login'))}
                      </Link>
                    </Text>
                  </>
                );

              case STEPS.USERNAME:
                return (
                  <>
                    <Text variant="title">{upperFirst(t('common.form.username.label'))}</Text>
                    <Controller
                      name="username"
                      control={form.control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          icon={Icons.User}
                          placeholder={t('common.form.username.placeholder')}
                          autoFocus
                          nativeID="username"
                          autoComplete="username-new"
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          disabled={isLoading}
                          rightComponent={
                            form.formState.errors.username?.message !==
                              t('common.form.username.schema.unavailable') &&
                            isUsernameAvailable !== undefined ? (
                              isUsernameChecking ? (
                                <Icons.Loader size={16} />
                              ) : (
                                <View
                                  style={[
                                    {
                                      backgroundColor: isUsernameAvailable
                                        ? colors.success
                                        : colors.destructive,
                                    },
                                    tw`rounded-full h-4 w-4 items-center justify-center`,
                                  ]}
                                >
                                  {isUsernameAvailable ? (
                                    <Icons.Check size={12} color={colors.successForeground} />
                                  ) : (
                                    <Icons.Cancel size={12} color={colors.destructiveForeground} />
                                  )}
                                </View>
                              )
                            ) : undefined
                          }
                          error={form.formState.errors.username?.message}
                        />
                      )}
                    />
                  </>
                );

              case STEPS.DISPLAY_NAME:
                return (
                  <>
                    <Text variant="title">{upperFirst(t('common.form.full_name.label'))}</Text>
                    <Controller
                      name="full_name"
                      control={form.control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          // The username stands in as the placeholder because it
                          // is also what an empty field falls back to.
                          placeholder={username || t('common.form.full_name.placeholder')}
                          autoFocus
                          nativeID="full_name"
                          autoComplete="name"
                          autoCapitalize="words"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          disabled={isLoading}
                          error={form.formState.errors.full_name?.message}
                        />
                      )}
                    />
                  </>
                );

              case STEPS.PASSWORD:
                return (
                  <>
                    <Text variant="title">{upperFirst(t('common.form.password.label'))}</Text>
                    <Controller
                      name="password"
                      control={form.control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label={null}
                          placeholder={t('common.form.password.placeholder')}
                          autoFocus
                          nativeID="password"
                          autoComplete="new-password"
                          autoCapitalize="none"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          disabled={isLoading}
                          error={form.formState.errors.password?.message}
                          type="password"
                        />
                      )}
                    />
                  </>
                );

              case STEPS.CONFIRM_PASSWORD:
                return (
                  <>
                    <Text variant="title">
                      {upperFirst(t('common.form.password.confirm.label'))}
                    </Text>
                    <Controller
                      name="confirm_password"
                      control={form.control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label={null}
                          placeholder={t('common.form.password.confirm.placeholder')}
                          autoFocus
                          nativeID="confirm_password"
                          autoComplete="new-password"
                          autoCapitalize="none"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          disabled={isLoading}
                          error={form.formState.errors.confirm_password?.message}
                          type="password"
                        />
                      )}
                    />
                  </>
                );

              case STEPS.EMAIL_VERIFICATION:
                return (
                  <View style={[tw`flex-1 justify-center items-center`, { gap: theme.spaces.md }]}>
                    <Icons.Mail color={colors.foreground} size={theme.icons.sizes.xl} />
                    <View style={[tw`items-center`, { gap: theme.spaces.sm }]}>
                      <Text variant="title" style={tw`text-center`}>
                        {t('pages.auth.signup.confirm_form.label')}
                      </Text>
                      <Text textColor="muted" style={tw`text-center`}>
                        {t('pages.auth.signup.confirm_form.description', {
                          email: formGetValues('email'),
                        })}
                      </Text>
                    </View>
                    <Button
                      variant="outline"
                      onPress={handleResendEmail}
                      loading={isLoading}
                      disabled={resendIn > 0}
                    >
                      {resendIn > 0
                        ? `${t('common.form.resend_email')} (${resendIn}s)`
                        : t('common.form.resend_email')}
                    </Button>
                  </View>
                );

              default:
                return null;
            }
          })()}
        </View>
      </MultiStepScreen>
    </>
  );
};

export default SignupScreen;
