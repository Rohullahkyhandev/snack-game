import  { useState, useEffect, useRef, useCallback } from "react";

const GRID_SIZE = 20;
const CELL_SIZE = 20; // in pixels
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
];
const INITIAL_DIR = { x: 0, y: -1 }; // Moving UP
const GAME_SPEED = 120; // ms per tick

export default function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIR);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Use refs to access latest state inside the game loop interval
  const snakeRef = useRef(snake);
  const directionRef = useRef(direction);
  const lastProcessedDirRef = useRef(direction);
  const foodRef = useRef(food);

  // Sync refs with state
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { foodRef.current = food; }, [food]);

  // Helper to spawn food avoiding the snake's body
  const generateFood = useCallback((currentSnake:any[]) => {
    let newFood:any;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      const isOnSnake = currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  // Initialize food on mount
  useEffect(() => {
    setFood(generateFood(INITIAL_SNAKE));
  }, [generateFood]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e:any) => {
      // Use lastProcessedDir to prevent rapid double-key-press self-collisions
      const lastDir = lastProcessedDirRef.current;
      
      if (['ArrowUp', 'w', 'W'].includes(e.key) && lastDir.y === 0) {
        setDirection({ x: 0, y: -1 });
      } else if (['ArrowDown', 's', 'S'].includes(e.key) && lastDir.y === 0) {
        setDirection({ x: 0, y: 1 });
      } else if (['ArrowLeft', 'a', 'A'].includes(e.key) && lastDir.x === 0) {
        setDirection({ x: -1, y: 0 });
      } else if (['ArrowRight', 'd', 'D'].includes(e.key) && lastDir.x === 0) {
        setDirection({ x: 1, y: 0 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Main Game Loop
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      const currentSnake = snakeRef.current;
      const currentDir = directionRef.current;
      const currentFood = foodRef.current;

      // Mark this direction as processed for the keyboard lock logic
      lastProcessedDirRef.current = currentDir;

      const head = currentSnake[0];
      const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

      // 1. Check Wall Collision
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE
      ) {
        handleGameOver();
        return;
      }

      // 2. Check Self Collision
      if (currentSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        handleGameOver();
        return;
      }

      const newSnake = [newHead, ...currentSnake];

      // 3. Check Food Collision
      if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
        setScore((s) => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop(); 
      }

      setSnake(newSnake);
    }, GAME_SPEED);

    return () => clearInterval(interval);
  }, [gameOver, generateFood]);

  const handleGameOver = () => {
    setGameOver(true);
    setHighScore((prev) => Math.max(prev, score));
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIR);
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    lastProcessedDirRef.current = INITIAL_DIR;
  };

  // --- STYLES ---
  const styles:any = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#1e1e2f",
      color: "#ffffff",
      minHeight: "100vh",
      padding: "20px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      width: `${GRID_SIZE * CELL_SIZE}px`,
      marginBottom: "15px",
      fontSize: "1.2rem",
      fontWeight: "bold",
    },
    board: {
      position: "relative",
      width: `${GRID_SIZE * CELL_SIZE}px`,
      height: `${GRID_SIZE * CELL_SIZE}px`,
      backgroundColor: "#2a2a40",
      border: "3px solid #4caf50",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    },
    cell: (x:any, y:any, isFood:any, isHead:any) => ({
      position: "absolute",
      left: `${x * CELL_SIZE}px`,
      top: `${y * CELL_SIZE}px`,
      width: `${CELL_SIZE}px`,
      height: `${CELL_SIZE}px`,
      backgroundColor: isFood ? "#ff4757" : isHead ? "#2ed573" : "#7bed9f",
      borderRadius: isFood ? "50%" : "4px",
      boxShadow: isFood ? "0 0 10px #ff4757" : "none",
      border: isFood ? "none" : "1px solid #2ed573",
      transition: isFood ? "none" : "all 0.05s linear",
    }),
    overlay: {
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    button: {
      marginTop: "20px",
      padding: "10px 20px",
      fontSize: "1rem",
      fontWeight: "bold",
      color: "#fff",
      backgroundColor: "#4caf50",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
    },
    controlsHint: {
      marginTop: "20px",
      color: "#a4b0be",
      fontSize: "0.9rem",
    }
  };

  return (
    <div style={styles.container}>
      <h2>🐍 Snack / Snake Game</h2>
      
      <div style={styles.header}>
        <div>Score: {score}</div>
        <div>High Score: {highScore}</div>
      </div>

      <div style={styles.board}>
        {/* Render Food */}
        <div style={styles.cell(food.x, food.y, true, false)} />

        {/* Render Snake */}
        {snake.map((segment, index) => (
          <div
            key={`${segment.x}-${segment.y}-${index}`}
            style={styles.cell(segment.x, segment.y, false, index === 0)}
          />
        ))}

        {/* Game Over Overlay */}
        {gameOver && (
          <div style={styles.overlay}>
            <h1 style={{ color: "#ff4757", margin: 0 }}>GAME OVER</h1>
            <p>Final Score: {score}</p>
            <button 
              style={styles.button} 
              onClick={resetGame}
              onMouseOver={(e:any) => e.target.style.backgroundColor = "#45a049"}
              onMouseOut={(e:any) => e.target.style.backgroundColor = "#4caf50"}
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <p style={styles.controlsHint}>Use <strong>W, A, S, D</strong> or <strong>Arrow Keys</strong> to move.</p>
    </div>
  );
}