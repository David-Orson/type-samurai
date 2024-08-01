import React, { useState } from "react";
import styled from "styled-components";
import axios from "axios";

// components
import { Slate } from "./components/slate";

// data
import { eng200 } from "./wordsets";
import { eng1k } from "./wordsets";

export const App = () => {
  // state
  const [wordset, setWordset] = useState({ id: 1, words: eng200.split(" ") });
  const [isSlowWords, setIsSlowWords] = useState(false);

  // methods
  const postWord = (word: string, wpm: number, setId: number) => {
    axios.post("http://localhost:8080/word", { word, wpm, wordset: setId });
  };

  const getSlowWords = async () => {
    const res = await axios.get("http://localhost:8080/words/" + wordset.id);
    const slowWords = res.data.map((word: any) => word.lowercase);
    setWordset({ id: wordset.id, words: slowWords });
  };

  const toggleSlowWords = () => {
    if (isSlowWords) {
      setWordset({ id: 1, words: eng200.split(" ") });
    } else {
      getSlowWords();
    }
    setIsSlowWords(!isSlowWords);
  };

  const toggleWordset = () => {
    if (wordset.id === 1) {
      setWordset({ id: 2, words: eng1k.split(" ") });
    } else {
      setWordset({ id: 1, words: eng200.split(" ") });
    }
  };

  return (
    <Body>
      <Button onClick={toggleSlowWords}>
        25 slowest {isSlowWords ? "on" : "off"}
      </Button>
      <Button onClick={toggleWordset}>
        1k words {wordset.id === 2 ? "on" : "off"}
      </Button>
      <Slate postWord={postWord} wordset={wordset} />
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

const Button = styled.button`
  background: #25262d;
  border: none;
  color: #c6c8d1;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #1d2028;
  }
`;
