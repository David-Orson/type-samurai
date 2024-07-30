// npm
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

// data
import { eng200 } from "../wordsets";

const keys = ["Backspace", " ", ..."abcdefghijklmnopqrstuvwxyz".split("")];

export const Slate = () => {
  // state
  const [testStarted, _setTestStarted] = useState(false);
  const [startTime, _setStartTime] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [userInput, _setUserInput] = useState([""]);
  const [currentWordIndex, _setCurrentWordIndex] = useState(0);
  const [currentCharIndex, _setCurrentCharIndex] = useState(0);
  const [wpm, setWpm] = useState(0);

  // ref
  const testStartedRef = useRef(testStarted);
  const startTimeRef = useRef(startTime);
  const userInputRef = useRef(userInput);
  const currentWordIndexRef = useRef(currentWordIndex);
  const currentCharIndexRef = useRef(currentCharIndex);

  const setTestStarted = (b: boolean) => {
    testStartedRef.current = b;
    _setTestStarted(b);
  };
  const setStartTime = (n: number) => {
    startTimeRef.current = n;
    _setStartTime(n);
  };
  const setUserInput = (a: string[]) => {
    userInputRef.current = a;
    _setUserInput(a);
  };
  const setCurrentWordIndex = (n: number) => {
    currentWordIndexRef.current = n;
    _setCurrentWordIndex(n);
  };
  const setCurrentCharIndex = (n: number) => {
    currentCharIndexRef.current = n;
    _setCurrentCharIndex(n);
  };

  // methods
  const resetTest = () => {
    setUserInput([""]);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setWpm(0);
    setTestStarted(false);
    generateWords();
  };

  const generateWords = () => {
    const tempWords: string[] = [];
    const wordset = eng200.split(" ");

    for (let i = 0; i < 100; i++) {
      tempWords.push(wordset[Math.floor(Math.random() * wordset.length)]);
    }

    setWords(tempWords);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Alt") return resetTest();
    if (!keys.includes(e.key)) return;

    if (!testStartedRef.current) {
      setTestStarted(true);
      setStartTime(performance.now());
    }

    const currentWord = userInputRef.current[currentWordIndexRef.current];
    let previousWords = userInputRef.current.slice(0, -1);

    if (e.key === "Backspace") {
      handleBackspace(currentWord, previousWords);
    } else if (e.key === " ") {
      handleSpace(previousWords, currentWord);
    } else {
      handleCharacterInput(e.key, previousWords, currentWord);
    }
  };

  const handleBackspace = (currentWord: string, previousWords: string[]) => {
    if (currentWord.length === 0) {
      if (previousWords.length === 0) return;
      setUserInput(previousWords);
      setCurrentWordIndex(currentWordIndexRef.current - 1);
      setCurrentCharIndex(previousWords[previousWords.length - 1].length);
      return;
    }
    setUserInput([...previousWords, currentWord.slice(0, -1)]);
    setCurrentCharIndex(currentCharIndexRef.current - 1);
  };

  const handleSpace = (previousWords: string[], currentWord: string) => {
    setUserInput([...previousWords, currentWord, ""]);
    setCurrentWordIndex(currentWordIndexRef.current + 1);
    setCurrentCharIndex(0);
    calcWpm();
  };

  const handleCharacterInput = (
    char: string,
    previousWords: string[],
    currentWord: string,
  ) => {
    setUserInput([...previousWords, currentWord + char]);
    setCurrentCharIndex(currentCharIndexRef.current + 1);
  };

  const calcWpm = () => {
    const timeElapsed = (performance.now() - startTimeRef.current) / 1000;
    const characters = userInputRef.current.join(" ").length;
    const wpm = characters / 5 / (timeElapsed / 60);
    setWpm(Math.round(wpm));
  };

  // lifecycle
  useEffect(() => {
    generateWords();
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <>
      <div>WPM: {wpm}</div>
      <StyledSlate>
        {words.map((word, wordIndex) => (
          <Word key={wordIndex}>
            {word.split("").map((char, charIndex) => {
              const isWaiting =
                wordIndex > currentWordIndex ||
                (wordIndex === currentWordIndex &&
                  charIndex >= currentCharIndex);

              const isCorrect =
                !isWaiting && char === userInput[wordIndex][charIndex];

              return (
                <Letter
                  key={charIndex}
                  $correct={isCorrect}
                  $waiting={isWaiting}
                >
                  {char}
                </Letter>
              );
            })}

            {userInput[wordIndex] &&
              userInput[wordIndex].length > word.length && (
                <ExtraInput>
                  {userInput[wordIndex].slice(word.length)}
                </ExtraInput>
              )}
            <span style={{ minWidth: "13px" }}></span>
          </Word>
        ))}
      </StyledSlate>
    </>
  );
};

const StyledSlate = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;

  height: 300px;
  width: 80%;
  overflow: hidden;
  border-radius: 8px;
  padding: 1rem;

  background: linear-gradient(90deg, #25262d 0%, #14141a 60%);
  color: #c6c8d1;

  font-size: 24px;
  font-weight: 400;
  line-height: 1.4;
`;

const Word = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

type LetterProps = {
  $correct: boolean;
  $waiting: boolean;
};

const Letter = styled.span<LetterProps>`
  font-size: 24px;
  font-weight: 400;
  line-height: 1.4;

  color: ${(props) =>
    props.$correct ? "#00ff00" : props.$waiting ? "#aaaaaa" : "#ff0000"};
`;

const ExtraInput = styled.span`
  color: #ff0000;
`;
