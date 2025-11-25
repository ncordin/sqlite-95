import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableHeadCell,
  TableBody,
  TableDataCell,
} from 'react95';

export function SqlResults({ data }) {
  const headers = data[0] ? Object.keys(data[0]) : [];
  const rows = Array.isArray(data) ? data : [];

  return (
    <Table>
      <TableHead>
        <TableRow>
          {headers.map((header) => (
            <TableHeadCell key={header} disabled>
              {header}
            </TableHeadCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => {
          const values = Object.values(row);

          return (
            <TableRow key={index}>
              {values.map((value, valuesIndex) => (
                <TableDataCell
                  key={`${index}-${valuesIndex}`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {value}
                </TableDataCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
