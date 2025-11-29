import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Button, Frame, Separator, TextField } from 'react95';
import { ClosableWindow } from '../components/ClosableWindow';
import { Space } from '../components/Space';
import { usePassword } from '../contexts/Password';

const Container = styled.div`
  position: fixed;
  top: 45%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
`;

const Flex = styled.div`
  display: flex;
  width: 100%;
`;

const LargeButton = styled(Button)`
  width: 100px;
`;

export function Login() {
  const [localPassword, setLocalPassword] = useState('');
  const [title, setTitle] = useState(null);
  const [error, setError] = useState(null);
  const { login } = usePassword();
  const passwordRef = useRef(null);

  useEffect(() => {
    if (passwordRef.current) {
      passwordRef.current.focus();
    }
  }, []);

  return (
    <Container>
      <ClosableWindow
        title={title || 'Welcome! - SQLite 95'}
        style={{ width: 500 }}
        active
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();

            const result = await login(localPassword);

            if (!result.success) {
              setTitle(result.error.title);
              setError(result.error.message);
              setLocalPassword('');
              passwordRef.current.focus();
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', height: 150 }}
        >
          <Flex style={{ flex: 1, gap: 8 }}>
            {error ? (
              <span style={{ fontSize: '2.5rem', marginRight: 4 }}>❌</span>
            ) : (
              <img src="./assets/keys.ico" height="40" width="40" />
            )}

            <table style={{ flex: 1, margin: '0 8px' }}>
              <tbody>
                <tr style={{ height: 42 }}>
                  <td>Username:</td>
                  <td>
                    <TextField value="admin" onChange={() => null} disabled />
                  </td>
                </tr>
                <tr>
                  <td>Password:</td>
                  <td>
                    <TextField
                      type="password"
                      value={localPassword}
                      onChange={(event) => setLocalPassword(event.target.value)}
                      ref={passwordRef}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <section>
              <LargeButton type="submit">Ok</LargeButton>
              <Space vertical size={0.5} />
              <LargeButton onClick={() => null} disabled>
                Cancel
              </LargeButton>
            </section>
          </Flex>

          <Frame
            variant="well"
            style={{
              padding: '2px 8px',
              width: '100%',
            }}
          >
            {error || 'Admin password is required.'}
          </Frame>
        </form>
      </ClosableWindow>
    </Container>
  );
}
