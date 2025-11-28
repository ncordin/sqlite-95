import React, { useState } from 'react';
import { Button, GroupBox } from 'react95';

import { useTables } from '../../contexts/Tables';
import { RowForm } from '../../components/RowForm';
import { useApi } from '../../utils/useApi';
import { InnerPanel } from '../../components/InnerPanel';
import { escapeFieldName, escapeValue } from '../../utils/query';
import { Space } from '../../components/Space';

export function InsertTab({ onCreated }) {
  const { currentTable, refresh } = useTables();
  const { executeQuery } = useApi();
  const [editingRow, setEditingRow] = useState({});

  const fields = Object.keys(editingRow)
    .map((name) => escapeFieldName(name))
    .join(', ');

  const values = Object.values(editingRow)
    .map((value) => escapeValue(value))
    .join(', ');

  const query = `INSERT INTO \`${currentTable.name}\` (${fields}) VALUES (${values});`;

  const onSubmit = async (event) => {
    event.preventDefault();

    executeQuery(query).then(() => {
      onCreated();
      refresh();
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <GroupBox label={`Insert into ${currentTable.name}`}>
        <RowForm row={editingRow} onChange={setEditingRow} />
      </GroupBox>

      <Space size={0.5} vertical />

      <Button type="submit">Insert</Button>

      <Space size={0.5} vertical />

      <InnerPanel>{query}</InnerPanel>
    </form>
  );
}
