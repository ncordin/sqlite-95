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
import { Upload } from './Upload';
import { Monitoring } from './Monitoring';

export function Desktop() {
  const { database, setDatabase } = useDatabase();
  const { logout } = usePassword();
  const { fetch } = useApi();
  const [databases, setDatabases] = useState([]);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);

  const refreshDatabases = () => {
    fetch('api/files').then((response) => {
      setDatabases(response);
    });
  };

  useEffect(() => {
    refreshDatabases();
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
          <Monitoring />

          <Shortcut icon="system" name="System" onClick={openExploreModal} />

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

          {showExploreModal && systemInfo && (
            <ContentModal
              title="System"
              onClose={() => setShowExploreModal(false)}
              width={400}
            >
              <GroupBox label="Software versions" style={{ marginBottom: 16 }}>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Bun</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.bun}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}>SQLite</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.sqlite}
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
                      <td style={{ padding: '2px 0' }}>Uptime</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.uptime}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Time</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.datetime}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </GroupBox>

              <Space vertical size={0.5} />

              <GroupBox label="Hardware" style={{ marginBottom: 16 }}>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 0' }}>CPU cores</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.cpus}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Memory</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.memory}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}>Platform</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {systemInfo.platform} / {systemInfo.arch}
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
