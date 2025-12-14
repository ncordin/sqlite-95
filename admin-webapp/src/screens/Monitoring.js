import React, { useEffect, useState } from 'react';

import { Counter, ProgressBar, Separator } from 'react95';
import { ContentModal } from '../components/Modal';
import { Shortcut } from '../components/Shortcut';
import { Space } from '../components/Space';
import { useApi } from '../utils/useApi';

export function Monitoring() {
  const { fetch } = useApi();
  const [showModal, setShowModal] = useState(false);
  const [monitoringData, setMonitoringData] = useState(null);

  const fetchMonitoring = () => {
    fetch('api/monitoring').then((response) => {
      setMonitoringData(response);
    });
  };

  useEffect(() => {
    if (!showModal) return;

    fetchMonitoring();

    const interval = setInterval(fetchMonitoring, 3000);
    return () => clearInterval(interval);
  }, [showModal]);

  const openModal = () => {
    setShowModal(true);
  };

  return (
    <>
      <Shortcut icon="computer" name="Monitoring" onClick={openModal} />

      {showModal && (
        <ContentModal
          title="Monitoring"
          onClose={() => setShowModal(false)}
          width={400}
        >
          {monitoringData ? (
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
                    value={Math.min(monitoringData.requestsPerSecond, 999999)}
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
                    value={Math.min(monitoringData.requestsPerHour, 999999)}
                    minLength={6}
                    size="md"
                  />
                </div>
              </div>

              <Separator style={{ margin: '12px 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1 }}>Process CPU</span>
                <ProgressBar
                  value={monitoringData.processCpu}
                  style={{ width: 200 }}
                />
              </div>

              <Space vertical size={0.5} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1 }}>Global CPU</span>
                <ProgressBar
                  value={monitoringData.totalCpu}
                  style={{ width: 200 }}
                />
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
                  {monitoringData.processMemory.toFixed(0)} MB
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
                  {monitoringData.loadAvg.map((v) => v.toFixed(2)).join(' / ')}
                </span>
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </ContentModal>
      )}
    </>
  );
}
