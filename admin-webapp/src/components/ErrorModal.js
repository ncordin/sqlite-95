import React from 'react';
import styled from 'styled-components';
import { Button } from 'react95';
import { ClosableWindow } from './ClosableWindow';

const Container = styled.div`
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
`;

const Content = styled.div`
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MessageRow = styled.div`
  display: flex;
  align-items: center;
`;

const Icon = styled.span`
  display: inline-block;
  font-size: 2rem;
  margin-right: 1rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
`;

export function ErrorModal({ title, children, onClose }) {
  return (
    <Container>
      <ClosableWindow
        title={title}
        onClose={onClose}
        style={{ width: 400 }}
        active
      >
        <Content>
          <MessageRow>
            <Icon>❌</Icon>
            {children}
          </MessageRow>
          <ButtonRow>
            <Button onClick={onClose} style={{ width: 80 }}>
              OK
            </Button>
          </ButtonRow>
        </Content>
      </ClosableWindow>
    </Container>
  );
}
