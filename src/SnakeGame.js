import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SnakeGame.css';

// Load sound effects
const eatSound = new Audio(require('./sounds/eat.mp3'));
const gameOverSound = new Audio(require('./sounds/game over.mp3')); // Fixed the file name issue

const SnakeGame = () => {
    const [snake, setSnake] = useState([{ x: 0, y: 0 }]);
    const [food, setFood] = useState({ x: 10, y: 10 });
    const [bigFood, setBigFood] = useState(null);
    const [direction, setDirection] = useState('RIGHT');
    const [speed, setSpeed] = useState(200);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(localStorage.getItem('highScore') || 0);
    const [isPaused, setIsPaused] = useState(false);
    const [theme, setTheme] = useState('classic');
    const [difficulty, setDifficulty] = useState('medium');
    const [soundsEnabled, setSoundsEnabled] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const bigFoodTimer = useRef(null);
    const bigFoodTimeout = useRef(null);
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);

    const enableSounds = () => {
        setSoundsEnabled(true);
    };

    const startGame = () => {
        setGameStarted(true);
        enableSounds();
        startBigFoodTimer();
    };

    const collision = useCallback((newSnake) => {
        const head = newSnake[newSnake.length - 1];
        for (let i = 0; i < newSnake.length - 1; i++) {
            if (newSnake[i].x === head.x && newSnake[i].y === head.y) {
                return true;
            }
        }
        return false;
    }, []);

    const moveSnake = useCallback(() => {
        let newSnake = [...snake];
        let head = { ...newSnake[newSnake.length - 1] };

        switch (direction) {
            case 'RIGHT':
                head.x += 1;
                break;
            case 'LEFT':
                head.x -= 1;
                break;
            case 'DOWN':
                head.y += 1;
                break;
            case 'UP':
                head.y -= 1;
                break;
            default:
                break;
        }

        newSnake.push(head);
        newSnake.shift();

        if (head.x === food.x && head.y === food.y) {
            setFood(generateRandomPosition());
            newSnake.unshift({});
            setSnake(newSnake);
            setScore(prevScore => {
                const newScore = prevScore + 1;
                if (newScore % 15 === 0) {
                    placeBigFood(); // Place big food every 15 points
                }
                if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem('highScore', newScore);
                }
                return newScore;
            });
            if (soundsEnabled) eatSound.play();
        }

        if (head.x === bigFood?.x && head.y === bigFood?.y) {
            setBigFood(null);
            setScore(prevScore => {
                const newScore = prevScore + 5; // Add 5 points for big food
                if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem('highScore', newScore);
                }
                return newScore;
            });
            if (soundsEnabled) eatSound.play();
        }

        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || collision(newSnake)) {
            setGameOver(true);
            if (soundsEnabled) gameOverSound.play();
        }

        setSnake(newSnake);
    }, [snake, food, bigFood, direction, collision, soundsEnabled, highScore]);

    const togglePause = useCallback(() => {
        setIsPaused(prevIsPaused => !prevIsPaused);
    }, []);

    const changeDirection = useCallback((e) => {
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
            case ' ':
                togglePause();
                break;
            default:
                break;
        }
    }, [direction, togglePause]);

    const generateRandomPosition = useCallback(() => {
        let randomX, randomY;
        do {
            randomX = Math.floor(Math.random() * 20);
            randomY = Math.floor(Math.random() * 20);
        } while (snake.some(part => part.x === randomX && part.y === randomY) || (food.x === randomX && food.y === randomY));
        return { x: randomX, y: randomY };
    }, [snake, food]);

    const placeBigFood = useCallback(() => {
        const { x, y } = generateRandomPosition();
        setBigFood({ x, y });
    }, [generateRandomPosition]);

    const startBigFoodTimer = () => {
        bigFoodTimer.current = setTimeout(() => {
            placeBigFood();
            bigFoodTimeout.current = setInterval(() => {
                if (score % 15 === 0) {
                    placeBigFood();
                }
            }, 15000); // 15 seconds interval for big food
        }, 15000); // 15 seconds delay before first big food
    };

    const handleSettingsChange = (e) => {
        const { name, value } = e.target;
        if (name === 'difficulty') {
            setDifficulty(value);
            switch (value) {
                case 'easy':
                    setSpeed(300);
                    break;
                case 'medium':
                    setSpeed(200);
                    break;
                case 'hard':
                    setSpeed(100);
                    break;
                default:
                    setSpeed(200);
                    break;
            }
        }
        if (name === 'theme') {
            setTheme(value);
        }
    };

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
    };

    const handleTouchMove = (e) => {
        if (!touchStartX.current || !touchStartY.current) {
            return;
        }

        const touch = e.touches[0];
        const deltaX = touchStartX.current - touch.clientX;
        const deltaY = touchStartY.current - touch.clientY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0 && direction !== 'RIGHT') {
                setDirection('LEFT');
            } else if (deltaX < 0 && direction !== 'LEFT') {
                setDirection('RIGHT');
            }
        } else {
            if (deltaY > 0 && direction !== 'DOWN') {
                setDirection('UP');
            } else if (deltaY < 0 && direction !== 'UP') {
                setDirection('DOWN');
            }
        }

        touchStartX.current = null;
        touchStartY.current = null;
    };

    useEffect(() => {
        document.addEventListener('keydown', changeDirection);
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        
        const gameInterval = setInterval(() => {
            if (gameStarted && !gameOver && !isPaused) moveSnake();
        }, speed);

        return () => {
            clearInterval(gameInterval);
            document.removeEventListener('keydown', changeDirection);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            clearTimeout(bigFoodTimer.current);
            clearInterval(bigFoodTimeout.current);
        };
    }, [changeDirection, moveSnake, speed, gameStarted, gameOver, isPaused]);

    useEffect(() => {
        if (score % 5 === 0 && score > 0) {
            placeBigFood();
        }
    }, [score, placeBigFood]);

    const resetGame = () => {
        setSnake([{ x: 0, y: 0 }]);
        setFood({ x: 10, y: 10 });
        setBigFood(null);
        setDirection('RIGHT');
        setSpeed(200);
        setGameOver(false);
        setScore(0);
        setIsPaused(false);
        setGameStarted(false);
        clearTimeout(bigFoodTimer.current);
        clearInterval(bigFoodTimeout.current);
    };

    return (
        <div className={`snake-game ${theme}`} onClick={enableSounds}>
            <h1>Snake Game</h1>
            {!gameStarted ? (
                <div className="start-screen">
                    <button onClick={startGame} className="start-button">Start Game</button>
                </div>
            ) : (
                <>
                    <div className="settings">
                        <label>
                            Difficulty:
                            <select name="difficulty" value={difficulty} onChange={handleSettingsChange}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </label>
                        <label>
                            Theme:
                            <select name="theme" value={theme} onChange={handleSettingsChange}>
                                <option value="classic">Classic</option>
                                <option value="neon">Neon</option>
                                <option value="dark">Dark</option>
                            </select>
                        </label>
                    </div>
                    <div>Score: {score}</div>
                    <div>High Score: {highScore}</div>
                    <div className="board">
                        {Array.from({ length: 20 * 20 }, (_, index) => {
                            const x = index % 20;
                            const y = Math.floor(index / 20);
                            let className = 'cell';
                            if (snake.some(part => part.x === x && part.y === y)) className += ' snake';
                            if (food.x === x && food.y === y) className += ' food';
                            if (bigFood && bigFood.x === x && bigFood.y === y) className += ' big-food';
                            return <div key={index} className={className} />;
                        })}
                    </div>
                    {gameOver && (
                        <div className="game-over">
                            <h2>Game Over</h2>
                            <button onClick={resetGame} className="restart-button">Restart</button>
                        </div>
                    )}
                    <button onClick={togglePause} className="pause-button">
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <div className="controls-panel">
                        <button className="control-button" onClick={() => changeDirection({ key: 'ArrowUp' })}>Up</button>
                        </div>    
                    <div className="controls-panel">
                        
                        <button className="control-button" onClick={() => changeDirection({ key: 'ArrowLeft' })}>Left</button>
                        <button className="control-button" onClick={() => changeDirection({ key: 'ArrowDown' })}>Down</button>
                        
                        <button className="control-button" onClick={() => changeDirection({ key: 'ArrowRight' })}>Right</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SnakeGame;
