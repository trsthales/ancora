import React, { createContext, useContext, useState } from 'react';
import { SOSDashboardModal } from '../screens/sos/SOSDashboardModal';

interface SOSContextData {
  isSOSOpen: boolean;
  openSOS: () => void;
  closeSOS: () => void;
}

const SOSContext = createContext<SOSContextData>({} as SOSContextData);

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  const openSOS = () => setIsSOSOpen(true);
  const closeSOS = () => setIsSOSOpen(false);

  return (
    <SOSContext.Provider value={{ isSOSOpen, openSOS, closeSOS }}>
      {children}
      <SOSDashboardModal visible={isSOSOpen} onClose={closeSOS} />
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
