import React, { useEffect, useState } from 'react';
import { GroupBox } from 'react95';

import { Space } from '../../../components/Space';
import { useApi } from '../../../utils/useApi';

export function SystemTab() {
  const { fetch } = useApi();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('api/system').then((response) => {
      setData(response);
    });
  }, []);

  if (!data) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <GroupBox label="Software versions" style={{ marginBottom: 12 }}>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 0' }}>Bun</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {data.bun}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '2px 0' }}>SQLite</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {data.sqlite}
              </td>
            </tr>
          </tbody>
        </table>
      </GroupBox>

      <Space vertical size={0.5} />

      <GroupBox label="Server" style={{ marginBottom: 12 }}>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 0' }}>Uptime</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {data.uptime}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '2px 0' }}>Time</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {data.datetime}
              </td>
            </tr>
          </tbody>
        </table>
      </GroupBox>

      <Space vertical size={0.5} />

      <GroupBox label="Hardware">
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 0' }}>CPU cores</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {data.cpus}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '2px 0' }}>Memory</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {data.memory}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '2px 0' }}>Platform</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {data.platform} / {data.arch}
              </td>
            </tr>
          </tbody>
        </table>
      </GroupBox>
    </>
  );
}
