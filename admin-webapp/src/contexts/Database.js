import { createContext, useContext, useState } from 'react';
import { useUrlParam } from '../utils/useUrlParam';

const ReactContext = createContext({
  database: null,
  setDatabase: null,
  databaseSize: null,
});

function DatabaseProvider({ children }) {
  const [database, setDatabase] = useUrlParam('database');
  const [databaseSize, setDatabaseSize] = useState(null);

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
  return useContext(ReactContext);
}

export { DatabaseProvider, useDatabase };
