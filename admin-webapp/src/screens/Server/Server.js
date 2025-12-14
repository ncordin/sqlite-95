import React, { useState } from 'react';
import { Tab, TabBody, Tabs } from 'react95';
import styled from 'styled-components';

import { ContentModal } from '../../components/Modal';
import { Shortcut } from '../../components/Shortcut';
import { MonitoringTab } from './tabs/MonitoringTab';
import { SystemTab } from './tabs/SystemTab';

const StyledTab = styled(Tab)`
  padding: 0 1rem;
`;

export function Server() {
  const [showModal, setShowModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('monitoring');

  const getTabBody = (value) => {
    switch (value) {
      case 'monitoring':
        return <MonitoringTab />;
      case 'system':
        return <SystemTab />;
      default:
        return null;
    }
  };

  return (
    <>
      <Shortcut
        icon="computer"
        name="Server"
        onClick={() => setShowModal(true)}
      />

      {showModal && (
        <ContentModal
          title="Server"
          onClose={() => setShowModal(false)}
          width={450}
          fixedTop="100px"
        >
          <Tabs value={currentTab} onChange={(value) => setCurrentTab(value)}>
            <StyledTab value="monitoring">Monitoring</StyledTab>
            <StyledTab value="system">System</StyledTab>
          </Tabs>
          <TabBody style={{ minHeight: 280 }}>{getTabBody(currentTab)}</TabBody>
        </ContentModal>
      )}
    </>
  );
}
