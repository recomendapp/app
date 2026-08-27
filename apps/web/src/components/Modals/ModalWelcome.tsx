'use client';

import { useState } from 'react';
import { Button } from '@libs/ui/components/button';
import { Modal, ModalBody, ModalDescription, ModalHeader, ModalTitle } from './Modal';

interface ModalWelcomeProps {
  onClose: () => void;
}

export const ModalWelcome = ({ onClose }: ModalWelcomeProps) => {
  const [open, setOpen] = useState(true);

  return (
    <Modal open={open} onOpenChange={setOpen} onCloseEnd={onClose}>
      <ModalHeader>
        <ModalTitle>Welcome to Recomend</ModalTitle>
        <ModalDescription>
          This is a test route ("/welcome") demonstrating a route-driven modal: it opens as a modal
          whether you navigate here from inside the app or load the URL directly.
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </ModalBody>
    </Modal>
  );
};
