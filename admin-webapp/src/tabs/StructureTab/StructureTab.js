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
import { InnerPanel } from '../../components/InnerPanel';

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
  const { executeQuery } = useApi();
  const { currentTable, refresh } = useTables();

  const [renamingField, setRenamingField] = useState(null);
  const [renameFieldName, setRenameFieldName] = useState('');

  const [addFields, setAddFields] = useState([defaultField]);

  const [indexes, setIndexes] = useState([]);

  const refreshIndexes = () => {
    executeQuery(`PRAGMA index_list("${currentTable.name}");`).then(setIndexes);
  };

  useEffect(() => {
    refreshIndexes();
  }, [currentTable?.name]);

  const rename = async () => {
    const query = makeRenameField({
      currentName: renamingField,
      newName: renameFieldName,
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

  const addFieldQuery = makeAddField({
    field: addFields[0],
    tableName: currentTable.name,
  });

  const doAddField = async () => {
    const query = makeAddField({
      field: addFields[0],
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
                        setRenameFieldName('');
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
            <Space vertical size={4} />
            <TextField
              value={renameFieldName}
              placeholder={renamingField}
              onChange={(event) => setRenameFieldName(event.target.value)}
            />
            <Space />
            <Button onClick={rename}>Rename</Button>
            <Space />
            <Button onClick={() => setRenamingField(null)}>Cancel</Button>
          </FlexRow>
        )}
      </GroupBox>

      <Space size={2} vertical />

      <GroupBox label="Add field">
        <NewFieldsForm fields={addFields} setFields={setAddFields} />
        <Space vertical size={0.5} />
        <Button onClick={doAddField}>Add field</Button>
        <Space vertical size={0.5} />
        <InnerPanel>{addFieldQuery}</InnerPanel>
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
