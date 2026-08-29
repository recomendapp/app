import { Accordion } from '../../../../../components/ui/accordion';
import { AnimatedPressable } from '../../../../../components/ui/AnimatedPressable';
import { ProgressBar } from '../../../../../components/ui/ProgressBar';
import { Text } from '../../../../../components/ui/text';
import { View } from '../../../../../components/ui/view';
import { EnrichedMarkdownText } from '../../../../../components/RichText/EnrichedMarkdownText';
import { ImageWithFallback } from '../../../../../components/utils/ImageWithFallback';
import { useToast } from '../../../../../components/Toast';
import { Icons } from '../../../../../constants/Icons';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { GAP, GAP_LG, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import tw from '../../../../../lib/tw';
import { importSourcesListAllOptions, useImportCreateMutation } from '@libs/query-client';
import { useQuery } from '@tanstack/react-query';
import { getDocumentAsync } from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslations } from 'use-intl';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useModalHeaderOptions } from '../../../../../hooks/useModalHeaderOptions';

type Step = 'upload' | 'success';

const PROGRESS_RAMP_DURATION = 4000;
const PROGRESS_COMPLETE_DURATION = 300;
const SUCCESS_DISPLAY_DURATION = 2000;

const SettingsDataImportAddSourceScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const { colors, mode } = useTheme();
  const { source: sourceParam } = useLocalSearchParams<{ source: string }>();
  const modalHeaderOptions = useModalHeaderOptions();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { data: sources } = useQuery(importSourcesListAllOptions());
  const selectedSource = useMemo(
    () => sources?.find((source) => source.provider === sourceParam) ?? null,
    [sources, sourceParam],
  );

  const [step, setStep] = useState<Step>('upload');
  const [createdImportId, setCreatedImportId] = useState<number | null>(null);
  const progress = useSharedValue(0);

  const createMutation = useImportCreateMutation();
  const isUploading = createMutation.isPending;
  const acceptedExtensions = useMemo(
    () => selectedSource?.fileTypes?.filter((type) => !type.includes('/')) ?? [],
    [selectedSource],
  );

  const handlePickFile = useCallback(async () => {
    if (!selectedSource || isUploading) return;

    const result = await getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const extension = asset.name.split('.').pop()?.toLowerCase();
    if (!extension || !acceptedExtensions.includes(extension)) {
      toast.error(upperFirst(t('pages.settings.data.importer.invalid_file_type')));
      return;
    }

    const file = new ExpoFile(asset.uri);
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value mutation
    progress.value = 0;
    progress.value = withTiming(90, { duration: PROGRESS_RAMP_DURATION });

    createMutation.mutate(
      {
        file: file as unknown as File,
        provider: selectedSource.provider as 'letterboxd' | 'senscritique' | 'recomend',
      },
      {
        onSuccess: (data) => {
          setCreatedImportId(data.id);
          progress.value = withTiming(100, { duration: PROGRESS_COMPLETE_DURATION }, (finished) => {
            if (finished) scheduleOnRN(setStep, 'success');
          });
        },
        onError: () => {
          progress.value = 0;
          toast.error(upperFirst(t('common.messages.error')), {
            description: upperFirst(t('pages.settings.data.importer.upload_error')),
          });
        },
      },
    );
  }, [selectedSource, isUploading, acceptedExtensions, createMutation, progress, toast, t]);

  useEffect(() => {
    if (step !== 'success' || createdImportId === null) return;
    const timeout = setTimeout(() => {
      router.replace({
        pathname: '/settings/data/import/[import_id]',
        params: { import_id: String(createdImportId) },
      });
    }, SUCCESS_DISPLAY_DURATION);
    return () => clearTimeout(timeout);
  }, [step, createdImportId, router]);

  const headerTitle =
    step === 'upload'
      ? upperFirst(t('common.messages.import'))
      : upperFirst(t('pages.settings.data.importer.success_title'));

  if (!selectedSource) return null;

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerTitle,
        }}
      />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + headerHeight + PADDING_VERTICAL,
        }}
      >
        {step === 'success' ? (
          <View style={tw`flex-1 items-center justify-center gap-3`}>
            <Icons.SuccessCircle color={colors.accentGreen} size={48} />
            <Text textColor="muted" style={tw`text-center`}>
              {t('pages.settings.data.importer.success_description')}
            </Text>
          </View>
        ) : (
          step === 'upload' && (
            <View
              style={{
                gap: GAP_LG,
                paddingHorizontal: PADDING_HORIZONTAL,
                paddingVertical: PADDING_VERTICAL,
              }}
            >
              <View style={tw`flex-row items-center gap-2`}>
                <ImageWithFallback
                  source={{
                    uri:
                      (mode === 'dark' ? selectedSource.iconDark : selectedSource.iconLight) ?? '',
                  }}
                  alt={selectedSource.name}
                  type="service"
                  style={tw`w-10 h-10 rounded-lg`}
                />
                <Text style={tw`font-medium`}>{selectedSource.name}</Text>
              </View>

              {selectedSource.instructions && (
                <Accordion
                  title={upperFirst(t('pages.settings.data.importer.instructions_title'))}
                  containerStyle={[tw`rounded-xl border px-4 py-3`, { borderColor: colors.border }]}
                >
                  <View style={{ paddingBottom: PADDING_VERTICAL }}>
                    <EnrichedMarkdownText markdown={selectedSource.instructions} />
                  </View>
                </Accordion>
              )}

              {isUploading ? (
                <View style={{ gap: GAP }}>
                  <ProgressBar progress={progress} />
                  <Text textColor="muted" style={tw`text-center text-xs`}>
                    {t('pages.settings.data.importer.uploading')}
                  </Text>
                </View>
              ) : (
                <AnimatedPressable
                  onPress={handlePickFile}
                  style={[
                    tw`items-center justify-center gap-2 min-h-32 rounded-xl border border-dashed p-4`,
                    { borderColor: colors.border },
                  ]}
                >
                  <Icons.Upload color={colors.mutedForeground} size={24} />
                  <Text textColor="muted" style={tw`text-center font-medium`}>
                    {t('pages.settings.data.importer.browse_prompt_mobile')}
                  </Text>
                </AnimatedPressable>
              )}
            </View>
          )
        )}
      </ScrollView>
    </>
  );
};

export default SettingsDataImportAddSourceScreen;
