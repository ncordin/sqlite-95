import React, { useEffect, useState } from 'react';
import { Counter, Hourglass, ProgressBar, Separator } from 'react95';

import { Space } from '../../../components/Space';
import { useApi } from '../../../utils/useApi';

export function MonitoringTab() {
  const { fetch } = useApi();
  const [data, setData] = useState(null);

  const fetchMonitoring = () => {
    fetch('api/monitoring').then((response) => {
      setData(response);
    });
  };

  useEffect(() => {
    fetchMonitoring();

    const interval = setInterval(fetchMonitoring, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
        }}
      >
        <Hourglass size={32} style={{ margin: 20 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '0 8px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexDirection: 'column',
          }}
        >
          <span style={{ flex: 1 }}>Requests/s</span>
          <Counter
            value={Math.min(data.requestsPerSecond, 999999)}
            minLength={6}
            size="md"
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexDirection: 'column',
          }}
        >
          <span style={{ flex: 1 }}>Requests/h</span>
          <Counter
            value={Math.min(data.requestsPerHour, 999999)}
            minLength={6}
            size="md"
          />
        </div>
      </div>

      <Separator style={{ margin: '12px 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1 }}>Process CPU</span>
        <ProgressBar value={data.processCpu} style={{ width: 200 }} />
      </div>

      <Space vertical size={0.5} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1 }}>Global CPU</span>
        <ProgressBar value={data.totalCpu} style={{ width: 200 }} />
      </div>

      <Separator style={{ margin: '12px 0' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 32,
          justifyContent: 'space-between',
        }}
      >
        <span>Process memory</span>
        <span style={{ fontWeight: 'bold' }}>
          {data.processMemory.toFixed(0)} MB
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 32,
          justifyContent: 'space-between',
        }}
      >
        <span>Load average</span>
        <span style={{ fontWeight: 'bold' }}>
          {data.loadAvg.map((v) => v.toFixed(2)).join(' / ')}
        </span>
      </div>
    </div>
  );
}
