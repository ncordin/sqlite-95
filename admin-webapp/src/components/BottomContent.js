import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClosableWindow } from './ClosableWindow';
import { ScrollView } from 'react95';

export function BottomContent({ children, title = '' }) {
  const [visible, setVisible] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    return () => setVisible(false);
  }, []);

  const element = document.getElementById('bottom-content-portal');

  if (!element || !visible) {
    return null;
  }

  if (isMaximized) {
    return createPortal(
      <ClosableWindow
        active={false}
        title={title}
        style={{ marginRight: 20 }}
        onMaximize={() => setIsMaximized(false)}
      >
        {children}
      </ClosableWindow>,
      element
    );
  }

  return createPortal(
    <ClosableWindow
      active={false}
      title={title}
      style={{ marginRight: 20 }}
      onMaximize={() => setIsMaximized(true)}
    >
      <ScrollView
        style={{
          width: 'calc(100vw - 340px)',
          height: 'calc(100vh - 340px)',
        }}
      >
        {children}
      </ScrollView>
    </ClosableWindow>,
    element
  );
}
