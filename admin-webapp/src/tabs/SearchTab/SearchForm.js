import React from 'react';
import { Select, TextField } from 'react95';
import styled from 'styled-components';

import { useTables } from '../../contexts/Tables';

const NUMERICS = ['int', 'integer', 'tinyint', 'smallint', 'mediumint'];

const OPERATORS = [
  { value: '', label: '' },
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: '<', label: '<' },
  { value: '>', label: '>' },
  { value: 'IS NULL', label: 'IS NULL' },
  { value: 'IS NOT NULL', label: 'IS NOT NULL' },
  { value: 'LIKE', label: 'LIKE' },
  { value: 'NOT LIKE', label: 'NOT LIKE' },
];

const isNumericalType = (type) => {
  const [split] = type.toLowerCase().split('(');

  return NUMERICS.includes(split);
};

function isNumericalValue(value) {
  return /^-?\d+$/.test(value);
}

const StyledTable = styled.table`
  td {
    padding: 1px 0.5rem;
    vertical-align: middle;
  }
`;

function renderInput({ field, value, setValue, disabled }) {
  let onChange = (event) => setValue(event.target.value);

  if (isNumericalType(field.type)) {
    onChange = (event) => {
      const value = event.target.value;

      if (value === '' || isNumericalValue(value)) {
        return setValue(value);
      }
    };
  }

  return (
    <TextField value={value || ''} onChange={onChange} disabled={disabled} />
  );
}

export function SearchForm({ criteria, onChange }) {
  const { currentTable } = useTables();

  const updateCriteria = (fieldName, updates) => {
    const newCriteria = {
      ...criteria,
      [fieldName]: {
        ...criteria[fieldName],
        ...updates,
      },
    };

    onChange(newCriteria);
  };

  return (
    <StyledTable style={{ width: '100%' }}>
      <tbody>
        {currentTable.structure.map((field) => {
          const fieldCriteria = criteria[field.name] || {
            operator: '',
            value: '',
          };

          // Désactiver le champ texte si l'opérateur est IS NULL ou IS NOT NULL
          const isFieldDisabled =
            fieldCriteria.operator === 'IS NULL' ||
            fieldCriteria.operator === 'IS NOT NULL';

          return (
            <tr key={field.name}>
              <td style={{ fontWeight: 'bold' }}>{field.name}</td>
              <td>{field.type.toUpperCase()}</td>
              <td>
                <Select
                  value={fieldCriteria.operator}
                  options={OPERATORS}
                  onChange={(e) => {
                    const selectedOperator = e.value;
                    updateCriteria(field.name, {
                      operator: selectedOperator,
                      value:
                        selectedOperator === 'IS NULL' ||
                        selectedOperator === 'IS NOT NULL'
                          ? ''
                          : fieldCriteria.value,
                    });
                  }}
                  width={120}
                />
              </td>
              <td>
                {renderInput({
                  field,
                  value: fieldCriteria.value,
                  setValue: (value) => updateCriteria(field.name, { value }),
                  disabled: isFieldDisabled,
                })}
              </td>
            </tr>
          );
        })}
      </tbody>
    </StyledTable>
  );
}
