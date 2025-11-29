import React from 'react';

import { ErrorModalProvider } from './contexts/ErrorModal';
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
    <ErrorModalProvider>
      <PasswordProvider>
        <DatabaseProvider>
          <HtmlLayout>
            <CurrentScreen />
          </HtmlLayout>
        </DatabaseProvider>
      </PasswordProvider>
    </ErrorModalProvider>
  );
}
