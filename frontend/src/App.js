
import React, { useState, useEffect } from 'react';
import './App.css';

// Game constants
const GRID_SIZE = 15;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 7, y: 7 },
  { x: 6, y: 7 }
];
const INITIAL_FOOD = { x: 10, y: 10 };
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};
const SPEEDS = {
  EASY: 200,
  MEDIUM: 150,
  HARD: 100
};

function App() {
  // Game state
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(DIRECTIONS.RIGHT);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(SPEEDS.EASY);
  const [score, setScore] = useState(0);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const touchStartRef = React.useRef({ x: 0, y: 0 });
  
  // Generate random food position
  const generateFood = () => {
    let newFood;
    let foodOnSnake = true;
    
    while (foodOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      
      foodOnSnake = snake.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );
    }
    
    setFood(newFood);
  };
  
  // Move snake
  const moveSnake = () => {
    const newSnake = [...snake];
    const head = { ...newSnake[0] };
    
    // Calculate new head position
    head.x += direction.x;
    head.y += direction.y;
    
    // Check for collisions
    if (checkCollision(head)) {
      endGame();
      return;
    }
    
    // Add new head
    newSnake.unshift(head);
    
    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
      // Increase score
      setScore(prevScore => prevScore + 1);
      
      // Animate score
      setScoreAnimation(true);
      setTimeout(() => setScoreAnimation(false), 300);
      
      // Generate new food
      generateFood();
    } else {
      // Remove tail
      newSnake.pop();
    }
    
    // Update snake
    setSnake(newSnake);
  };
  
  // Check for collisions with walls or self
  const checkCollision = (head) => {
    // Check wall collision
    if (
      head.x < 0 || 
      head.x >= GRID_SIZE || 
      head.y < 0 || 
      head.y >= GRID_SIZE
    ) {
      return true;
    }
    
    // Check self collision (excluding the tail which will be removed)
    for (let i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        return true;
      }
    }
    
    return false;
  };
  
  // End the game
  const endGame = () => {
    setGameActive(false);
    setGameOver(true);
  };
  
  // Start a new game
  const startGame = (selectedSpeed) => {
    setSnake(INITIAL_SNAKE);
    setDirection(DIRECTIONS.RIGHT);
    setSpeed(selectedSpeed);
    setScore(0);
    setGameOver(false);
    setGameActive(true);
    generateFood();
  };
  
  // Game loop
  useEffect(() => {
    if (!gameActive) return;
    
    const gameLoop = setInterval(moveSnake, speed);
    
    return () => clearInterval(gameLoop);
  }, [gameActive, snake, direction, food, speed]);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameActive) return;
      
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
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameActive, direction]);
  
  // Render game grid cells
  const renderGrid = () => {
    const cells = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Determine cell type
        let cellType = 'cell';
        
        // Check if cell is part of snake
        const isHead = snake[0].x === x && snake[0].y === y;
        const isBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;
        
        if (isHead) {
          cellType = 'cell snake-head';
        } else if (isBody) {
          cellType = 'cell snake-body';
        } else if (isFood) {
          cellType = 'cell food';
        }
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellType}
            style={{
              left: x * CELL_SIZE + 'px',
              top: y * CELL_SIZE + 'px',
              width: CELL_SIZE + 'px',
              height: CELL_SIZE + 'px'
            }}
          />
        );
      }
    }
    
    return cells;
  };
  
  // Render game
  return (
    <div className="game-container">
      <div className="nokia-phone">
        <div className="nokia-screen">
          {!gameActive && !gameOver && (
            <div className="start-screen">
              <h1>SNAKE</h1>
              <p>Select Difficulty</p>
              <button onClick={() => startGame(SPEEDS.EASY)}>Easy</button>
              <button onClick={() => startGame(SPEEDS.MEDIUM)}>Medium</button>
              <button onClick={() => startGame(SPEEDS.HARD)}>Hard</button>
            </div>
          )}
          
          {gameActive && (
            <div className="game-screen">
              <div className="score">Score: {score}</div>
              <div 
                className="game-board"
                style={{
                  width: GRID_SIZE * CELL_SIZE + 'px',
                  height: GRID_SIZE * CELL_SIZE + 'px'
                }}
              >
                {renderGrid()}
              </div>
            </div>
          )}
          
          {gameOver && (
            <div className="game-over-screen">
              <h2>GAME OVER</h2>
              <p>Your score: {score}</p>
              <button onClick={() => startGame(speed)}>Play Again</button>
              <button onClick={() => {setGameOver(false)}}>Main Menu</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
