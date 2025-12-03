import React, { useState } from 'react';
import { Button, Checkbox, GroupBox, Radio, Select } from 'react95';
import { ContentModal } from '../../components/Modal';
import { FlexRow } from '../../components/FlexRow';
import { Space } from '../../components/Space';
import { useApi } from '../../utils/useApi';
import styled from 'styled-components';

const Warning = styled.div`
  padding: 8px;
  background: #ffc;
  border: 1px solid #cc9;
  margin-bottom: 24px;
  font-size: 12px;
`;

export function MoveField({ fieldName, currentTable, onClose, onSuccess }) {
  const { moveColumn } = useApi();
  const [movePosition, setMovePosition] = useState('after');
  const [moveRelativeField, setMoveRelativeField] = useState('');
  const [deleteTransitionTable, setDeleteTransitionTable] = useState(true);

  if (!fieldName) {
    return null;
  }

  const handleValidate = async () => {
    const params = {
      fieldToMove: fieldName,
      position: movePosition,
      relativeField: moveRelativeField,
      tableName: currentTable.name,
      deleteTransitionTable,
    };

    const { success } = await moveColumn(params);

    if (success) {
      onSuccess();
    }
  };

  return (
    <ContentModal title={`Move field "${fieldName}"`} onClose={onClose}>
      <div>
        <Warning>
          ⚠️ This operation may take some time if the table contains a lot of
          data. A transition table will be created during the process.
        </Warning>

        <GroupBox label="Position">
          <Radio
            checked={movePosition === 'after'}
            onChange={(e) => setMovePosition(e.target.value)}
            value="after"
            label="After"
            name="position"
            style={{ marginRight: 8 }}
          />
          <Radio
            checked={movePosition === 'before'}
            onChange={(e) => setMovePosition(e.target.value)}
            value="before"
            label="Before"
            name="position"
          />
        </GroupBox>

        <Space vertical />

        <GroupBox label="Field">
          <Select
            options={[
              { value: '', label: '-- Select a field --' },
              ...currentTable.structure
                .filter((f) => f.name !== fieldName)
                .map((field) => ({
                  value: field.name,
                  label: field.name,
                })),
            ]}
            value={moveRelativeField}
            width="100%"
            onChange={(option) => setMoveRelativeField(option.value)}
          />
        </GroupBox>

        <Space vertical />

        <Checkbox
          label="Automatically delete transition table after operation."
          checked={deleteTransitionTable}
          onChange={(e) => setDeleteTransitionTable(e.target.checked)}
        />

        <Space vertical />

        <FlexRow>
          <Button onClick={handleValidate} disabled={!moveRelativeField}>
            Move
          </Button>
          <Space />
          <Button onClick={onClose}>Cancel</Button>
        </FlexRow>
      </div>
    </ContentModal>
  );
}
