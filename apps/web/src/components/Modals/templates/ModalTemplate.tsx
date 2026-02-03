import { useModal } from "@/context/modal-context";
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalType } from "../Modal"

export interface ModalTemplateProps extends ModalType {
  header?: {
    title?: React.ReactNode;
    description?: React.ReactNode;
  };
  content: React.ReactNode;
  footer?: React.ReactNode;
}

export const ModalTemplate = ({
	header,
	content,
	footer,
  ...props
} : ModalTemplateProps) => {
  const { closeModal } = useModal();
	return (
		<Modal open={props.open} onOpenChange={(open) => !open && closeModal(props.id)}>
      {header && (
        <ModalHeader>
          {header.title && <ModalTitle>{header.title}</ModalTitle>}
          {header.description && <ModalDescription>{header.description}</ModalDescription>}
        </ModalHeader>
      )}
      <ModalBody>
        {content}
      </ModalBody>
      {footer && (
        <ModalFooter>
          {footer}
        </ModalFooter>
      )}
    </Modal>
	)
}