import React from 'react';
import { useUrlParam } from '../utils/useUrlParam';

const ReactContext = React.createContext({
  database: null,
  setDatabase: null,
  databaseSize: null,
});

function DatabaseProvider({ children }) {
  const [database, setDatabase] = useUrlParam('database');
  const [databaseSize, setDatabaseSize] = React.useState(null);

  const selectDatabase = (name, size = null) => {
    setDatabase(name);
    setDatabaseSize(size);
  };

  return (
    <ReactContext.Provider
      value={{
        database,
        setDatabase: selectDatabase,
        databaseSize,
      }}
    >
      {children}
    </ReactContext.Provider>
  );
}

function useDatabase() {
  return React.useContext(ReactContext);
}

export { DatabaseProvider, useDatabase };
