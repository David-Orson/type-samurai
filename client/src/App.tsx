import React from "react";
import styled from "styled-components";
import { Slate } from "./components/slate";

export const App = () => {
  return (
    <Body>
      <Slate />
    </Body>
  );
};

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  background: linear-gradient(180deg, #202430 0%, #1d2028 60%);
  height: 100%;
  min-height: 100vh;
  color: #c6c8d1;
  overflow: hidden;
`;
