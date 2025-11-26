import React from 'react';
import { GroupBox } from 'react95';
import { Centred } from '../components/Centred';

export function EmptyTab() {
  return (
    <Centred>
      <GroupBox label="Oups!" style={{ padding: 64 }}>
        <Centred>This table does not exits.</Centred>
      </GroupBox>
    </Centred>
  );
}
