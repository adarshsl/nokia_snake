
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
    const initialFood = { x: 5, y: 5 }; // Always start with food at this position for consistency
    setFood(initialFood);
    
    // Start the game
    setGameState('PLAYING');
  };

  // Place food at a random position not occupied by the snake
  const placeFood = () => {
    const availablePositions = [];
    
    // Find all positions not occupied by the snake
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Check if this position is on the snake
        const isOnSnake = snake.some(segment => segment.x === x && segment.y === y);
        if (!isOnSnake) {
          availablePositions.push({ x, y });
        }
      }
    }
    
    // If there are available positions, randomly select one
    if (availablePositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      const newFoodPosition = availablePositions[randomIndex];
      setFood(newFoodPosition);
    } else {
      // If no positions are available (snake fills the grid), the player wins!
      // For simplicity, we'll just end the game
      setGameState('GAME_OVER');
    }
  };
  
  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    
    const moveSnake = () => {
      // Get the current snake and head
      const currentSnake = [...snake];
      const head = { ...currentSnake[0] };
      
      // Create a new head based on direction
      let newHead;
      switch (direction) {
        case 'UP':
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case 'DOWN':
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case 'LEFT':
          newHead = { x: head.x - 1, y: head.y };
          break;
        case 'RIGHT':
          newHead = { x: head.x + 1, y: head.y };
          break;
        default:
          return; // Invalid direction
      }
      
      // Track last movement direction
      setLastMovement(direction);
      
      // Check for wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        console.log('Wall collision detected');
        setGameState('GAME_OVER');
        return;
      }
      
      // Check for self collision (only with body parts after the head)
      for (let i = 1; i < currentSnake.length; i++) {
        if (newHead.x === currentSnake[i].x && newHead.y === currentSnake[i].y) {
          console.log('Self collision detected');
          setGameState('GAME_OVER');
          return;
        }
      }
      
      // Create a new snake array with the new head
      const newSnake = [newHead, ...currentSnake];
      
      // Check if the snake eats food
      const eatingFood = newHead.x === food.x && newHead.y === food.y;
      
      if (eatingFood) {
        // Snake eats food - don't remove the tail so the snake grows
        console.log('Food eaten at position:', food);
        
        // Increment score
        setScore(prevScore => {
          const newScore = prevScore + 1;
          console.log('Score increased:', prevScore, '->', newScore);
          return newScore;
        });
        
        // Trigger score animation
        setScoreAnimation(true);
        setTimeout(() => setScoreAnimation(false), 300);
        
        // Generate new food
        setTimeout(() => placeFood(), 10);
      } else {
        // Snake didn't eat food - remove the tail
        newSnake.pop();
      }
      
      // Update the snake state
      setSnake(newSnake);
    };
    
    // Set up the game loop interval
    const intervalId = setInterval(moveSnake, speed);
    gameLoopRef.current = intervalId;
    
    // Clean up the interval when the component unmounts or dependencies change
    return () => clearInterval(intervalId);
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
        const isHead = snake[0]?.x === x && snake[0]?.y === y;
        const isFood = food?.x === x && food?.y === y;
        
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
