import { useUserDeleteRequestDeleteMutation, useUserDeleteRequestInsertMutation } from "@/api/client/mutations/userMutations";
import { useUserDeleteRequestOptions } from "@/api/client/options/userOptions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import { useQuery } from "@tanstack/react-query";
import { upperFirst } from "lodash";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback } from "react";
import toast from "react-hot-toast";

const DELETION_DELAY = 1000 * 60 * 60 * 24 * 30; // 30 days

const AccountDelete = () => {
	const { session } = useAuth();
	const format = useFormatter();
	const common = useTranslations('common');
	const t = useTranslations('pages.settings.account.delete_account');
	const { createConfirmModal } = useModal();
	const {
		data,
		isLoading,
	} = useQuery(useUserDeleteRequestOptions({
		userId: session?.user.id,
	}));
	const loading = data === undefined || isLoading;

	const { mutateAsync: insertRequestMutation } = useUserDeleteRequestInsertMutation();
	const { mutateAsync: deleteRequestMutation } = useUserDeleteRequestDeleteMutation();

	// Handlers
	const handleInsertRequest = useCallback(async () => {
		if (!session) return;
		await insertRequestMutation({
			userId: session.user.id,
		}, {
			onSuccess: () => {
				toast.success(upperFirst(common('messages.request_made')));
			},
			onError: (error) => {
				toast.error(upperFirst(common('messages.an_error_occurred')));
			}
		});
	}, [insertRequestMutation, session, common]);
	const handleDeleteRequest = useCallback(async () => {
		if (!session) return;
		await deleteRequestMutation({
			userId: session.user.id,
		}, {
			onSuccess: () => {
				toast.success(upperFirst(common('messages.request_canceled')));
			},
			onError: (error) => {
				toast.error(upperFirst(common('messages.an_error_occurred')));
			}
		});
	}, [deleteRequestMutation, session, common]);

	if (loading) return null;
	return (
		<div className="border-2 border-destructive rounded-md p-4 space-y-2">
			<h2 className="text-destructive text-lg font-semibold">{t('label')}</h2>
			<p className="text-muted-foreground text-sm text-justify">
				{!data ? (
					t('description')
				) : (
					t.rich('deletion_requested', {
						date: format.dateTime(new Date(data.delete_after)),
						strong: (chunks) => <strong className="text-accent-yellow">{chunks}</strong>,
					})
				)}
			</p>
			<Button
			variant={'destructive'}
			onClick={() => {
				if (!data) {
					createConfirmModal({
						title: upperFirst(common('messages.are_u_sure')),
						description: t.rich('confirm.description', {
							date: format.dateTime(new Date(Date.now() + DELETION_DELAY)),
							strong: (chunks) => <strong className="text-accent-yellow">{chunks}</strong>,
						}),
						onConfirm: handleInsertRequest,
					})
				} else {
					handleDeleteRequest();
				}
			}}>
				{!data ? t('button') : upperFirst(common('messages.cancel_request'))}
			</Button>
		</div>
	);
};

export default AccountDelete;