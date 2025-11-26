import React, { useEffect, useState } from 'react';
import { Button, Checkbox, GroupBox, TextField } from 'react95';
import styled from 'styled-components';
import { FlexRow } from '../../components/FlexRow';
import { useTables } from '../../contexts/Tables';
import { makeIndex } from '../../utils/query';
import { useApi } from '../../utils/useApi';
import { Space } from '../../components/Space';

const Description = styled.div`
  flex-basis: 8rem;
  min-width: 150px;
`;

export function CreateIndex({ refreshIndexes }) {
  const { currentTable } = useTables();
  const { executeQuery } = useApi();

  const [fields, setFields] = useState([]);
  const [isUnique, setIsUnique] = useState(false);
  const name = fields.join(':');

  useEffect(() => {
    setFields([]);
    setIsUnique(false);
  }, [currentTable?.name]);

  const query = makeIndex({
    name,
    fields,
    isUnique,
    tableName: currentTable.name,
  });

  const submit = async (event) => {
    event.preventDefault();
    setFields([]);
    setIsUnique(false);

    await executeQuery(query);
    refreshIndexes();
  };

  const toggleFieldToIndex = (name) => {
    if (fields.includes(name)) {
      setFields(fields.filter((currentName) => currentName !== name));
    } else {
      setFields([...fields, name]);
    }
  };

  return (
    <GroupBox label="Create index">
      <form onSubmit={submit}>
        <FlexRow>
          <Description>Fields</Description>
          <div>
            {currentTable.structure.map((field) => (
              <Button
                key={field.name}
                style={{ marginRight: 3 }}
                active={fields.includes(field.name)}
                onClick={() => toggleFieldToIndex(field.name)}
              >
                {field.name}
              </Button>
            ))}
          </div>
        </FlexRow>
        <FlexRow>
          <Description>Unique</Description>
          <Checkbox
            checked={isUnique}
            onChange={(event) => setIsUnique(event.target.checked)}
          />
        </FlexRow>
        <FlexRow>
          <Description>Name</Description>
          <TextField style={{ width: 300 }} value={name} disabled />
        </FlexRow>

        <Space vertical />

        <Button type="submit" disabled={fields.length === 0}>
          Create index
        </Button>
      </form>
    </GroupBox>
  );
}
