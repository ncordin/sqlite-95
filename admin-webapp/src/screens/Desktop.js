import React, { useEffect, useState } from 'react';

import { MainScreen } from '../screens/MainScreen';
import { Shortcut } from '../components/Shortcut';
import { ErrorModal } from '../components/ErrorModal';
import { useDatabase } from '../contexts/Database';
import { TablesProvider } from '../contexts/Tables';
import { useApi } from '../utils/useApi';
import { usePassword } from '../contexts/Password';

export function Desktop() {
  const { database, setDatabase } = useDatabase();
  const { logout } = usePassword();
  const { fetch } = useApi();
  const [databases, setDatabases] = useState([]);
  const [showExploreModal, setShowExploreModal] = useState(false);

  useEffect(() => {
    fetch('api/files').then((response) => {
      setDatabases(response);
    });
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
          <Shortcut
            icon="computer"
            name="Explore"
            onClick={() => setShowExploreModal(true)}
          />

          {databases.map((file) => (
            <Shortcut
              key={file}
              icon="database"
              name={file}
              onClick={() => setDatabase(file)}
            />
          ))}

          <Shortcut icon="desktop" name="Log out" onClick={logout} />

          {showExploreModal && (
            <ErrorModal
              title="Sorry :/"
              onClose={() => setShowExploreModal(false)}
            >
              Exploring is not allowed in this server.
            </ErrorModal>
          )}
        </>
      )}
    </>
  );
}
