import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";

// components
import { Slate } from "./components/slate";

// data
import { eng200 } from "./wordsets";
import { eng1k } from "./wordsets";
import { eng5k } from "./wordsets";
import { eng10k } from "./wordsets";

// types

export const App = () => {
  // state
  const [wordset, _setWordset] = useState({ id: 1, words: eng200.split(" ") });
  const [isSlowWords, setIsSlowWords] = useState(false);
  const [userWords, setUserWords] = useState<any[]>([]);
  const [badges, setBadges] = useState<number[]>([]);
  const [averagePr, setAveragePr] = useState(0);
  const [averageRecentAverage, setAverageRecentAverage] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  // refs
  const wordsetRef = React.useRef(wordset);
  const setWordset = (data: any) => {
    wordsetRef.current = data;
    _setWordset(data);
  };

  // methods
  const postWord = (word: string, wpm: number, setId: number) => {
    axios.post("http://localhost:8080/word", { word, wpm, wordset: setId });
  };

  const getSlowWords = async () => {
    const res = await axios.get(
      "http://localhost:8080/words/slow/" + wordset.id,
    );
    const slowWords = res.data.map((word: any) => word.lowercase);
    setWordset({ id: wordset.id, words: slowWords });
  };

  const getUserWords = async (wordsetId: number) => {
    const res = await axios.get("http://localhost:8080/userwords/" + wordsetId);
    setUserWords(res.data);
    processUserWordsToBadges(res.data);
  };

  const processUserWordsToBadges = (userWords: any) => {
    const badges = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let total = 0;
    let recentTotal = 0;
    let i = 0;
    const attempts: number[] = [];

    userWords?.forEach((word: any) => {
      i++;

      const attemptsJSON = JSON.parse(word.recentAttempts);
      attempts.push(...attemptsJSON);
      total += word.pr;
      recentTotal += word.recentAverage;
      if (word.pr < 60) {
        badges[0]++;
      } else if (word.pr < 80) {
        badges[1]++;
      } else if (word.pr < 100) {
        badges[2]++;
      } else if (word.pr < 120) {
        badges[3]++;
      } else if (word.pr < 140) {
        badges[4]++;
      } else if (word.pr < 160) {
        badges[5]++;
      } else if (word.pr < 180) {
        badges[6]++;
      } else if (word.pr < 200) {
        badges[7]++;
      } else if (word.pr < 225) {
        badges[8]++;
      } else if (word.pr < 250) {
        badges[9]++;
      } else if (word.pr < 300) {
        badges[10]++;
      } else if (word.pr < 400) {
        badges[11]++;
      } else {
        badges[12]++;
      }
    });

    let successAttempts = 0;
    attempts.forEach((attempt) => {
      if (attempt > 0) {
        successAttempts++;
      }
    });

    setAccuracy(successAttempts / attempts.length || 0);
    setAveragePr(total / i);
    setAverageRecentAverage(recentTotal / i);
    setBadges(badges);
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
    setIsSlowWords(false);
    if (wordset.id === 1) {
      setWordset({ id: 2, words: eng1k.split(" ") });
    } else if (wordset.id === 2) {
      setWordset({ id: 3, words: eng5k.toLowerCase().split(" ") });
    } else if (wordset.id === 3) {
      setWordset({ id: 4, words: eng10k.toLowerCase().split(" ") });
    } else {
      setWordset({ id: 1, words: eng200.split(" ") });
    }
  };

  // lifecycle
  useEffect(() => {
    getUserWords(wordset.id);
  }, [wordset.id]);

  return (
    <Body>
      <div>average of PRs: {Math.round(averagePr * 100) / 100}</div>
      <div>average: {Math.round(averageRecentAverage * 100) / 100}</div>
      <div>accuracy: {Math.round(accuracy * 10000) / 100}%</div>
      <Flex>
        <Button onClick={toggleSlowWords}>
          25 slowest {isSlowWords ? "on" : "off"}
        </Button>
        <Button onClick={toggleWordset}>
          {wordset.id === 1
            ? "english200"
            : wordset.id === 2
              ? "english1k"
              : wordset.id === 3
                ? "english5k"
                : "english10k"}
        </Button>
      </Flex>
      <Flex>
        <span style={{ color: "#a17261" }}>Aa {badges[0]}</span>
        <span style={{ color: "#d11715" }}>Aa {badges[1]}</span>
        <span style={{ color: "#ff520d" }}>Aa {badges[2]}</span>
        <span style={{ color: "#C4CA20" }}>Aa {badges[3]}</span>
        <span style={{ color: "#288933" }}>Aa {badges[4]}</span>
        <span style={{ color: "#31A9AD" }}>Aa {badges[5]}</span>
        <span style={{ color: "#D303C6" }}>Aa {badges[6]}</span>

        <Clip bg={"linear-gradient(190deg, #e43235 40%, #7c191b 65%)"}>
          ⭐ {badges[7]}
        </Clip>
        <Clip bg={"linear-gradient(190deg, #dc982c 20%, #ef4a18 50%)"}>
          ⭐ {badges[8]}
        </Clip>
        <Clip bg={"linear-gradient(190deg, #e7c920 20%, #e0d38a 50%)"}>
          ⭐ {badges[9]}
        </Clip>
        <Clip bg={"linear-gradient(190deg, #35ad26 20%, #34805c 50%)"}>
          ⭐ {badges[10]}
        </Clip>
        <Clip bg={"linear-gradient(190deg, #2fa3c3 20%, #7c3488 85%)"}>
          ⭐ {badges[11]}
        </Clip>
        <Clip bg={"linear-gradient(190deg, #ae5285 10%, #ea2858 70%)"}>
          ⭐ {badges[12]}
        </Clip>
      </Flex>
      <Slate
        getUserWords={getUserWords}
        userWords={userWords}
        postWord={postWord}
        wordset={wordset}
      />
      <div>
        {userWords?.length || 0} / {wordset.words.length}
      </div>
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

const Flex = styled.div`
  display: flex;
  justify-content: space-between;
  min-width: 80%;
  gap: 1rem;
  padding: 0px 20px;
`;

type ClipProps = {
  bg: string;
};

const Clip = styled.span<ClipProps>`
  background: ${(props: ClipProps) => props.bg};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;
