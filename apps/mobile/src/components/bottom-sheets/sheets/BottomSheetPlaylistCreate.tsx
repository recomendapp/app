import tw from 'apps/mobile/src/lib/tw';
import { upperFirst } from 'lodash';
import { Button } from 'apps/mobile/src/components/ui/Button';
import useBottomSheetStore from 'apps/mobile/src/stores/useBottomSheetStore';
import * as z from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from 'react-native';
import { BottomSheetProps } from '../BottomSheetManager';
import TrueSheet from 'apps/mobile/src/components/ui/TrueSheet';
import { useTranslations } from 'use-intl';
import { useToast } from 'apps/mobile/src/components/Toast';
import { Input } from "apps/mobile/src/components/ui/Input";
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from 'apps/mobile/src/theme/globals';
import { Label } from 'apps/mobile/src/components/ui/Label';
import { forwardRef, useCallback } from 'react';
import { Text } from 'apps/mobile/src/components/ui/text';
import { Playlist } from '@packages/api-js';
import { usePlaylistInsertMutation } from '@libs/query-client';

interface BottomSheetPlaylistCreateProps extends BottomSheetProps {
	onCreate?: (playlist: Playlist) => void;
	placeholder?: string | null;
}

const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 100;

const BottomSheetPlaylistCreate = forwardRef<
	React.ComponentRef<typeof TrueSheet>,
	BottomSheetPlaylistCreateProps
>(({ id, onCreate,  placeholder, ...props }, ref) => {
	const toast = useToast();
	const closeSheet = useBottomSheetStore((state) => state.closeSheet);
	const t = useTranslations();
	const { mutateAsync: createPlaylist, isPending } = usePlaylistInsertMutation();

	/* ---------------------------------- FORM ---------------------------------- */
	const playlistSchema = z.object({
		title: z.string()
			.min(TITLE_MIN_LENGTH, { message: upperFirst(t('common.form.length.char_min', { count: TITLE_MIN_LENGTH }))})
			.max(TITLE_MAX_LENGTH, { message: upperFirst(t('common.form.length.char_max', { count: TITLE_MIN_LENGTH }))}),
	});
	type PlaylistFormValues = z.infer<typeof playlistSchema>;
	const form = useForm<PlaylistFormValues>({
		resolver: zodResolver(playlistSchema),
		mode: 'onChange',
	});
	/* -------------------------------------------------------------------------- */

	const onSubmit = useCallback(async (values: PlaylistFormValues) => {
		await createPlaylist({
			body: {
				title: values.title.replace(/\s+/g, ' ').trim(),
				description: null,
				visibility: 'public',
			}
		}, {
			onSuccess: (playlist) => {
				toast.success(upperFirst(t('common.messages.added', { gender: 'female', count: 1 })));
				form.reset();
				onCreate && onCreate(playlist);
				closeSheet(id);
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
			}
		});
	}, [createPlaylist, toast, t, onCreate, closeSheet, id, form]);

	return (
		<TrueSheet
		ref={ref}
		style={{
			gap: GAP,
			paddingTop: PADDING_VERTICAL * 2,
			paddingHorizontal: PADDING_HORIZONTAL,
		}}
		{...props}
		>
			<Text style={tw`text-center text-lg font-bold`}>{upperFirst(t('common.messages.new_playlist'))}</Text>
			<Controller
			name='title'
			control={form.control}
			render={({ field: { onChange, onBlur, value} }) => (
				<View style={[tw`w-full`, { gap: GAP }]}>
					<Label>{upperFirst(t('common.messages.title'))}</Label>
					<Input
					variant='outline'
					value={value}
					onChangeText={onChange}
					onBlur={onBlur}
					placeholder={placeholder ?? upperFirst(t('pages.playlist.form.title.placeholder'))}
					autoCorrect={false}
					disabled={isPending}
					error={form.formState.errors.title?.message}
					/>
				</View>
			)}
			/>
			<Button
			variant='outline'
			onPress={() => {
				if (form.getValues('title').length === 0 && placeholder && placeholder.length > 0) {
					onSubmit({ title: placeholder });
				} else {
					form.handleSubmit(onSubmit)();
				}
			}}
			containerStyle={tw`w-full`}
			disabled={isPending}
			>
				{upperFirst(t('common.messages.create'))}
			</Button>
		</TrueSheet>
	);
});
BottomSheetPlaylistCreate.displayName = 'BottomSheetPlaylistCreate';

export default BottomSheetPlaylistCreate;