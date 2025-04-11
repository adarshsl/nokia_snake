
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
    
    // Place initial food (ensure it's not on the snake)
    placeFood();
    
    // Start the game
    setGameState('PLAYING');
  };

  // Generate food in a position not occupied by the snake
  const placeFood = () => {
    // Create a grid of all positions
    const positions = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        positions.push({ x, y });
      }
    }
    
    // Filter out positions occupied by the snake
    const availablePositions = positions.filter(pos => {
      return !snake.some(segment => segment.x === pos.x && segment.y === pos.y);
    });
    
    // If there are available positions, place food in a random one
    if (availablePositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      const newFoodPosition = availablePositions[randomIndex];
      
      // Set the new food position
      setFood(newFoodPosition);
      console.log('Food placed at:', newFoodPosition);
    } else {
      // If no positions are available (snake fills the grid), end the game
      setGameState('GAME_OVER');
    }
  };
  
  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    
    const moveSnake = () => {
      setSnake(prevSnake => {
        // Get current head
        const head = { ...prevSnake[0] };
        
        // Create new head based on direction
        let newHead = { ...head };
        
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
        
        // Save last movement
        setLastMovement(direction);
        
        // Check for wall collision
        if (
          newHead.x < 0 || 
          newHead.x >= GRID_SIZE || 
          newHead.y < 0 || 
          newHead.y >= GRID_SIZE
        ) {
          setGameState('GAME_OVER');
          return prevSnake; // Return unchanged snake
        }
        
        // Check for self collision
        for (let i = 1; i < prevSnake.length; i++) {
          if (newHead.x === prevSnake[i].x && newHead.y === prevSnake[i].y) {
            setGameState('GAME_OVER');
            return prevSnake; // Return unchanged snake
          }
        }
        
        // Create new snake by adding new head
        const newSnake = [newHead, ...prevSnake];
        
        // Check if snake eats food
        if (newHead.x === food.x && newHead.y === food.y) {
          // Don't remove tail (snake grows)
          console.log('Food eaten! Score:', score, '-> ', score + 1);
          setScore(prevScore => prevScore + 1);
          setScoreAnimation(true);
          setTimeout(() => setScoreAnimation(false), 300);
          
          // Place new food
          setTimeout(() => placeFood(), 10);
          
          return newSnake;
        } else {
          // Remove tail if not eating
          newSnake.pop();
          return newSnake;
        }
      });
    };
    
    // Set up game loop
    gameLoopRef.current = setInterval(moveSnake, speed);
    
    // Clean up interval on unmount
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, direction, food, speed, score]);
  
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
        const isHead = snake[0]?.x === x && snake[0]?.y === y;
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
