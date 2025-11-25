import React from 'react';
import { Button, ListItem, GroupBox } from 'react95';
import { useTables } from '../contexts/Tables';
import { BoldIf } from './BoldIf';
import { Space } from './Space';

export function TableList({ createTable }) {
  const { currentTable, setCurrentTableName, tables, refresh } = useTables();

  return (
    <>
      <Button fullWidth onClick={createTable}>
        Create table
      </Button>

      <Space vertical size={0.5} />

      <Button fullWidth onClick={refresh}>
        Refresh tables
      </Button>

      <Space vertical size={2} />

      <GroupBox
        label={`Tables (${tables.length})`}
        style={{ width: 220, padding: '16px 4px' }}
      >
        {tables.map((table) => {
          return (
            <ListItem
              key={table.name}
              size="sm"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setCurrentTableName(table.name);
              }}
            >
              <div style={{ display: 'flex' }}>
                <span
                  style={{
                    width: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'start',
                  }}
                >
                  <BoldIf condition={table.name === currentTable?.name}>
                    {table.name}
                  </BoldIf>
                </span>
              </div>
              <BoldIf condition={table.name === currentTable?.name}>
                ({table.lines})
              </BoldIf>
            </ListItem>
          );
        })}
      </GroupBox>
    </>
  );
}
