import React from 'react';
import { Checkbox, NumberInput, TextInput } from 'react95';
import styled from 'styled-components';

import { useTables } from '../contexts/Tables';

const NUMERICS = [
  'int',
  'integer',
  'tinyint',
  'smallint',
  'mediumint',
  'boolean',
];

const isNumericalType = (type) => {
  const [split] = type.toLowerCase().split('(');

  return NUMERICS.includes(split);
};

const StyledTable = styled.table`
  td {
    padding: 1px 8px;
    vertical-align: middle;
  }
`;

function renderInput({ field, value, disabled, setValue }) {
  if (isNumericalType(field.type)) {
    const safeValue =
      value === undefined || value === null || value === '' || isNaN(value)
        ? undefined
        : parseFloat(value);

    return (
      <NumberInput
        defaultValue={safeValue}
        step={1}
        onChange={setValue}
        width={220}
        disabled={disabled}
      />
    );
  }

  const onChange = (event) => {
    return setValue(event.target.value);
  };

  return (
    <TextInput
      value={value || ''}
      onChange={onChange}
      style={{ width: 220 }}
      disabled={disabled}
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
          const value = row[field.name];
          const warning =
            value === undefined && !field.canBeNull && !field.defaultValue;

          return (
            <tr key={field.name}>
              <td style={{ fontWeight: 'bold' }}>{field.name}</td>
              <td>
                {field.type.toUpperCase()} {warning && '⚠️'}
              </td>
              <td>
                {renderInput({
                  field,
                  value: value === undefined ? field.defaultValue : value,
                  disabled: value === null,
                  setValue: makeUpdateField(field.name),
                })}
              </td>
              <td>
                <Checkbox
                  label="NULL"
                  disabled={!field.canBeNull}
                  checked={value === null}
                  onChange={(event) => {
                    return makeUpdateField(field.name)(
                      event.target.checked ? null : ''
                    );
                  }}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </StyledTable>
  );
}
