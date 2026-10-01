import React, { createContext, useContext, useState } from 'react';
import { SOSDashboardModal, SOSViewMode } from '../screens/sos/SOSDashboardModal';

interface SOSContextData {
  isSOSOpen: boolean;
  openSOS: (initialView?: SOSViewMode | unknown) => void;
  closeSOS: () => void;
}

const SOSContext = createContext<SOSContextData>({} as SOSContextData);

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [initialView, setInitialView] = useState<SOSViewMode>('dashboard');

  const openSOS = (view?: unknown) => {
    const validView: SOSViewMode =
      typeof view === 'string' && ['dashboard', 'breathing', 'grounding', 'caps'].includes(view)
        ? (view as SOSViewMode)
        : 'dashboard';
    setInitialView(validView);
    setIsSOSOpen(true);
  };
  const closeSOS = () => setIsSOSOpen(false);

  return (
    <SOSContext.Provider value={{ isSOSOpen, openSOS, closeSOS }}>
      {children}
      <SOSDashboardModal visible={isSOSOpen} initialView={initialView} onClose={closeSOS} />
    </SOSContext.Provider>
  );
};

export const useSOS = (): SOSContextData => {
  const context = useContext(SOSContext);
  if (!context) {
    throw new Error('useSOS deve ser utilizado dentro de um SOSProvider');
  }
  return context;
};
