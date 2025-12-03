import React, { useState, useCallback } from 'react';

const ReactContext = React.createContext(null);

function ModalProvider({ children }) {
  const [modalState, setModalState] = useState(null);

  const openModal = useCallback(
    ({ type, title, message = undefined, content = undefined }) => {
      return new Promise((resolve) => {
        setModalState({
          type,
          title,
          message,
          content,
          resolve,
        });
      });
    },
    []
  );

  const closeModal = useCallback(
    (result = true) => {
      if (modalState?.resolve) {
        modalState.resolve(result);
      }
      setModalState(null);
    },
    [modalState]
  );

  // Raccourcis pour les cas courants
  const error = useCallback(
    (title, message) => {
      return openModal({ type: 'error', title, message });
    },
    [openModal]
  );

  const confirm = useCallback(
    ({ title, message }) => {
      return openModal({ type: 'confirm', title, message });
    },
    [openModal]
  );

  const content = useCallback(
    ({ title, content }) => {
      return openModal({ type: 'content', title, content });
    },
    [openModal]
  );

  return (
    <ReactContext.Provider
      value={{
        modalState,
        openModal,
        closeModal,
        error,
        confirm,
        content,
      }}
    >
      {children}
    </ReactContext.Provider>
  );
}

function useModal() {
  const context = React.useContext(ReactContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Hooks de commodité pour rétro-compatibilité
function useErrorModal() {
  const { error, closeModal } = useModal();
  return {
    open: error,
    close: () => closeModal(true),
  };
}

function useConfirm() {
  const { confirm } = useModal();
  return confirm;
}

export { ModalProvider, useModal, useErrorModal, useConfirm };
