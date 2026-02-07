import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import { authClient } from "@/lib/auth/client";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import toast from "react-hot-toast";

const AccountDelete = () => {
	const { user } = useAuth();
	const common = useTranslations('common');
	const t = useTranslations('pages.settings.account.delete_account');
	const { createConfirmModal } = useModal();

	// Handlers
	const handleDeleteRequest = useCallback(async () => {
		if (!user) return;
		createConfirmModal({
			title: upperFirst(common('messages.are_u_sure')),
			description: t.rich('confirm.description'),
			onConfirm: async () => {
				try {
					await authClient.deleteUser({
						callbackURL: `${window.location.origin}/goodbye`,
					});
					toast.success(t('confirm.confirm_email_sent'));
				} catch {
					toast.error(common('messages.error_occurred'));
				}
			},
		})
		
	}, [user, common]);

	return (
		<Button
		variant={'destructive'}
		onClick={handleDeleteRequest}>
			{t('button')}
		</Button>
	);
};

export default AccountDelete;