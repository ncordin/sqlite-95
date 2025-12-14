import React from 'react';
import { Button } from 'react95';
import { ClosableWindow } from './ClosableWindow';
import { useModal } from '../contexts/Modal';

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
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 999,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '40%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-50%)',
          zIndex: 1000,
        }}
      >
        <ClosableWindow
          title={title}
          onClose={handleClose}
          style={{ width: 400, maxWidth: '90vw' }}
          active
        >
          {isContentModal ? (
            content
          ) : (
            <div
              style={{
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {icon && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '2rem',
                      marginRight: '1rem',
                    }}
                  >
                    {icon}
                  </span>
                )}
                {message}
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'center', gap: 8 }}
              >
                <Button onClick={handleConfirm} style={{ width: 80 }}>
                  OK
                </Button>
                {showCancelButton && (
                  <Button onClick={handleClose} style={{ width: 80 }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </ClosableWindow>
      </div>
    </>
  );
}

// Export pour le cas où on veut utiliser ContentModal en standalone (sans context)
export function ContentModal({
  title,
  children,
  onClose,
  width = undefined,
  fixedTop = undefined,
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 999,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: fixedTop || '40%',
          left: '50%',
          transform: `translateX(-50%)${fixedTop ? '' : ' translateY(-50%)'}`,
          zIndex: 1000,
        }}
      >
        <ClosableWindow
          title={title}
          onClose={onClose}
          style={{ width: width || 500, maxWidth: '90vw' }}
          active
        >
          {children}
        </ClosableWindow>
      </div>
    </>
  );
}
