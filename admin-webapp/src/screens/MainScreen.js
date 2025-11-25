import React, { useEffect } from 'react';
import { Tab, TabBody, Tabs } from 'react95';
import styled from 'styled-components';

import { TableList } from '../components/TableList';
import { ClosableWindow } from '../components/ClosableWindow';
import { useTables } from '../contexts/Tables';
import { BrowseTab } from '../tabs/BrowseTab';
import { CreateTableTab } from '../tabs/CreateTableTab';
import { EmptyTab } from '../tabs/EmptyTab';
import { InsertTab } from '../tabs/InsertTab/InsertTab';
import { ManagementTab } from '../tabs/ManagementTab/ManagementTab';
import { SqlTab } from '../tabs/SqlTab';
import { StructureTab } from '../tabs/StructureTab';
import { useDatabase } from '../contexts/Database';
import { useUrlParam } from '../utils/useUrlParam';
import { SearchTab } from '../tabs/SearchTab';

const Container = styled.div`
  padding: 1rem;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const Column = styled.div`
  padding: 0px;
`;

const StyledTab = styled(Tab)`
  padding: 0 1rem;
`;

export function MainScreen() {
  const [currentTab, setCurrentTab] = useUrlParam('tab', 'browse');
  const { database, setDatabase } = useDatabase();
  const { currentTable, setCurrentTableName } = useTables();

  useEffect(() => {
    if (currentTab === 'create-table') {
      setCurrentTab('browse');
    }
  }, [currentTable?.name]);

  const onClose = () => {
    setCurrentTab(null);
    setCurrentTableName(null);
    setDatabase(null);
  };

  const getTabBody = (value) => {
    switch (value) {
      case 'browse':
        return <BrowseTab />;

      case 'insert':
        return <InsertTab onCreated={() => setCurrentTab('browse')} />;

      case 'search':
        return <SearchTab />;

      case 'sql':
        return <SqlTab />;

      case 'structure':
        return <StructureTab />;

      case 'management':
        return <ManagementTab />;

      case 'create-table':
        return <CreateTableTab onCreated={() => setCurrentTab('browse')} />;

      default:
        return <EmptyTab />;
    }
  };

  return (
    <Container>
      <ClosableWindow
        title={`SQLite 95 - ${database}`}
        onClose={onClose}
        style={{ width: '100%' }}
      >
        <FlexRow>
          <Column>
            <TableList createTable={() => setCurrentTab('create-table')} />
          </Column>
          <Column style={{ flex: 1, paddingLeft: 16, paddingBottom: 50 }}>
            <Tabs
              value={currentTab}
              onChange={(value) => {
                return setCurrentTab(value);
              }}
            >
              <StyledTab value="browse">Browse</StyledTab>
              <StyledTab value="insert">Insert</StyledTab>
              <StyledTab value="search">Search</StyledTab>
              <StyledTab value="sql">SQL</StyledTab>
              <StyledTab value="structure">Structure</StyledTab>
              <StyledTab value="management">Management</StyledTab>
            </Tabs>
            <TabBody>
              {getTabBody(
                (currentTable || currentTab === 'create-table') && currentTab
              )}
            </TabBody>
          </Column>
        </FlexRow>
      </ClosableWindow>
    </Container>
  );
}
