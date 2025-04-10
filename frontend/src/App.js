
import { useState, useEffect, useRef } from 'react';
import "./App.css";

// Constants
const GRID_SIZE = 15;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 7, y: 7 }];
const INITIAL_DIRECTION = 'RIGHT';
const INITIAL_SPEED = {
  BASIC: 180,    // Slower for beginners
  MODERATE: 120, // Medium speed
  ADVANCED: 70   // Fast, challenging speed
};

function App() {
  // Game States
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAME_OVER
  const [difficulty, setDifficulty] = useState('BASIC');
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED.BASIC);
  
  // References
  const gameLoopRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const gameContainerRef = useRef(null);

  // Initialize Game
  const startGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    generateFood();
    setGameState('PLAYING');
    
    // Set speed based on difficulty
    switch(selectedDifficulty) {
      case 'BASIC':
        setSpeed(INITIAL_SPEED.BASIC);
        break;
      case 'MODERATE':
        setSpeed(INITIAL_SPEED.MODERATE);
        break;
      case 'ADVANCED':
        setSpeed(INITIAL_SPEED.ADVANCED);
        break;
      default:
        setSpeed(INITIAL_SPEED.BASIC);
    }
  };

  // Generate random food position
  const generateFood = () => {
    // Create a buffer to keep food away from walls
    const bufferFromWall = 1;
    const newFood = {
      x: Math.floor(Math.random() * (GRID_SIZE - 2 * bufferFromWall)) + bufferFromWall,
      y: Math.floor(Math.random() * (GRID_SIZE - 2 * bufferFromWall)) + bufferFromWall
    };
    
    // Check if food is not on snake
    const isOnSnake = snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );
    
    if (isOnSnake) {
      generateFood(); // Try again
    } else {
      setFood(newFood);
    }
  };

  // Additional states
  const [scoreAnimation, setScoreAnimation] = useState(false);
  
  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    
    const moveSnake = () => {
      const head = { ...snake[0] };
      
      // Move head based on direction
      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
        default:
          break;
      }
      
      // Check for collisions
      const hitWall = head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
      const hitSelf = snake.some(segment => segment.x === head.x && segment.y === head.y);
      
      if (hitWall || hitSelf) {
        setGameState('GAME_OVER');
        return;
      }
      
      // Check if snake eats food
      const eating = head.x === food.x && head.y === food.y;
      
      // Create new snake
      const newSnake = [head, ...snake];
      if (!eating) {
        newSnake.pop(); // Remove tail if not eating
      } else {
        setScore(prevScore => prevScore + 1);
        setScoreAnimation(true);
        setTimeout(() => setScoreAnimation(false), 300);
        generateFood();
      }
      
      setSnake(newSnake);
    };
    
    gameLoopRef.current = setInterval(moveSnake, speed);
    
    return () => clearInterval(gameLoopRef.current);
  }, [snake, direction, food, gameState, speed]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'PLAYING') return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameState]);

  // Touch Controls for Mobile
  const handleTouchStart = (e) => {
    if (gameState !== 'PLAYING') return;
    
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };
  
  const handleTouchEnd = (e) => {
    if (gameState !== 'PLAYING') return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const dx = touchEnd.x - touchStartRef.current.x;
    const dy = touchEnd.y - touchStartRef.current.y;
    
    // Determine swipe direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0 && direction !== 'LEFT') {
        setDirection('RIGHT');
      } else if (dx < 0 && direction !== 'RIGHT') {
        setDirection('LEFT');
      }
    } else {
      // Vertical swipe
      if (dy > 0 && direction !== 'UP') {
        setDirection('DOWN');
      } else if (dy < 0 && direction !== 'DOWN') {
        setDirection('UP');
      }
    }
  };

  // Render game grid
  const renderGrid = () => {
    const grid = [];
    
    // Create grid cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnake = snake.some(segment => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;
        const isHead = snake[0].x === x && snake[0].y === y;
        
        let cellClass = "nokia-cell";
        if (isHead) {
          cellClass += " snake-head";
        } else if (isSnake) {
          cellClass += " snake-body";
        } else if (isFood) {
          cellClass += " food";
        }
        
        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
            }}
          />
        );
      }
    }
    
    return grid;
  };

  // Render start screen
  const renderStartScreen = () => (
    <div className="nokia-screen start-screen">
      <div className="nokia-text">SNAKE</div>
      <div className="nokia-subtitle">SELECT DIFFICULTY</div>
      <button 
        className="nokia-button" 
        onClick={() => startGame('BASIC')}
      >
        BASIC
      </button>
      <button 
        className="nokia-button" 
        onClick={() => startGame('MODERATE')}
      >
        MODERATE
      </button>
      <button 
        className="nokia-button" 
        onClick={() => startGame('ADVANCED')}
      >
        ADVANCED
      </button>
    </div>
  );

  // Render game over screen
  const renderGameOver = () => (
    <div className="nokia-screen game-over">
      <div className="nokia-text">GAME OVER</div>
      <div className="nokia-score">SCORE: {score}</div>
      <button 
        className="nokia-button" 
        onClick={() => startGame(difficulty)}
      >
        PLAY AGAIN
      </button>
      <button 
        className="nokia-button" 
        onClick={() => setGameState('START')}
      >
        MAIN MENU
      </button>
    </div>
  );

  // Render game screen
  const renderGameScreen = () => (
    <div 
      className="nokia-screen game-screen"
      ref={gameContainerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="nokia-score-bar">SCORE: {score}</div>
      <div 
        className="nokia-grid"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {renderGrid()}
      </div>
    </div>
  );

  // Main render
  return (
    <div className="nokia-container">
      <div className="nokia-phone">
        <div className="nokia-header">NOKIA</div>
        {gameState === 'START' && renderStartScreen()}
        {gameState === 'PLAYING' && renderGameScreen()}
        {gameState === 'GAME_OVER' && renderGameOver()}
      </div>
    </div>
  );
}

export default App;
