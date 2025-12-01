import React from 'react';
import styled from 'styled-components';
import { ClosableWindow } from './ClosableWindow';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
`;

const Container = styled.div`
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  z-index: 1000;
`;

export function ContentModal({ title, children, onClose }) {
  return (
    <>
      <Overlay onClick={onClose} />
      <Container>
        <ClosableWindow
          title={title}
          onClose={onClose}
          style={{ width: 500, maxWidth: '90vw' }}
          active
        >
          {children}
        </ClosableWindow>
      </Container>
    </>
  );
}
