// npm
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const keys = ["Backspace", " ", ..."abcdefghijklmnopqrstuvwxyz".split("")];

// types
type NewPr = {
  lowercase: string;
  wpm: number;
  wordIndex?: number;
};

// props
type SlateProps = {
  getUserWords: (wordsetId: number) => void;
  userWords: any;
  postWord: (word: string, wpm: number, setId: number) => void;
  wordset: { id: number; words: string[] };
};

export const Slate = ({
  getUserWords,
  userWords,
  postWord,
  wordset,
}: SlateProps) => {
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
  const [newPrs, _setNewPrs] = useState<NewPr[]>([]);

  // ref
  const wordsetRef = useRef(wordset);
  const userWordsRef = useRef(userWords);

  const testStartedRef = useRef(testStarted);
  const startTimeRef = useRef(startTime);
  const wordStartTimeRef = useRef(wordStartTime);
  const wordsRef = useRef(words);
  const userInputRef = useRef(userInput);
  const currentWordIndexRef = useRef(currentWordIndex);
  const currentCharIndexRef = useRef(currentCharIndex);
  const wpmWordsRef = useRef(wpmWords);
  const newPrsRef = useRef(newPrs);

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
  const setNewPrs = (a: NewPr[]) => {
    newPrsRef.current = a;
    _setNewPrs(a);
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
    getUserWords(wordsetRef.current.id);
    setNewPrs([]);
  };

  const generateWords = () => {
    const tempWords: string[] = [];

    for (let i = 0; i < 50; i++) {
      tempWords.push(
        wordsetRef.current.words[
          Math.floor(Math.random() * wordsetRef.current.words.length)
        ],
      );
    }

    setWords(tempWords);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    const now = performance.now();
    e.preventDefault();
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
    console.log(performance.now() - now);
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
    const now = performance.now();
    setUserInput([...previousWords, currentWord, ""]);
    setCurrentWordIndex(currentWordIndexRef.current + 1);
    setCurrentCharIndex(0);
    processWpm();
    console.log(performance.now() - now);
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
    const targetWord = wordsRef.current[completedIndex];
    if (completedIndex < 0 || !targetWord) return;

    const completedWord = userInputRef.current[completedIndex];
    const isCompletedWordCorrect = completedWord === targetWord;
    const isCompletedWordCalculated =
      wpmWordsRef.current[completedIndex] !== undefined;

    if (isCompletedWordCalculated) {
      setWordStartTime(now);
      return;
    }

    if (wpmWordsRef.current.length === 0 && isCompletedWordCorrect) {
      setWpmWords([wpm]);
      setWordStartTime(now);
      handlePr(targetWord, wpm);
      return;
    }

    if (isCompletedWordCorrect) {
      const timeElapsed = (now - wordStartTimeRef.current) / 1000;
      const wpm = calcWpm(completedWord.length + 1, timeElapsed);
      setWpmWords([...wpmWordsRef.current, wpm]);
      postWord(targetWord, wpm, wordsetRef.current.id);
      handlePr(targetWord, wpm);
    } else {
      setWpmWords([...wpmWordsRef.current, 0]);
      postWord(targetWord, 0, wordsetRef.current.id);
      handlePr(targetWord, 0);
    }
    setWordStartTime(now);
  };

  const calcWpm = (numOfCharacters: number, timeElapsed: number) => {
    return Math.round(numOfCharacters / 5 / (timeElapsed / 60));
  };

  const handlePr = (targetWord: string, wpm: number) => {
    const newPrIndex = newPrsRef.current.findIndex(
      (pr) => pr.lowercase === targetWord,
    );
    if (newPrIndex !== -1) {
      if (newPrsRef.current[newPrIndex].wpm > wpm) return;
      newPrsRef.current.splice(newPrIndex, 1);
    }
    setNewPrs([
      ...newPrsRef.current,
      {
        lowercase: targetWord,
        wpm: wpm + 1,
        wordIndex: currentWordIndexRef.current - 1,
      },
    ]);
  };

  // watchers
  useEffect(() => {
    wordsetRef.current = wordset;
    userWordsRef.current = userWords;
  }, [wordset, userWords]);

  // lifecycle
  useEffect(() => {
    generateWords();
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  // markup
  const prMarkup = (wpm: number, word: string, wordIndex: number) => {
    if (wordIndex === 0) return;
    const markup = (
      <span style={{ fontSize: "12px", marginTop: "-4px" }}>🚀</span>
    );

    if (!wpm) return;

    const userWord = userWords?.find((w: any) => w.lowercase === word);
    const newPr = newPrs?.find((w: any) => w.lowercase === word);

    if (newPr) {
      if (newPr.wordIndex === wordIndex) {
        if (!userWord) return markup;
        if (wpm > userWord?.pr) return markup;
      }
    }

    if (wpm > userWord?.wpm && wpm > (newPr?.wpm || 0)) {
      return;
    }
  };

  return (
    <>
      {(wpmWordsRef.current.length > 0 &&
        wpmWordsRef.current.reduce((acc, curr) => acc + curr, 0) /
          wpmWordsRef.current.length) ||
        0}
      <StyledSlate>
        {words?.map((word, wordIndex) => (
          <WordBox key={"box" + wordIndex}>
            <WPMWord key={"wpm" + wordIndex} $wpm={wpmWords[wordIndex]}>
              {wpmWords[wordIndex] > 0 && wpmWords[wordIndex]}
              {prMarkup(wpmWords[wordIndex], word, wordIndex)}
              {wpmWords[wordIndex] >= 180 && (
                <span
                  style={{
                    fontSize: "12px",
                    marginTop: "-4px",
                  }}
                >
                  ⭐
                </span>
              )}
            </WPMWord>
            <Word key={wordIndex}>
              {word.split("")?.map((char, charIndex) => {
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
                    $wpm={
                      userWordsRef.current.find(
                        (word: any) => word.lowercase === words[wordIndex],
                      )?.pr
                    }
                    $new={
                      !userWordsRef.current.find(
                        (word: any) => word.lowercase === words[wordIndex],
                      )
                    }
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

  min-height: 300px;
  width: 80%;
  overflow: hidden;
  border-radius: 8px;
  padding: 1rem;

  background: linear-gradient(90deg, #25262d 0%, #26262d 60%);
  color: #c6c8d1;

  font-size: 24px;
  font-weight: 400;
  line-height: 1.4;
`;

const WordBox = React.memo(styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #777777;
  height: 50px;
`);

type WPMWordProps = {
  $wpm: number;
};

const WPMWord = styled.div<WPMWordProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  height: 20px;
  min-height: 20px;
  font-weight: 600;
  color: ${(props) => {
    if (props.$wpm !== 0 && props.$wpm < 60) {
      // brown
      return "#a17261";
    }
    if (props.$wpm < 80) {
      // red
      return "#d11715";
    }
    if (props.$wpm < 100) {
      // orange
      return "#ff520d";
    }
    if (props.$wpm < 120) {
      // yellow
      return "#C4CA20";
    }
    if (props.$wpm < 140) {
      // green
      return "#288933";
    }
    if (props.$wpm < 160) {
      // blue
      return "#31A9AD";
    }
    if (props.$wpm < 180) {
      // purple
      return "#D303C6";
    }
    return "#ffffff";
  }};

  ${(props) => {
    if (props.$wpm < 180) return;
    if (props.$wpm < 200) {
      // red
      return `background: linear-gradient(190deg, #e43235 40%, #7c191b 65%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 225) {
      // orange
      return `background: linear-gradient(190deg, #dc982c 20%, #ef4a18 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 250) {
      // yellow
      return `background: linear-gradient(190deg, #e7c920 20%, #e0d38a 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 300) {
      // green
      return `background: linear-gradient(190deg, #35ad26 20%, #34805c 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 400) {
      // sky
      return `background: linear-gradient(190deg, #2fa3c3 20%, #7c3488 85%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    `;
    }
    if (props.$wpm >= 400) {
      // pink
      return `background: linear-gradient(190deg, #ae5285 10%, #ea2858 70%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    `;
    }
  }}
`;

const Word = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: -8px;
`;

type LetterProps = {
  $correct: boolean;
  $wpm: number;
  $waiting: boolean;
  $new: boolean;
};

const Letter = React.memo(styled.span<LetterProps>`
  font-size: 24px;
  font-weight: 400;
  line-height: 1.4;
  color: ${(props) => {
    if (props.$new && props.$waiting) return "#88cccc";
    if (!props.$waiting)
      return props.$correct
        ? "#ffffff"
        : props.$waiting
          ? "#aaaaaa"
          : "#ff0000";
    if (props.$wpm !== 0 && props.$wpm < 60) {
      // brown
      return "#a17261";
    }
    if (props.$wpm < 80) {
      // red
      return "#d11715";
    }
    if (props.$wpm < 100) {
      // orange
      return "#ff520d";
    }
    if (props.$wpm < 120) {
      // yellow
      return "#C4CA20";
    }
    if (props.$wpm < 140) {
      // green
      return "#288933";
    }
    if (props.$wpm < 160) {
      // blue
      return "#31A9AD";
    }
    if (props.$wpm < 180) {
      // purple
      return "#D303C6";
    }
    return "#ffffff";
  }};

  ${(props) => {
    if (props.$wpm < 180 || !props.$waiting) return;
    if (props.$wpm < 200) {
      // red
      return `background: linear-gradient(190deg, #e43235 40%, #7c191b 65%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 225) {
      // orange
      return `background: linear-gradient(190deg, #dc982c 20%, #ef4a18 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 250) {
      // yellow
      return `background: linear-gradient(190deg, #e7c920 20%, #e0d38a 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 300) {
      // green
      return `background: linear-gradient(190deg, #35ad26 20%, #34805c 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 400) {
      // sky
      return `background: linear-gradient(190deg, #2fa3c3 20%, #7c3488 85%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    `;
    }
    if (props.$wpm >= 400) {
      // pink
      return `background: linear-gradient(190deg, #ae5285 10%, #ea2858 70%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    `;
    }
  }}
`);
/*  color: ${() => {

    if (props.$wpm < 180) return;
    if (props.$wpm < 200) {
      // red
      return `background: linear-gradient(190deg, #e43235 40%, #7c191b 65%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 225) {
      // orange
      return `background: linear-gradient(190deg, #dc982c 20%, #ef4a18 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 250) {
      // yellow
      return `background: linear-gradient(190deg, #e7c920 20%, #e0d38a 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 300) {
      // green
      return `background: linear-gradient(190deg, #35ad26 20%, #34805c 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
`;
    }
    if (props.$wpm < 400) {
      // sky
      return `background: linear-gradient(190deg, #2fa3c3 20%, #7c3488 85%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    `;
    }
    if (props.$wpm >= 400) {
      // pink
      return `background: linear-gradient(190deg, #ae5285 10%, #ea2858 70%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    `;
    }
  
    if (props.$new && props.$waiting) return "#88cccc";
    return props.$correct ? "#ffffff" : props.$waiting ? "#aaaaaa" : "#ff0000";
  }};
*/

const ExtraInput = styled.span`
  font-size: 24px;
  color: #ff0000;
`;
