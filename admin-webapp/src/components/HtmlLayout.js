import React from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { styleReset } from 'react95';
import original from 'react95/dist/themes/original';
// import original from 'react95/dist/themes/tokyoDark';

import { Modal } from './Modal';

const GlobalStyles = createGlobalStyle`
  body {
    font-family: 'ms_sans_serif';
    background-color: teal;
    height: 100vh;
  }
  html {
    font-size: 14px !important;
  }
  ${styleReset}
  * {
    box-sizing: border-box;
    letter-spacing: 0.5px;
  }
`;

const StyledLayout = styled.div`
  font-family: 'ms_sans_serif';
`;

export function HtmlLayout({ children }) {
  return (
    <>
      <GlobalStyles />
      <ThemeProvider theme={original}>
        <StyledLayout>{children}</StyledLayout>
        <Modal />
      </ThemeProvider>
    </>
  );
}
