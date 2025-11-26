import React, { useEffect, useState } from 'react';
import { Button, GroupBox, TextField } from 'react95';

import { useTables } from '../../contexts/Tables';
import { InnerPanel } from '../../components/InnerPanel';
import { useApi } from '../../utils/useApi';
import { useDatabase } from '../../contexts/Database';

export function ManagementTab() {
  const { currentTable, refresh } = useTables();
  const { database } = useDatabase();
  const { executeQuery, download } = useApi();
  const [newTableName, setNewTableName] = useState(currentTable.name);

  useEffect(() => {
    setNewTableName(currentTable.name);
  }, [currentTable?.name]);

  const flushTable = async () => {
    await executeQuery(`DELETE FROM "${currentTable.name}";`);
    await refresh();
  };

  const dropTable = async () => {
    await executeQuery(`DROP TABLE "${currentTable.name}";`);
    await refresh();
  };

  const renameTable = async (event) => {
    event.preventDefault();

    await executeQuery(
      `ALTER TABLE "${currentTable.name}" RENAME TO "${newTableName}";`
    );
    await refresh();
  };

  const onDownload = async () => {
    const blob = await download(database);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = database;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <form onSubmit={renameTable}>
        <GroupBox
          label="Rename table"
          style={{ marginBottom: 24, display: 'flex', gap: 8 }}
        >
          <TextField
            value={newTableName}
            onChange={(event) => setNewTableName(event.target.value)}
            style={{ width: 200 }}
          />

          <Button type="submit">Rename</Button>
        </GroupBox>
      </form>

      <GroupBox label="Export database" style={{ marginBottom: 24 }}>
        <Button onClick={onDownload}>Download a copy</Button>
      </GroupBox>

      <GroupBox label="Danger zone" style={{ marginBottom: '2rem' }}>
        <p style={{ marginBottom: '1rem' }}>
          <span style={{ fontWeight: 'bold' }}> {currentTable.name}</span> data
          will be lost!
        </p>
        <Button style={{ marginRight: 8 }} onClick={flushTable}>
          Empty table
        </Button>
        <Button style={{ marginRight: 8 }} onClick={dropTable}>
          Delete table
        </Button>
      </GroupBox>

      <GroupBox label="SQL Describe">
        <InnerPanel>{currentTable.describe}</InnerPanel>
      </GroupBox>
    </>
  );
}
