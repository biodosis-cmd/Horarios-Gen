import React, { Suspense, lazy } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ModalRoot from '@/components/modals/ModalRoot';
import { UIProvider } from '@/context/UIContext';
import { ModalProvider } from '@/context/ModalContext';
import { useAppLogic } from '@/hooks/useAppLogic';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const SchedulesView = lazy(() => import('@/components/views/SchedulesView'));

const AppContent = () => {
  const { schedules, handleEditSchedule, isLoading } = useAppLogic();

  return (
    <MainLayout>
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
        {isLoading && <LoadingSpinner />}
        <SchedulesView schedules={schedules} onEdit={handleEditSchedule} />
        <ModalRoot />
      </Suspense>
    </MainLayout>
  );
};
import ReloadPrompt from '@/components/common/ReloadPrompt';

export default function App() {
  return (
    <UIProvider>
      <ModalProvider>
        <AppContent />
        <ReloadPrompt />
      </ModalProvider>
    </UIProvider>
  );
}
