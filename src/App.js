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
let state = NEW_BLOCK;
let keys = [];
let counter;
let countdown = 60;
let blockIndex;
let blockAnchor;
let blockAngle = 0;
let blockModel = [];
let rowSum = [];

function App() {
  const [blockSize, setBlockSize] = useState(20);
  // eslint-disable-next-line
  const [_blockModel, setBlockModel] = useState([]);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  // eslint-disable-next-line
  const [_paused, setPaused] = useState(false);

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

  const putBlock = (index) => {
    const pos = BLOCK_POS[blockIndex][blockAngle];
    for (let i = 0; i < pos.length; ++i)
      blockModel[blockAnchor[1] + pos[i][1]][blockAnchor[0] + pos[i][0]] = index;
  };

  const moveBlock = useCallback((diff) => {
    putBlock(-1);
    if (overlap(diff)) {
      putBlock(blockIndex);
      return false;
    }
    blockAnchor[0] += diff[0];
    blockAnchor[1] += diff[1];
    putBlock(blockIndex);
    setBlockModel(Array.from(blockModel));
    return true;
  }, []);

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
    setBlockModel(Array.from(blockModel));
    return true;
  }, []);

  const resizeHandler = useCallback(() => {
    measureSize();
  }, []);

  const keyHandler = (e) => {
    keys.push(e.code);
  };

  const timeHandler = useCallback(() => {
    switch (state) {
      case NEW_BLOCK:
        blockIndex = Math.floor(Math.random() * 7);
        blockAngle = 0;
        blockAnchor = [Math.floor(BLOCK_COLUMN / 2), 0];
        counter = countdown;
        state = overlap([0, 0]) ? GAME_OVER : PLAYING;
        putBlock(blockIndex);
        setBlockModel(Array.from(blockModel));
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
        setBlockModel(Array.from(blockModel));
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
          for (let i = rowSum.length; i < BLOCK_ROW; ++i) {
            rowSum.unshift(0);
            const m = new Array(BLOCK_COLUMN);
            for (let j = 0; j < BLOCK_COLUMN; ++j)
              m[j] = -1;
            blockModel.unshift(m);
          }
          setBlockModel(Array.from(blockModel));
          state = NEW_BLOCK;
        }
        break;
      case NEXT_LEVEL:
        setLevel((lv) => {
          if (lv >= 1)
            countdown = Math.ceil(countdown * 0.8);
          return lv + 1;
        });
        state = NEW_BLOCK;
        break;
      case GAME_OVER:
        break;
      // no default
    }
  }, [moveBlock, rotateBlock]);

  useEffect(() => {
    blockModel = new Array(BLOCK_ROW);
    rowSum = new Array(BLOCK_ROW);
    for (let i = 0; i < BLOCK_ROW; ++i) {
      blockModel[i] = new Array(BLOCK_COLUMN);
      for (let j = 0; j < BLOCK_COLUMN; ++j)
        blockModel[i][j] = -1;
      rowSum[i] = 0;
    }
    measureSize();
    setBlockModel(blockModel);
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('keydown', keyHandler);
    setInterval(timeHandler, 25);
  }, [resizeHandler, timeHandler]);

  return (
    <div className="App">
      <BlockView size={blockSize} model={blockModel} />
    </div>
  );
}

export default App;
