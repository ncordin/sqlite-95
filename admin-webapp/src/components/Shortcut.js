import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: inline-block;
  padding: 2rem;
  text-align: center;
  color: white;
  cursor: pointer;
  vertical-align: top;
`;

const Subtitle = styled.div`
  font-size: 0.75rem;
  color: #b0b0b0;
  margin-top: 2px;
`;

export function Shortcut({ icon, name, subtitle = null, onClick }) {
  return (
    <Container onClick={onClick}>
      <div>
        <img src={`./assets/${icon}.png`} alt={name} width="32" height="32" />
      </div>
      {name}
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </Container>
  );
}
