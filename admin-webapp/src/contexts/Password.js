import React, { useState, useCallback } from 'react';
import { fetchSqliteApi } from '../utils/useApi';

const ReactContext = React.createContext({
  password: null,
  isAuthenticated: false,
  login: async (_) => null,
  logout: () => null,
});

function PasswordProvider({ children }) {
  const [password, setPassword] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async (inputPassword) => {
    const data = await fetchSqliteApi({
      url: 'api/files',
      params: {},
      password: inputPassword,
    });

    if (data.error) {
      return { success: false, error: data.error };
    }

    setPassword(inputPassword);
    setIsAuthenticated(true);

    return { success: true };
  }, []);

  const logout = () => {
    setPassword(null);
    setIsAuthenticated(false);
  };

  return (
    <ReactContext.Provider
      value={{
        password,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </ReactContext.Provider>
  );
}

function usePassword() {
  return React.useContext(ReactContext);
}

export { PasswordProvider, usePassword };
