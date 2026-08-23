'use client';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import GenericModal from './GenericModal';

export default function GlobalOverlays() {
  return (
    <>
      <ConfirmModal />
      <Toast />
      <GenericModal />
    </>
  );
}
