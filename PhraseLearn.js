import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";

const modes = ["Tap Reveal", "Multiple Choice"];
const difficulties = {
  Easy: 0.2,
  Medium: 0.45,
  Hard: 1.0,
};
const NUM_CHOICES = 4;

function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export default function TextMemoryTrainer() {
  const [text, setText] = useState("");
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("Tap Reveal");
  const [revealedChunks, setRevealedChunks] = useState(0);
  const [inputVisible, setInputVisible] = useState(true);

  const [difficulty, setDifficulty] = useState(null);
  const [blankIndices, setBlankIndices] = useState([]);
  const [blankProgress, setBlankProgress] = useState(0);
  const [correctGuesses, setCorrectGuesses] = useState([]);

  const stripPunctuation = (word) => word.replace(/[.,!?;:()"']/g, "");

  const updateText = useMemo(
    () =>
      debounce((val) => {
        setText(val);
        setRevealedChunks(0);
        setBlankIndices([]);
        setBlankProgress(0);
        setCorrectGuesses([]);
      }, 1500),
    []
  );

  useEffect(() => {
    updateText(input);
  }, [input, updateText]);

  const splitIntoChunks = (inputText) => {
    return inputText
      .split(/(?<=[.?!])\s+/)
      .flatMap((sentence) => {
        if (sentence.includes(",")) return [sentence.trim()];
        const words = sentence.trim().split(" ");
        if (words.length > 8) {
          const mid = Math.floor(words.length / 2);
          return [
            words.slice(0, mid).join(" "),
            words.slice(mid).join(" "),
          ];
        }
        return [sentence.trim()];
      });
  };

  const chunks = useMemo(() => splitIntoChunks(text), [text]);
  const words = useMemo(() => text.split(/\s+/), [text]);
  const normalizedWords = useMemo(
    () => words.map((w) => stripPunctuation(w.toLowerCase())),
    [words]
  );

  useEffect(() => {
    if (mode === "Multiple Choice" && difficulty && words.length > 0) {
      const total = words.length;
      const numToBlank = Math.round(total * difficulties[difficulty]);
      const indices = Array.from({ length: total }, (_, i) => i);
      const selected = shuffleArray(indices).slice(0, numToBlank);
      setBlankIndices(selected.sort((a, b) => a - b));
      setBlankProgress(0);
      setCorrectGuesses([]);
    }
  }, [mode, difficulty, words.length]);

  const currentBlankIndex = blankIndices[blankProgress];
  const currentWord = stripPunctuation(words[currentBlankIndex]?.toLowerCase() || "");

  const shuffledOptions = useMemo(() => {
    if (currentWord === "") return [];
    const allWords = Array.from(new Set(normalizedWords));
    const others = allWords
      .filter((w) => w !== currentWord)
      .sort(() => 0.5 - Math.random())
      .slice(0, NUM_CHOICES - 1);
    return [...others, currentWord].sort(() => 0.5 - Math.random());
  }, [currentWord, normalizedWords]);

  const handleRevealNextChunk = () => {
    if (revealedChunks + 1 >= chunks.length) {
      resetGame();
    } else {
      setRevealedChunks(revealedChunks + 1);
    }
  };

  const handleGuessChoice = (guessWord) => {
    if (
      stripPunctuation(words[currentBlankIndex]?.toLowerCase()) === guessWord
    ) {
      const nextProgress = blankProgress + 1;
      if (nextProgress >= blankIndices.length) {
        resetGame();
      } else {
        setCorrectGuesses([...correctGuesses, guessWord]);
        setBlankProgress(nextProgress);
      }
    }
  };

  const resetGame = () => {
    setMode("Tap Reveal");
    setInputVisible(true);
    setText(input);
    setRevealedChunks(0);
    setCorrectGuesses([]);
    setBlankProgress(0);
    setBlankIndices([]);
    setDifficulty(null);
  };

  const hardResetGame = () => {
    setMode("Tap Reveal");
    setInputVisible(true);
    setInput("");
    setText("");
    setRevealedChunks(0);
    setCorrectGuesses([]);
    setBlankProgress(0);
    setBlankIndices([]);
    setDifficulty(null);
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Text Memory Trainer</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={resetGame}>
            Restart
          </Button>
          <Button variant="outline" onClick={hardResetGame}>
            Reset
          </Button>
        </div>
      </div>

      {inputVisible && (
        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste Bible verse or poem here"
          className="w-full p-2 border rounded"
        />
      )}

      <div className="flex gap-2 flex-wrap">
        {modes.map((m) => (
          <Button
            key={m}
            variant={mode === m ? "default" : "outline"}
            onClick={() => {
              setMode(m);
              setRevealedChunks(0);
              setInputVisible(false);
              setCorrectGuesses([]);
              setBlankProgress(0);
              setBlankIndices([]);
              setDifficulty(null);
              setText(input);
            }}
          >
            {m}
          </Button>
        ))}
      </div>

      {mode === "Multiple Choice" && !difficulty && (
        <div className="flex gap-2 flex-wrap">
          {Object.keys(difficulties).map((level) => (
            <Button key={level} onClick={() => setDifficulty(level)}>
              {level}
            </Button>
          ))}
        </div>
      )}

      <div className="text-lg p-4 bg-gray-100 rounded min-h-[100px] whitespace-pre-wrap leading-snug">
        {mode === "Tap Reveal" && chunks.slice(0, revealedChunks).join(" ")}
        {mode === "Multiple Choice" &&
          words.map((word, index) => {
            if (!difficulty) return null;
            const isBlank = blankIndices.includes(index);
            return (
              <span key={index} className="inline-block mr-2 mb-1">
                {isBlank && blankIndices[blankProgress] === index
                  ? "____"
                  : isBlank && blankIndices[blankProgress] > index
                  ? word
                  : !isBlank
                  ? word
                  : "____"}
              </span>
            );
          })}
      </div>

      {mode === "Tap Reveal" && text && (
        <Button onClick={handleRevealNextChunk}>Reveal Next</Button>
      )}

      {mode === "Multiple Choice" &&
        text &&
        difficulty &&
        blankProgress < blankIndices.length && (
          <div className="space-y-2">
            <p>Choose the missing word:</p>
            <div className="flex flex-wrap gap-2">
              {shuffledOptions.map((choice, i) => (
                <Button key={i} onClick={() => handleGuessChoice(choice)}>
                  {choice}
                </Button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}