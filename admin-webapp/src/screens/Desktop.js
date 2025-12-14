import React, { useEffect, useState } from 'react';

import { MainScreen } from '../screens/MainScreen';
import { Shortcut } from '../components/Shortcut';
import { useDatabase } from '../contexts/Database';
import { TablesProvider } from '../contexts/Tables';
import { useApi } from '../utils/useApi';
import { usePassword } from '../contexts/Password';
import { formatFileSize } from '../utils/formatFileSize';
import { Upload } from './Upload';
import { Server } from './Server/Server';

export function Desktop() {
  const { database, setDatabase } = useDatabase();
  const { logout } = usePassword();
  const { fetch } = useApi();
  const [databases, setDatabases] = useState([]);

  const refreshDatabases = () => {
    fetch('api/files').then((response) => {
      setDatabases(response);
    });
  };

  useEffect(() => {
    refreshDatabases();
  }, []);

  return (
    <>
      {database && (
        <TablesProvider>
          <MainScreen />
        </TablesProvider>
      )}
      {!database && (
        <>
          <Server />

          {databases.map((file) => (
            <Shortcut
              key={file.name}
              icon="database"
              name={file.name}
              subtitle={formatFileSize(file.size)}
              onClick={() => setDatabase(file.name, file.size)}
            />
          ))}

          <Upload onUploadComplete={refreshDatabases} />

          <Shortcut icon="desktop" name="Log off" onClick={logout} />
        </>
      )}
    </>
  );
}
