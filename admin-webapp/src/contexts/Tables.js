import { createContext, useContext, useEffect, useState } from 'react';
import { useApi } from '../utils/useApi';
import { useUrlParam } from '../utils/useUrlParam';

const initialState = {
  tables: [],
  currentTable: null,
};

const ReactContext = createContext(initialState);

function TablesProvider({ children }) {
  const [tables, setTables] = useState([]);
  const [currentTableName, setCurrentTableName] = useUrlParam('table');
  const { fetch } = useApi();

  useEffect(() => {
    fetch('api/tables').then((tables) => {
      setTables(tables);

      if (!currentTableName && tables[0]) {
        setCurrentTableName(tables[0].name);
      }
    });
  }, []);

  const refresh = () => {
    return fetch('api/tables').then((tables) => {
      setTables(tables);
    });
  };

  const currentTable =
    (tables ?? []).find((table) => table.name === currentTableName) || null;

  return (
    <ReactContext.Provider
      value={{
        tables,
        currentTable,
        setCurrentTableName,
        refresh,
      }}
    >
      {children}
    </ReactContext.Provider>
  );
}

function useTables() {
  return useContext(ReactContext);
}

export { TablesProvider, useTables };
