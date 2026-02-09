import React, { Suspense, lazy } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ModalRoot from '@/components/modals/ModalRoot';
import { UIProvider } from '@/context/UIContext';
import { ModalProvider } from '@/context/ModalContext';
import { useAppLogic } from '@/hooks/useAppLogic';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const SchedulesView = lazy(() => import('@/components/views/SchedulesView'));
const LoginView = lazy(() => import('@/components/views/LoginView'));

const AppContent = () => {
  const { isAuthenticated, login, schedules, handleEditSchedule, isLoading } = useAppLogic();

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="h-screen bg-[#0f1221] flex items-center justify-center"><LoadingSpinner /></div>}>
        <LoginView onLogin={login} />
      </Suspense>
    );
  }

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
export default function App() {
  return (
    <UIProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </UIProvider>
  );
}
