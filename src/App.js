import { useCallback, useEffect, useState } from 'react';
import './App.css';
import BlockView from './BlockView';

const BLOCK_COLUMN = 10;
const BLOCK_ROW = 20;
const NEW_BLOCK = 0;
const PLAYING = 1;
const DELETING_ROWS = 2;
const DELETED_ROWS = 3;
const NEXT_LEVEL = 4;
const GAME_OVER = 5;
const BLOCK_POS = [
  [[[0, 0], [-1, 0], [1, 0], [2, 0]], [[0, 0], [0, -1], [0, 1], [0, 2]]],
  [[[0, 0], [-1, 0], [1, 0], [1, 1]], [[0, 0], [0, -1], [1, -1], [0, 1]], [[0, 0], [-1, -1], [-1, 0], [1, 0]], [[0, 0], [0, -1], [0, 1], [-1, 1]]],
  [[[0, 0], [-1, 0], [1, 0], [-1, 1]], [[0, 0], [0, -1], [0, 1], [1, 1]], [[0, 0], [1, -1], [-1, 0], [1, 0]], [[0, 0], [-1, -1], [0, -1], [0, 1]]],
  [[[0, 0], [-1, 0], [1, 0], [0, 1]], [[0, 0], [0, -1], [1, 0], [0, 1]], [[0, 0], [0, -1], [-1, 0], [1, 0]], [[0, 0], [0, -1], [-1, 0], [0, 1]]],
  [[[0, 0], [-1, 0], [0, 1], [1, 1]], [[0, 0], [0, -1], [-1, 0], [-1, 1]]],
  [[[0, 0], [1, 0], [-1, 1], [0, 1]], [[0, 0], [0, -1], [1, 0], [1, 1]]],
  [[[0, 0], [1, 0], [0, 1], [1, 1]]]
];
let paused = false;
let level = 1;
let score = 0;
let state = NEW_BLOCK;
let keys = [];
let counter;
let countdown = 60;
let blockIndex;
let blockAnchor;
let blockAngle = 0;
let blockModel = [];
let rowSum = [];
let nextBlockIndex;
let nextBlockModel = [];

function App() {
  const [blockSize, setBlockSize] = useState(20);
  // eslint-disable-next-line
  const [_blockModel, setBlockModel] = useState([]);
  // eslint-disable-next-line
  const [_level, setLevel] = useState(level);
  // eslint-disable-next-line
  const [_score, setScore] = useState(score);
  // eslint-disable-next-line
  const [_nextblockModel, setNextBlockModel] = useState([]);
  // eslint-disable-next-line
  const [_paused, setPaused] = useState(paused);

  const measureSize = () => {
    const w = Math.floor(window.innerWidth / BLOCK_COLUMN);
    const h = Math.floor(window.innerHeight / BLOCK_ROW);
    setBlockSize(Math.min(w, h));
  };

  const overlap = (diff) => {
    const pos = BLOCK_POS[blockIndex][blockAngle];
    for (let i = 0; i < pos.length; ++i) {
      const x = blockAnchor[0] + pos[i][0] + diff[0];
      const y = blockAnchor[1] + pos[i][1] + diff[1];
      if (x < 0 || x >= BLOCK_COLUMN)
        return true;
      if (y < 0 || y >= BLOCK_ROW)
        return true;
      if (blockModel[y][x] !== -1)
        return true;
    }
    return false;
  };

  const updateModel = (model, anchor, index, angle, value) => {
    const pos = BLOCK_POS[index][angle];
    for (let i = 0; i < pos.length; ++i)
      model[anchor[1] + pos[i][1]][anchor[0] + pos[i][0]] = value;
  };

  const putBlock = useCallback((value) => {
    updateModel(blockModel, blockAnchor, blockIndex, blockAngle, value);
  }, []);

  const moveBlock = useCallback((diff) => {
    putBlock(-1);
    if (overlap(diff)) {
      putBlock(blockIndex);
      return false;
    }
    blockAnchor[0] += diff[0];
    blockAnchor[1] += diff[1];
    putBlock(blockIndex);
    setBlockModel([blockModel]);
    return true;
  }, [putBlock]);

  const rotateBlock = useCallback((diff) => {
    const poses = BLOCK_POS[blockIndex];
    if (poses.length === 1)
      return false;
    putBlock(-1);
    blockAngle = (blockAngle + poses.length + diff) % poses.length;
    if (overlap([0, 0])) {
      blockAngle = (blockAngle + poses.length - diff) % poses.length;
      putBlock(blockIndex);
      return false;
    }
    putBlock(blockIndex);
    setBlockModel([blockModel]);
    return true;
  }, [putBlock]);

  const resizeHandler = useCallback(() => {
    measureSize();
  }, []);

  const keyHandler = (e) => {
    keys.push(e.code);
  };

  const timeHandler = useCallback(() => {
    switch (state) {
      case NEW_BLOCK:
        blockIndex = nextBlockIndex !== undefined ? nextBlockIndex : Math.floor(Math.random() * BLOCK_POS.length);
        blockAngle = 0;
        blockAnchor = [Math.floor(BLOCK_COLUMN / 2), 0];
        counter = countdown;
        state = overlap([0, 0]) ? GAME_OVER : PLAYING;
        putBlock(blockIndex);
        setBlockModel([blockModel]);

        if (nextBlockIndex !== undefined)
          updateModel(nextBlockModel, [1, 1], nextBlockIndex, 0, -1);
        nextBlockIndex = Math.floor(Math.random() * BLOCK_POS.length);
        updateModel(nextBlockModel, [1, 1], nextBlockIndex, 0, nextBlockIndex);
        setNextBlockModel([nextBlockModel]);
        break;
      case PLAYING:
        if (keys.length > 0) {
          const key = keys.shift();
          if (key === 'KeyP') {
            paused = !paused;
            setPaused(paused);
          } else if (!paused) {
            if (key === 'ArrowLeft')
              moveBlock([-1, 0]);
            else if (key === 'ArrowRight')
              moveBlock([1, 0]);
            else if (key === 'ArrowDown')
              moveBlock([0, 1]);
            else if (key === 'Enter')
              rotateBlock(1);
          }
        }
        if (!paused && --counter === 0) {
          counter = countdown;
          if (!moveBlock([0, 1])) {
            state = NEW_BLOCK;
            const pos = BLOCK_POS[blockIndex][blockAngle];
            for (let i = 0; i < pos.length; ++i)
              if (++rowSum[blockAnchor[1] + pos[i][1]] === BLOCK_COLUMN)
                state = DELETING_ROWS;
          }
        }
        break;
      case DELETING_ROWS:
        for (let i = 0; i < BLOCK_ROW; ++i) {
          if (rowSum[i] === BLOCK_COLUMN) {
            for (let j = 0; j < BLOCK_COLUMN; ++j)
              blockModel[i][j] = -1;
          }
        }
        setBlockModel([blockModel]);
        counter = 20;
        state = DELETED_ROWS;
        break;
      case DELETED_ROWS:
        if (!paused && --counter === 0) {
          let i = 0;
          while (i < rowSum.length) {
            if (rowSum[i] === BLOCK_COLUMN) {
              rowSum.splice(i, 1);
              blockModel.splice(i, 1);
            }
            else
              ++i;
          }
          score += (BLOCK_ROW - rowSum.length) * 100;
          setScore(score);
          for (let i = rowSum.length; i < BLOCK_ROW; ++i) {
            rowSum.unshift(0);
            const m = new Array(BLOCK_COLUMN);
            for (let j = 0; j < BLOCK_COLUMN; ++j)
              m[j] = -1;
            blockModel.unshift(m);
          }
          setBlockModel([blockModel]);
          state = score >= level * 500 ? NEXT_LEVEL : NEW_BLOCK;
        }
        break;
      case NEXT_LEVEL:
        countdown = Math.ceil(countdown * 0.8);
        setLevel(++level);
        state = NEW_BLOCK;
        break;
      case GAME_OVER:
        break;
      // no default
    }
  }, [putBlock, moveBlock, rotateBlock]);

  useEffect(() => {
    blockModel = new Array(BLOCK_ROW);
    rowSum = new Array(BLOCK_ROW);
    for (let i = 0; i < blockModel.length; ++i) {
      blockModel[i] = new Array(BLOCK_COLUMN);
      for (let j = 0; j < blockModel[i].length; ++j)
        blockModel[i][j] = -1;
      rowSum[i] = 0;
    }
    nextBlockModel = new Array(4);
    for (let i = 0; i < nextBlockModel.length; ++i) {
      nextBlockModel[i] = new Array(4);
      for (let j = 0; j < nextBlockModel[i].length; ++j)
        nextBlockModel[i][j] = -1;
    }
    measureSize();
    setBlockModel(blockModel);
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('keydown', keyHandler);
    setInterval(timeHandler, 25);
  }, [resizeHandler, timeHandler]);

  return (
    <>
      <div className="App">
        <BlockView size={blockSize} model={blockModel} />
      </div>
      <div className="info">
        <div className="level">Level {level}</div>
        <div className="score">Score {score}</div>
        <BlockView size={blockSize} model={nextBlockModel} />
      </div>
    </>
  );
}

export default App;
