import React from 'react';
import styled from 'styled-components';
import { Button } from 'react95';
import { ClosableWindow } from './ClosableWindow';
import { useModal } from '../contexts/Modal';

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
  gap: 8px;
`;

const ICONS = {
  error: '❌',
  confirm: '⚠️',
};

export function Modal() {
  const { modalState, closeModal } = useModal();

  if (!modalState) {
    return null;
  }

  const { type, title, message, content } = modalState;
  const icon = ICONS[type];
  const showCancelButton = type === 'confirm';
  const isContentModal = type === 'content';

  const handleClose = () => closeModal(false);
  const handleConfirm = () => closeModal(true);

  return (
    <>
      <Overlay onClick={handleClose} />
      <Container>
        <ClosableWindow
          title={title}
          onClose={handleClose}
          style={{ width: 400, maxWidth: '90vw' }}
          active
        >
          {isContentModal ? (
            content
          ) : (
            <Content>
              <MessageRow>
                {icon && <Icon>{icon}</Icon>}
                {message}
              </MessageRow>
              <ButtonRow>
                <Button onClick={handleConfirm} style={{ width: 80 }}>
                  OK
                </Button>
                {showCancelButton && (
                  <Button onClick={handleClose} style={{ width: 80 }}>
                    Cancel
                  </Button>
                )}
              </ButtonRow>
            </Content>
          )}
        </ClosableWindow>
      </Container>
    </>
  );
}

// Export pour le cas où on veut utiliser ContentModal en standalone (sans context)
export function ContentModal({ title, children, onClose, width = undefined }) {
  return (
    <>
      <Overlay onClick={onClose} />
      <Container>
        <ClosableWindow
          title={title}
          onClose={onClose}
          style={{ width: width || 500, maxWidth: '90vw' }}
          active
        >
          {children}
        </ClosableWindow>
      </Container>
    </>
  );
}
