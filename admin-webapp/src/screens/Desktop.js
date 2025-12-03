import React, { useEffect, useState } from 'react';

import { MainScreen } from '../screens/MainScreen';
import { Shortcut } from '../components/Shortcut';
import { ContentModal } from '../components/Modal';
import { GroupBox } from 'react95';
import { useDatabase } from '../contexts/Database';
import { TablesProvider } from '../contexts/Tables';
import { useApi } from '../utils/useApi';
import { usePassword } from '../contexts/Password';
import { formatFileSize } from '../utils/formatFileSize';
import { Space } from '../components/Space';

export function Desktop() {
  const { database, setDatabase } = useDatabase();
  const { logout } = usePassword();
  const { fetch } = useApi();
  const [databases, setDatabases] = useState([]);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    fetch('api/files').then((response) => {
      setDatabases(response);
    });
  }, []);

  const openExploreModal = () => {
    fetch('api/system').then((response) => {
      setSystemInfo(response);
      setShowExploreModal(true);
    });
  };

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
            name="My Computer"
            onClick={openExploreModal}
          />

          {databases.map((file) => (
            <Shortcut
              key={file.name}
              icon="database"
              name={file.name}
              subtitle={formatFileSize(file.size)}
              onClick={() => setDatabase(file.name, file.size)}
            />
          ))}

          <Shortcut icon="desktop" name="Log out" onClick={logout} />

          {showExploreModal && systemInfo && (
            <ContentModal
              title="My Computer"
              onClose={() => setShowExploreModal(false)}
            >
              <GroupBox label="Versions" style={{ marginBottom: 16 }}>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 0' }}>SQLite</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.sqlite}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Bun</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.bun}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </GroupBox>

              <Space vertical size={0.5} />

              <GroupBox label="Server" style={{ marginBottom: 16 }}>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Time</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.datetime}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Uptime</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.uptime}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Platform</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.platform}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Architecture</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.arch}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </GroupBox>

              <Space vertical size={0.5} />

              <GroupBox label="Resources" style={{ marginBottom: 16 }}>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 0' }}>CPUs</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.cpus}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Load average</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.loadAvg}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Memory</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.memory}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </GroupBox>
            </ContentModal>
          )}
        </>
      )}
    </>
  );
}
