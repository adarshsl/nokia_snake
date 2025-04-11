
import { useState, useEffect, useRef } from 'react';
import "./App.css";

// Constants
const GRID_SIZE = 15;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 7, y: 7 }];
const INITIAL_DIRECTION = 'RIGHT';
const INITIAL_SPEED = {
  BASIC: 300,    // Much slower for beginners
  MODERATE: 200, // Medium speed
  ADVANCED: 180  // Fast but not too fast
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
  const [lastMovement, setLastMovement] = useState(null);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  
  // References
  const gameLoopRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const gameContainerRef = useRef(null);

  // Initialize Game
  const startGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setLastMovement(null);
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
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    
    // Check if food would spawn on snake
    const onSnake = snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );
    
    if (onSnake) {
      // Try again with recursion (will create a new random position)
      generateFood();
    } else {
      setFood(newFood);
    }
  };
  
  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    
    const moveSnake = () => {
      // 1. Get the current snake head
      const currentHead = snake[0];
      
      // 2. Create new head based on direction
      const newHead = { ...currentHead };
      
      switch (direction) {
        case 'UP':
          newHead.y -= 1;
          break;
        case 'DOWN':
          newHead.y += 1;
          break;
        case 'LEFT':
          newHead.x -= 1;
          break;
        case 'RIGHT':
          newHead.x += 1;
          break;
        default:
          break;
      }
      
      // Save last movement direction
      setLastMovement(direction);
      
      // 3. Check for wall collision
      if (
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE || 
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE
      ) {
        setGameState('GAME_OVER');
        return;
      }
      
      // 4. Check for self collision
      // Start from index 1 to check body parts (not the head)
      for (let i = 1; i < snake.length; i++) {
        if (newHead.x === snake[i].x && newHead.y === snake[i].y) {
          setGameState('GAME_OVER');
          return;
        }
      }
      
      // 5. Create new snake by adding head
      const newSnake = [newHead, ...snake];
      
      // 6. Check if snake eats food
      const eating = newHead.x === food.x && newHead.y === food.y;
      
      if (eating) {
        console.log("FOOD EATEN! At position:", food);
        // Don't remove tail (snake grows)
        setScore(score + 1);
        setScoreAnimation(true);
        setTimeout(() => setScoreAnimation(false), 300);
        
        // Generate new food immediately
        // Create a list of positions not occupied by snake to place food
        const availablePositions = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const isOnSnake = newSnake.some(
              segment => segment.x === x && segment.y === y
            );
            if (!isOnSnake) {
              availablePositions.push({ x, y });
            }
          }
        }
        
        // Randomly select a position for food
        if (availablePositions.length > 0) {
          const randomIndex = Math.floor(Math.random() * availablePositions.length);
          const newFood = availablePositions[randomIndex];
          console.log("Setting new food at:", newFood);
          setFood(newFood);
        }
      } else {
        // Remove tail if not eating
        newSnake.pop();
      }
      
      // 7. Update snake state
      setSnake(newSnake);
    };
    
    gameLoopRef.current = setInterval(moveSnake, speed);
    
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, direction, snake, food, speed]);
  
  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING') return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (lastMovement !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (lastMovement !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (lastMovement !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (lastMovement !== 'LEFT') setDirection('RIGHT');
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, lastMovement]);

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
      if (dx > 0 && lastMovement !== 'LEFT') {
        setDirection('RIGHT');
      } else if (dx < 0 && lastMovement !== 'RIGHT') {
        setDirection('LEFT');
      }
    } else {
      // Vertical swipe
      if (dy > 0 && lastMovement !== 'UP') {
        setDirection('DOWN');
      } else if (dy < 0 && lastMovement !== 'DOWN') {
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
        // Create cell element
        let cellClass = "nokia-cell";
        
        // Check if cell is part of snake
        const isSnakePart = snake.some(segment => segment.x === x && segment.y === y);
        const isHead = snake[0].x === x && snake[0].y === y;
        const isFood = food.x === x && food.y === y;
        
        if (isHead) {
          cellClass += " snake-head";
        } else if (isSnakePart) {
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
      <div className={`nokia-score-bar ${scoreAnimation ? 'score-animation' : ''}`}>SCORE: {score}</div>
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
