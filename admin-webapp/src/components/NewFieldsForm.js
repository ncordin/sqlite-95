import React from 'react';
import { Checkbox, Select, TextField } from 'react95';
import styled from 'styled-components';

const typeOptions = [
  { value: 'INTEGER', label: 'INTEGER' },
  { value: 'TEXT', label: 'TEXT' },
  { value: 'REAL', label: 'REAL' },
];

export const defaultField = {
  name: '',
  type: 'INTEGER',
  canBeNull: false,
  defaultValue: null,
  primaryKey: false,
  autoIncrement: false,
};

const StyledTable = styled.table`
  margin: 0;

  td {
    vertical-align: middle;
    padding-right: 1px 8px;
  }
`;

export function NewFieldsForm({ fields, setFields }) {
  return (
    <StyledTable style={{ width: '100%' }}>
      <thead>
        <tr>
          <td>Field name</td>
          <td>Field type</td>
          <td>Allow null</td>
          <td>Default value</td>
        </tr>
      </thead>
      <tbody>
        {fields.map((field, index) => {
          const updateField = (property, value) => {
            const newFields = [...fields];
            newFields[index] = { ...field, [property]: value };

            setFields(newFields);
          };

          return (
            <tr key={index}>
              <td>
                <TextField
                  value={field.name}
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </td>
              <td>
                <Select
                  options={typeOptions}
                  value={field.type}
                  width={160}
                  onChange={(event) => updateField('type', event.value)}
                />
              </td>
              <td>
                <Checkbox
                  label=""
                  checked={field.canBeNull}
                  onChange={(event) =>
                    updateField('canBeNull', event.target.checked)
                  }
                />
              </td>
              <td style={{ display: 'flex' }}>
                <Checkbox
                  label=""
                  checked={field.defaultValue !== null}
                  onChange={(event) =>
                    updateField(
                      'defaultValue',
                      event.target.checked ? '' : null
                    )
                  }
                />
                <TextField
                  value={field.defaultValue || ''}
                  disabled={field.defaultValue === null}
                  onChange={(event) =>
                    updateField('defaultValue', event.target.value)
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
