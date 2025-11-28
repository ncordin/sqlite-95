import React from 'react';
import styled from 'styled-components';
import { ClosableWindow } from './ClosableWindow';

const Container = styled.div`
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
`;

const Icon = styled.span`
  display: inline-block;
  font-size: 2rem;
  margin-right: 1rem;
`;

export function ErrorModal({ title, children, onClose }) {
  return (
    <Container>
      <ClosableWindow
        title={title}
        onClose={onClose}
        style={{ width: 400, minHeight: 200 }}
        active
      >
        <Icon>❌</Icon>
        {children}
      </ClosableWindow>
    </Container>
  );
}
