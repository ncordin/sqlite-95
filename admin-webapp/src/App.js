import React from 'react';

import { ModalProvider } from './contexts/Modal';
import { HtmlLayout } from './components/HtmlLayout';
import { DatabaseProvider } from './contexts/Database';
import { Desktop } from './screens/Desktop';
import { Login } from './screens/Login';
import { PasswordProvider, usePassword } from './contexts/Password';

function CurrentScreen() {
  const { isAuthenticated } = usePassword();

  return isAuthenticated ? <Desktop /> : <Login />;
}

export function App() {
  return (
    <ModalProvider>
      <PasswordProvider>
        <DatabaseProvider>
          <HtmlLayout>
            <CurrentScreen />
          </HtmlLayout>
        </DatabaseProvider>
      </PasswordProvider>
    </ModalProvider>
  );
}
