import { ModalType } from "@/components/Modals/Modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useModal } from "@/context/modal-context";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";

export interface ConfirmModalTemplateProps extends ModalType {
	title: React.ReactNode;
	description?: React.ReactNode;
	cancelLabel?: string;
	confirmLabel?: string;
	onConfirm?: () => void;
	onCancel?: () => void;
}

export const ConfirmModalTemplate = ({
	title,
	description,
	cancelLabel,
	confirmLabel,
	onConfirm,
	onCancel,
	...props
} : ConfirmModalTemplateProps) => {
	const common = useTranslations('common');
	const { closeModal } = useModal();
	const handleCancel = () => {
		onCancel && onCancel();
		closeModal(props.id);
	}
	const handleConfirm = () => {
		onConfirm && onConfirm();
		closeModal(props.id);
	}
	const cancelLabelText = cancelLabel || upperFirst(common('messages.cancel'));
	const confirmLabelText = confirmLabel || upperFirst(common('messages.confirm'));
	return (
		<AlertDialog
			open={props.open}
			onOpenChange={(open) => !open && closeModal(props.id)}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					{description && (<AlertDialogDescription>{description}</AlertDialogDescription>)}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={handleCancel}>{cancelLabelText}</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm}>{confirmLabelText}</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
};

