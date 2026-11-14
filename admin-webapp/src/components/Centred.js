import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

export function Centred({ children }) {
  return <Container>{children}</Container>;
}
