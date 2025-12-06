import { Panel } from 'react95';
import React from 'react';

export const InnerPanel = ({ children, style }) => (
  <Panel
    variant="well"
    style={{
      padding: '0.25rem 0.5rem',
      width: '100%',
      ...style,
    }}
  >
    {children}
  </Panel>
);
