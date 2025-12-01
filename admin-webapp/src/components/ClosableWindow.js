import React from 'react';
import { Button, Window, WindowContent, WindowHeader } from 'react95';
import styled from 'styled-components';

const StyledWindow = styled(Window)`
  .window-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 8px;
  }

  .window-controls {
    display: flex;
    gap: 2px;
  }

  .grow-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-left: -1px;
    margin-top: -1px;
    position: relative;

    &:before {
      content: '';
      position: absolute;
      width: 14px;
      height: 13px;
      border: 2px solid black;
      border-top: 4px solid black;
      top: 2px;
      left: 1px;
      box-sizing: border-box;
    }
  }

  .close-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-left: -1px;
    margin-top: -1px;
    transform: rotateZ(45deg);
    position: relative;
    &:before,
    &:after {
      content: '';
      position: absolute;
      background: black;
    }
    &:before {
      height: 100%;
      width: 3px;
      left: 50%;
      transform: translateX(-50%);
    }
    &:after {
      height: 3px;
      width: 100%;
      left: 0px;
      top: 50%;
      transform: translateY(-50%);
    }
  }

  .window:nth-child(2) {
    margin: 2rem;
  }
`;

export function ClosableWindow({
  title = '',
  children,
  onMaximize = undefined,
  onClose = undefined,
  className = '',
  style = {},
  active,
}) {
  return (
    <StyledWindow className={className} style={style}>
      {(title || onClose || onMaximize) && (
        <WindowHeader className="window-header" active={active}>
          <span>{title}</span>
          <div className="window-controls">
            {onMaximize && (
              <Button onClick={onMaximize}>
                <span className="grow-icon" />
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose}>
                <span className="close-icon" />
              </Button>
            )}
          </div>
        </WindowHeader>
      )}

      <WindowContent style={{ padding: 8, paddingTop: 12 }}>
        {children}
      </WindowContent>
    </StyledWindow>
  );
}
