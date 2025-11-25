import React from 'react';
import styled from 'styled-components';

const StyledFlexRow = styled.div`
  display: flex;
  align-items: center;
  padding: 0;
`;

export const FlexRow = ({ between = false, children }) => (
  <StyledFlexRow style={{ justifyContent: between ? 'space-between' : '' }}>
    {children}
  </StyledFlexRow>
);
