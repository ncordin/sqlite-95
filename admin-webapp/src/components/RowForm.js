import React from 'react';
import { Checkbox, TextField } from 'react95';
import styled from 'styled-components';

import { useTables } from '../contexts/Tables';

const NUMERICS = ['int', 'integer', 'tinyint', 'smallint', 'mediumint'];

const isNumericalType = (type) => {
  const [split] = type.toLowerCase().split('(');

  return NUMERICS.includes(split);
};

function isNumericalValue(value) {
  return /^-?\d+$/.test(value);
}

const StyledTable = styled.table`
  margin: 1rem 0;

  td {
    padding: 0 0.5rem;
    vertical-align: middle;
  }
`;

function renderInput({ field, value, setValue }) {
  let onChange = (event) => setValue(event.target.value);

  if (isNumericalType(field.type)) {
    onChange = (event) => {
      const value = event.target.value;

      if (isNumericalValue(value)) {
        return setValue(value);
      }
    };
  }

  return (
    <TextField
      value={value || ''}
      onChange={onChange}
      style={{ width: 300 }}
      disabled={value === null}
    />
  );
}

export function RowForm({ row, onChange }) {
  const { currentTable } = useTables();

  const makeUpdateField = (field) => (value) => {
    const newRow = { ...row, [field]: value };

    currentTable.structure.forEach((field) => {
      if (isNumericalType(field.type) && newRow[field.name] === '') {
        delete newRow[field.name];
      }
    });

    onChange(newRow);
  };

  return (
    <StyledTable style={{ width: '100%' }}>
      <tbody>
        {currentTable.structure.map((field) => {
          const initialValue = row[field.name];
          const hasDefaultValue =
            field.defaultValue !== null || field.canBeNull;
          const value =
            initialValue === undefined && hasDefaultValue
              ? field.defaultValue
              : initialValue;

          return (
            <tr key={field.name}>
              <td style={{ fontWeight: 'bold' }}>{field.name}</td>
              <td>{field.type.toUpperCase()}</td>
              <td>
                {renderInput({
                  field,
                  value,
                  setValue: makeUpdateField(field.name),
                })}
              </td>
              <td>
                <Checkbox
                  label="NULL"
                  disabled={!field.canBeNull}
                  checked={value === null}
                  onChange={(event) =>
                    makeUpdateField(field.name)(
                      event.target.checked ? null : ''
                    )
                  }
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </StyledTable>
  );
}
