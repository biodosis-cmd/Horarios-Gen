import React from 'react';
import { useModal } from '@/context/ModalContext';
import ScheduleEditorModal from '@/components/modals/ScheduleEditorModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import InfoModal from '@/components/common/InfoModal';
const ModalRoot = () => {
    const { activeModal, closeModal } = useModal();
    if (!activeModal) return null;
    return activeModal.type === 'scheduleEditor' ? <ScheduleEditorModal isOpen={true} onClose={closeModal} {...activeModal.props} /> : null;
};
export default ModalRoot;
