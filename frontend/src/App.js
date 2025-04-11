
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const GRID_SIZE = 15;
const CELL_SIZE = 20;
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

const SPEED_LEVELS = {
  BASIC: 300,
  MODERATE: 200,
  ADVANCED: 150
};

function App() {
  // Game state
  const [grid, setGrid] = useState(createEmptyGrid());
  const [snake, setSnake] = useState([{ x: 7, y: 7 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(DIRECTIONS.RIGHT);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(SPEED_LEVELS.BASIC);
  const [score, setScore] = useState(0);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  
  // Create an empty grid
  function createEmptyGrid() {
    const grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push('empty');
      }
      grid.push(row);
    }
    return grid;
  }
  
  // Place food at a random position
  const placeFood = useCallback(() => {
    const availablePositions = [];
    
    // Find all empty cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x] === 'empty') {
          availablePositions.push({ x, y });
        }
      }
    }
    
    // If no available positions, do nothing
    if (availablePositions.length === 0) return;
    
    // Pick a random position
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const newFood = availablePositions[randomIndex];
    
    // Update food position
    setFood(newFood);
  }, [grid]);
  
  // Handle key press
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== DIRECTIONS.DOWN) {
            setDirection(DIRECTIONS.UP);
          }
          break;
        case 'ArrowDown':
          if (direction !== DIRECTIONS.UP) {
            setDirection(DIRECTIONS.DOWN);
          }
          break;
        case 'ArrowLeft':
          if (direction !== DIRECTIONS.RIGHT) {
            setDirection(DIRECTIONS.LEFT);
          }
          break;
        case 'ArrowRight':
          if (direction !== DIRECTIONS.LEFT) {
            setDirection(DIRECTIONS.RIGHT);
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameStarted, gameOver]);
  
  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const updateGame = () => {
      setSnake(prevSnake => {
        // Create a copy of the current snake
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };
        
        // Calculate new head position
        const newHead = {
          x: head.x + direction.x,
          y: head.y + direction.y
        };
        
        // Check if out of bounds
        if (
          newHead.x < 0 || 
          newHead.x >= GRID_SIZE || 
          newHead.y < 0 || 
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }
        
        // Check if hit itself
        for (let i = 1; i < newSnake.length; i++) {
          if (newSnake[i].x === newHead.x && newSnake[i].y === newHead.y) {
            setGameOver(true);
            return prevSnake;
          }
        }
        
        // Add new head to snake
        newSnake.unshift(newHead);
        
        // Check if food is eaten
        if (newHead.x === food.x && newHead.y === food.y) {
          // Increase score
          setScore(prevScore => prevScore + 1);
          setScoreAnimation(true);
          setTimeout(() => setScoreAnimation(false), 300);
          
          // Place new food
          setTimeout(() => placeFood(), 0);
        } else {
          // Remove tail if food not eaten
          newSnake.pop();
        }
        
        return newSnake;
      });
    };
    
    // Set up game loop
    const gameLoop = setInterval(updateGame, gameSpeed);
    return () => clearInterval(gameLoop);
  }, [direction, food, gameStarted, gameOver, gameSpeed, placeFood]);
  
  // Update grid when snake or food changes
  useEffect(() => {
    // Create a new empty grid
    const newGrid = createEmptyGrid();
    
    // Add snake to grid
    snake.forEach((segment, index) => {
      if (segment.y >= 0 && segment.y < GRID_SIZE && segment.x >= 0 && segment.x < GRID_SIZE) {
        newGrid[segment.y][segment.x] = index === 0 ? 'snake-head' : 'snake-body';
      }
    });
    
    // Add food to grid
    if (food && food.y >= 0 && food.y < GRID_SIZE && food.x >= 0 && food.x < GRID_SIZE) {
      newGrid[food.y][food.x] = 'food';
    }
    
    // Update grid
    setGrid(newGrid);
  }, [snake, food]);
  
  // Start a new game
  const startGame = (speed) => {
    setGrid(createEmptyGrid());
    setSnake([{ x: 7, y: 7 }]);
    setFood({ x: 5, y: 5 });
    setDirection(DIRECTIONS.RIGHT);
    setGameOver(false);
    setGameStarted(true);
    setGameSpeed(speed);
    setScore(0);
  };
  
  // Render game grid
  const renderGrid = () => {
    const cells = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        cells.push(
          <div
            key={`${x}-${y}`}
            className={`nokia-cell ${grid[y][x]}`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              left: x * CELL_SIZE,
              top: y * CELL_SIZE
            }}
          />
        );
      }
    }
    
    return cells;
  };
  
  // Render start screen
  const renderStartScreen = () => (
    <div className="nokia-screen start-screen">
      <div className="nokia-text">SNAKE</div>
      <div className="nokia-subtitle">SELECT DIFFICULTY</div>
      <button 
        className="nokia-button" 
        onClick={() => startGame(SPEED_LEVELS.BASIC)}
      >
        BASIC
      </button>
      <button 
        className="nokia-button" 
        onClick={() => startGame(SPEED_LEVELS.MODERATE)}
      >
        MODERATE
      </button>
      <button 
        className="nokia-button" 
        onClick={() => startGame(SPEED_LEVELS.ADVANCED)}
      >
        ADVANCED
      </button>
    </div>
  );
  
  // Render game over screen
  const renderGameOverScreen = () => (
    <div className="nokia-screen game-over">
      <div className="nokia-text">GAME OVER</div>
      <div className="nokia-score">SCORE: {score}</div>
      <button 
        className="nokia-button" 
        onClick={() => startGame(gameSpeed)}
      >
        PLAY AGAIN
      </button>
      <button 
        className="nokia-button" 
        onClick={() => setGameStarted(false)}
      >
        MAIN MENU
      </button>
    </div>
  );
  
  // Render game screen
  const renderGameScreen = () => (
    <div className="nokia-screen game-screen">
      <div className={`nokia-score-bar ${scoreAnimation ? 'score-animation' : ''}`}>SCORE: {score}</div>
      <div 
        className="nokia-grid"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE
        }}
      >
        {renderGrid()}
      </div>
    </div>
  );

  return (
    <div className="nokia-container">
      <div className="nokia-phone">
        <div className="nokia-header">NOKIA</div>
        {!gameStarted && renderStartScreen()}
        {gameStarted && !gameOver && renderGameScreen()}
        {gameStarted && gameOver && renderGameOverScreen()}
      </div>
    </div>
  );
}

export default App;
