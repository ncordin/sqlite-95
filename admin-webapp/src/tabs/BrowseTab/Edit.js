import React, { useEffect, useState } from 'react';

import { useTables } from '../../contexts/Tables';
import { RowForm } from '../../components/RowForm';
import { InnerPanel } from '../../components/InnerPanel';
import { makeSet } from '../../utils/query';
import { Button, GroupBox } from 'react95';
import { useApi } from '../../utils/useApi';
import { useUrlParam } from '../../utils/useUrlParam';

export function Edit() {
  const { currentTable } = useTables();
  const [rowid, setRowid] = useUrlParam('rowid');
  const [editingRow, setEditingRow] = useState({});
  const [showQuery, setShowQuery] = useState(false);
  const { executeQuery } = useApi();

  useEffect(() => {
    executeQuery(
      `SELECT rowid, * FROM \`${currentTable.name}\` WHERE rowid=${rowid}`
    ).then((data) => {
      setEditingRow(data[0]);
    });
  }, [rowid]);

  useEffect(() => {
    return cancel;
  }, []);

  const set = makeSet(editingRow);
  const query = `UPDATE \`${currentTable.name}\` SET ${set} WHERE rowid=${rowid}`;

  const onSubmit = async (event) => {
    event.preventDefault();
    await executeQuery(query);
    setRowid('');
  };

  const cancel = () => {
    setRowid('');
  };

  if (Object.keys(editingRow).length === 0) {
    return null;
  }

  return (
    <form onSubmit={onSubmit}>
      <GroupBox label={`Editing ${currentTable.name}`}>
        <RowForm row={editingRow} onChange={setEditingRow} />
      </GroupBox>

      <div style={{ margin: '1rem 0' }}>
        <Button type="submit" style={{ marginRight: '0.5rem' }}>
          Update
        </Button>
        <Button onClick={cancel} style={{ marginRight: '0.5rem' }}>
          Cancel
        </Button>
        <Button onClick={() => setShowQuery(!showQuery)}>Show query</Button>
      </div>

      {showQuery && <InnerPanel>{query}</InnerPanel>}
    </form>
  );
}
