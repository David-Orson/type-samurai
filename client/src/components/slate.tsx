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
  const [wordStartTime, _setWordStartTime] = useState(0);
  const [words, _setWords] = useState<string[]>([]);
  const [userInput, _setUserInput] = useState([""]);
  const [currentWordIndex, _setCurrentWordIndex] = useState(0);
  const [currentCharIndex, _setCurrentCharIndex] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [wpmWords, _setWpmWords] = useState<number[]>([]);

  // ref
  const testStartedRef = useRef(testStarted);
  const startTimeRef = useRef(startTime);
  const wordStartTimeRef = useRef(wordStartTime);
  const wordsRef = useRef(words);
  const userInputRef = useRef(userInput);
  const currentWordIndexRef = useRef(currentWordIndex);
  const currentCharIndexRef = useRef(currentCharIndex);
  const wpmWordsRef = useRef(wpmWords);

  const setTestStarted = (b: boolean) => {
    testStartedRef.current = b;
    _setTestStarted(b);
  };
  const setStartTime = (n: number) => {
    startTimeRef.current = n;
    _setStartTime(n);
  };
  const setWordStartTime = (n: number) => {
    wordStartTimeRef.current = n;
    _setWordStartTime(n);
  };
  const setWords = (a: string[]) => {
    wordsRef.current = a;
    _setWords(a);
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
  const setWpmWords = (a: number[]) => {
    wpmWordsRef.current = a;
    _setWpmWords(a);
  };

  // methods
  const resetTest = () => {
    setUserInput([""]);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setWpm(0);
    setTestStarted(false);
    setWpmWords([]);
    setWordStartTime(0);
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
    if (e.key === "Control") return resetTest();
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
    processWpm();
  };

  const handleCharacterInput = (
    char: string,
    previousWords: string[],
    currentWord: string,
  ) => {
    setUserInput([...previousWords, currentWord + char]);
    setCurrentCharIndex(currentCharIndexRef.current + 1);
  };

  const processWpm = () => {
    const now = performance.now();
    const timeElapsed = (now - startTimeRef.current) / 1000;
    const validWords = userInputRef.current.filter((word, index) => {
      return word === wordsRef.current[index];
    });
    const characters = validWords.join(" ").length + 1;
    const wpm = calcWpm(characters, timeElapsed);
    if (characters === 1) {
      setWpm(0);
    } else {
      setWpm(wpm);
    }

    const completedIndex = userInputRef.current.length - 2;
    if (completedIndex < 0 || !wordsRef.current[completedIndex]) return;

    const completedWord = userInputRef.current[completedIndex];
    const isCompletedWordCorrect =
      completedWord === wordsRef.current[completedIndex];
    const isCompletedWordCalculated =
      wpmWordsRef.current[completedIndex] !== undefined;

    if (isCompletedWordCalculated) {
      setWordStartTime(now);
      return;
    }

    if (wpmWordsRef.current.length === 0 && isCompletedWordCorrect) {
      setWpmWords([wpm]);
      setWordStartTime(now);
      return;
    }

    if (isCompletedWordCorrect) {
      const timeElapsed = (now - wordStartTimeRef.current) / 1000;
      const wpm = calcWpm(completedWord.length + 1, timeElapsed);
      setWpmWords([...wpmWordsRef.current, wpm]);
    } else {
      setWpmWords([...wpmWordsRef.current, 0]);
    }
    setWordStartTime(now);
  };

  const calcWpm = (numOfCharacters: number, timeElapsed: number) => {
    return Math.round(numOfCharacters / 5 / (timeElapsed / 60));
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
          <WordBox key={"box" + wordIndex}>
            <WPMWord key={"wpm" + wordIndex}>
              {wpmWords[wordIndex] > 0 && wpmWords[wordIndex]}
            </WPMWord>
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
          </WordBox>
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

const WordBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #777777;
  height: 40px;
`;

const WPMWord = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  color: #777777;
  height: 20px;
  min-height: 20px;
`;

const Word = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: -8px;
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
  font-size: 24px;
  color: #ff0000;
`;
