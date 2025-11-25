import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableHeadCell,
  TableBody,
  TableDataCell,
  Checkbox,
  Anchor,
} from 'react95';

import { BoldIf } from '../../components/BoldIf';
import { Null } from '../../components/Null';

export function BrowseResults({
  data,
  orderBy,
  changeOrderBy,
  selectEditingRow,
  selected,
  setSelected,
}) {
  const headers = data[0] ? Object.keys(data[0]) : [];
  const rows = Array.isArray(data) ? data : [];

  const changeSelection = (isSelected, index) => {
    if (isSelected) {
      setSelected([...selected, index]);
    } else {
      setSelected(selected.filter((value) => value !== index));
    }
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        width: 'calc(100vw - 345px)',
        overflowX: 'auto',
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell></TableHeadCell>
            <TableHeadCell></TableHeadCell>
            {headers
              .filter((header) => header !== 'rowid')
              .map((header) => (
                <TableHeadCell
                  key={header}
                  onClick={() => changeOrderBy(header)}
                  style={{ cursor: 'pointer' }}
                >
                  <BoldIf condition={orderBy === header}>{header}</BoldIf>
                </TableHeadCell>
              ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const values = Object.entries(row)
              .filter(([key]) => key !== 'rowid')
              .map(([, value]) => value);

            return (
              <TableRow key={index}>
                <TableDataCell style={{ width: 40 }}>
                  <Checkbox
                    checked={selected.includes(index)}
                    onChange={(event) =>
                      changeSelection(event.target.checked, index)
                    }
                  />
                </TableDataCell>
                <TableDataCell style={{ width: 40 }}>
                  <Anchor
                    style={{ cursor: 'pointer' }}
                    onClick={() => selectEditingRow(row.rowid)}
                  >
                    edit
                  </Anchor>
                </TableDataCell>

                {values.map((value, valuesIndex) => (
                  <TableDataCell
                    key={`${index}-${valuesIndex}`}
                    style={{
                      whiteSpace: 'nowrap',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {value === null ? <Null /> : value}
                  </TableDataCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
