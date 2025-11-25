import React, { useEffect, useState } from 'react';
import { Anchor, Button, GroupBox, TextField } from 'react95';
import styled from 'styled-components';
import { FlexRow } from '../../components/FlexRow';
import { defaultField, NewFieldsForm } from '../../components/NewFieldsForm';
import { Null } from '../../components/Null';
import { Space } from '../../components/Space';
import { useTables } from '../../contexts/Tables';
import {
  makeAddField,
  makeDropField,
  makeRenameField,
} from '../../utils/query';
import { useApi } from '../../utils/useApi';
import { CreateIndex } from './CreateIndex';
import { ListIndex } from './ListIndex';

const StyledTable = styled.table`
  margin: 0;
  width: 100%;

  td {
    padding: 4px 0.5rem;
    vertical-align: middle;
  }
`;

const Link = styled(Anchor)`
  cursor: pointer;
`;

function getDefaultValue(field) {
  if (field.defaultValue && field.canBeNull) {
    return (
      <span>
        <Null /> {field.defaultValue}
      </span>
    );
  }

  if (field.defaultValue) {
    return field.defaultValue;
  }

  if (field.canBeNull) {
    return <Null />;
  }

  return '⚠️';
}

export function StructureTab() {
  const { currentTable, refresh } = useTables();
  const [fields, setFields] = useState([defaultField]);
  const [indexes, setIndexes] = useState([]);
  const [renamingField, setRenamingField] = useState(null);
  const [newFieldName, setNewFieldName] = useState('');
  const { executeQuery } = useApi();

  const refreshIndexes = () => {
    executeQuery(`PRAGMA index_list("${currentTable.name}");`).then(setIndexes);
  };

  useEffect(() => {
    refreshIndexes();
  }, [currentTable?.name]);

  const rename = async () => {
    const query = makeRenameField({
      currentName: renamingField,
      newName: newFieldName,
      tableName: currentTable.name,
    });

    await executeQuery(query);
    await refresh();

    setRenamingField(null);
  };

  const drop = async (fieldName) => {
    const query = makeDropField({
      fieldName,
      tableName: currentTable.name,
    });

    await executeQuery(query);
    await refresh();
  };

  const addField = async () => {
    const query = makeAddField({
      field: fields[0],
      tableName: currentTable.name,
    });

    await executeQuery(query);
    await refresh();
  };

  return (
    <div>
      <GroupBox label="Fields">
        <StyledTable style={{ width: '100%' }}>
          <tbody>
            {currentTable.structure.map((field) => {
              return (
                <tr key={field.name}>
                  <td style={{ fontWeight: 'bold' }}>{field.name}</td>
                  <td>{field.type.toUpperCase()}</td>
                  <td>{getDefaultValue(field)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      onClick={() => {
                        setRenamingField(field.name);
                        setNewFieldName('');
                      }}
                    >
                      rename
                    </Link>{' '}
                    - <Link onClick={() => drop(field.name)}>drop</Link> -{' '}
                    <Link onClick={() => null}>move</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </StyledTable>
        {renamingField && (
          <FlexRow>
            <TextField
              value={newFieldName}
              placeholder={renamingField}
              onChange={(event) => setNewFieldName(event.target.value)}
            />
            <Space vertical />
            <Button onClick={rename}>Rename</Button>
            <Space vertical />
            <Button onClick={() => setRenamingField(null)}>Cancel</Button>
          </FlexRow>
        )}
      </GroupBox>

      <Space size={2} vertical />

      <GroupBox label="Add field">
        <NewFieldsForm fields={fields} setFields={setFields} />
        <Space vertical />
        <Button onClick={addField}>Add field</Button>
      </GroupBox>

      <Space size={2} vertical />

      <ListIndex
        indexes={indexes}
        refreshIndexes={refreshIndexes}
        currentTable={currentTable}
      />

      <Space size={2} vertical />

      <CreateIndex refreshIndexes={refreshIndexes} />
    </div>
  );
}
