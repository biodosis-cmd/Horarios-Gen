import { useState } from 'react';
import { useModal } from '@/context/ModalContext';
import { useUI } from '@/context/UIContext';
export const useAppLogic = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const ADMIN_PIN = "302312";

    // Auth
    const login = (password) => {
        if (password === ADMIN_PIN) {
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => setIsAuthenticated(false);
    const { openModal, closeModal } = useModal();
    const { actions, isLoading } = useUI();
    const [schedules, setSchedules] = useState([]);
    const handleSaveSchedule = (scheduleData) => {
        setSchedules(prev => {
            const index = prev.findIndex(s => s.id === scheduleData.id);
            if (index >= 0) {
                const newSchedules = [...prev];
                newSchedules[index] = scheduleData;
                return newSchedules;
            } else {
                return [...prev, { ...scheduleData, id: Date.now() }];
            }
        });
        closeModal();
    };
    const handleEditSchedule = (schedule = null, cloneFrom = null, readOnly = false) => {
        openModal('scheduleEditor', {
            scheduleToEdit: schedule,
            cloneFrom,
            readOnly,
            onSave: handleSaveSchedule
        });
    };
    return {
        currentUser: { uid: 'admin-local', displayName: 'Admin' },
        schedules,
        isLoading,
        actions,
        handleLogout: logout,
        handleEditSchedule,
        login,
        isAuthenticated
    };
};
