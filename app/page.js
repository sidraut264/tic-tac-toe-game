"use client";

import { useState, useEffect, useCallback } from 'react';

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [gameMode, setGameMode] = useState('classic');
  const [timeLeft, setTimeLeft] = useState(10);
  const [isTimeRunning, setIsTimeRunning] = useState(false);
  const [powerUps, setPowerUps] = useState({ X: { freeze: 1, double: 1, bomb: 1 }, O: { freeze: 1, double: 1, bomb: 1 } });
  const [frozenPlayer, setFrozenPlayer] = useState(null);
  const [doubleMove, setDoubleMove] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [winningLine, setWinningLine] = useState([]);
  const [boardSize, setBoardSize] = useState(3);
  const [particles, setParticles] = useState([]);
  const [gameStats, setGameStats] = useState({ totalGames: 0, longestWinStreak: 0, currentStreak: 0, streakPlayer: null });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState('gradient');
  const [aiMode, setAiMode] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');

  const createBoard = (size) => Array(size * size).fill(null);

  const getWinningLines = (size) => {
    const lines = [];
    // Rows
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        row.push(i * size + j);
      }
      lines.push(row);
    }
    // Columns
    for (let i = 0; i < size; i++) {
      const col = [];
      for (let j = 0; j < size; j++) {
        col.push(j * size + i);
      }
      lines.push(col);
    }
    // Diagonals
    const diag1 = [], diag2 = [];
    for (let i = 0; i < size; i++) {
      diag1.push(i * size + i);
      diag2.push(i * size + (size - 1 - i));
    }
    lines.push(diag1, diag2);
    return lines;
  };

  // AI Logic
  const minimax = useCallback((squares, depth, isMaximizing, alpha = -Infinity, beta = Infinity) => {
    const winningLines = getWinningLines(boardSize);
    
    // Check for winner
    for (let line of winningLines) {
      const firstSquare = squares[line[0]];
      if (firstSquare && line.every(index => squares[index] === firstSquare)) {
        if (firstSquare === 'O') return 10 - depth;  // AI wins
        if (firstSquare === 'X') return depth - 10;  // Human wins
      }
    }
    
    // Check for draw
    if (squares.every(square => square !== null)) return 0;
    
    // Limit search depth for performance
    if (depth > 6) return 0;
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          const evaluation = minimax(squares, depth + 1, false, alpha, beta);
          squares[i] = null;
          maxEval = Math.max(maxEval, evaluation);
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break; // Alpha-beta pruning
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          const evaluation = minimax(squares, depth + 1, true, alpha, beta);
          squares[i] = null;
          minEval = Math.min(minEval, evaluation);
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break; // Alpha-beta pruning
        }
      }
      return minEval;
    }
  }, [boardSize]);

  const getBestMove = useCallback((squares) => {
    const emptyCells = squares.map((cell, index) => cell === null ? index : null).filter(val => val !== null);
    
    if (emptyCells.length === 0) return null;
    
    if (difficulty === 'easy') {
      // 70% random, 30% optimal
      if (Math.random() < 0.7) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
    }
    
    // For medium/hard and the 30% smart moves in easy
    let bestScore = -Infinity;
    let bestMove = null;
    
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        const testBoard = [...squares];
        testBoard[i] = 'O';
        const score = minimax(testBoard, 0, false);
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    
    return bestMove !== null ? bestMove : emptyCells[0];
  }, [difficulty, minimax]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimeRunning && timeLeft > 0 && !winner && !isDraw && gameMode === 'time-attack') {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            if (aiMode && !isXNext) {
              // AI's turn, don't switch
              return 10;
            }
            setIsXNext(!isXNext);
            return 10;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimeRunning, timeLeft, winner, isDraw, gameMode, isXNext, aiMode]);

  // AI Move Effect
  useEffect(() => {
    if (aiMode && !isXNext && !winner && !isDraw && frozenPlayer !== 'O') {
      const timer = setTimeout(() => {
        const bestMove = getBestMove([...board]); // Pass a copy of the board
        if (bestMove !== null && bestMove !== undefined) {
          // Simulate AI click
          const newBoard = [...board];
          newBoard[bestMove] = 'O';
          setBoard(newBoard);
          setMoveHistory(prev => [...prev, { player: 'O', index: bestMove, timestamp: Date.now() }]);
          
          if (doubleMove) {
            setDoubleMove(false);
          } else {
            setIsXNext(true);
            if (gameMode === 'time-attack') {
              setTimeLeft(10);
            }
          }
        }
      }, 800); // AI thinks for 800ms
      return () => clearTimeout(timer);
    }
  }, [aiMode, isXNext, board, winner, isDraw, frozenPlayer, doubleMove, gameMode, getBestMove]);

  // Frozen player effect
  useEffect(() => {
    if (frozenPlayer) {
      const timer = setTimeout(() => {
        setFrozenPlayer(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [frozenPlayer]);

  useEffect(() => {
    const winningLines = getWinningLines(boardSize);

    const checkWinner = (squares) => {
      for (let line of winningLines) {
        const firstSquare = squares[line[0]];
        if (firstSquare && line.every(index => squares[index] === firstSquare)) {
          setWinningLine(line);
          return firstSquare;
        }
      }
      return null;
    };

    const checkDraw = (squares) => {
      return squares.every(square => square !== null);
    };

    const gameWinner = checkWinner(board);
    const gameDraw = checkDraw(board);
    
    if (gameWinner) {
      setWinner(gameWinner);
      setIsTimeRunning(false);
      setScores(prev => ({
        ...prev,
        [gameWinner]: prev[gameWinner] + 1
      }));
      
      // Update game stats
      setGameStats(prev => {
        const newStats = { ...prev, totalGames: prev.totalGames + 1 };
        if (prev.streakPlayer === gameWinner) {
          newStats.currentStreak = prev.currentStreak + 1;
          newStats.longestWinStreak = Math.max(prev.longestWinStreak, newStats.currentStreak);
        } else {
          newStats.currentStreak = 1;
          newStats.streakPlayer = gameWinner;
        }
        return newStats;
      });
      
      // Create win particles
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: gameWinner === 'X' ? 'blue' : 'red'
        });
      }
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 3000);
    } else if (gameDraw && !gameWinner) {
      setIsDraw(true);
      setIsTimeRunning(false);
      setScores(prev => ({
        ...prev,
        draws: prev.draws + 1
      }));
      setGameStats(prev => ({ ...prev, totalGames: prev.totalGames + 1, currentStreak: 0, streakPlayer: null }));
    }
  }, [board, boardSize]);

  const handleClick = (index) => {
    if (board[index] || winner || isDraw) return;
    if (frozenPlayer === (isXNext ? 'X' : 'O')) return;
    if (aiMode && !isXNext) return; // Prevent human from moving during AI turn

    const newBoard = [...board];
    const currentPlayer = isXNext ? 'X' : 'O';
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setMoveHistory([...moveHistory, { player: currentPlayer, index, timestamp: Date.now() }]);

    if (doubleMove) {
      setDoubleMove(false);
    } else {
      setIsXNext(!isXNext);
      if (gameMode === 'time-attack') {
        setTimeLeft(10);
      }
    }
  };

  const handleBombPowerUp = (currentPlayer) => {
    // Remove a random opponent's piece
    const opponentPieces = board.map((piece, index) => 
      piece === (currentPlayer === 'X' ? 'O' : 'X') ? index : null
    ).filter(index => index !== null);
    
    if (opponentPieces.length > 0) {
      const randomIndex = opponentPieces[Math.floor(Math.random() * opponentPieces.length)];
      const newBoard = [...board];
      newBoard[randomIndex] = null;
      setBoard(newBoard);
      
      setPowerUps(prev => ({
        ...prev,
        [currentPlayer]: {
          ...prev[currentPlayer],
          bomb: prev[currentPlayer].bomb - 1
        }
      }));
    }
  };

  const handlePowerUp = (type) => {
    const currentPlayer = isXNext ? 'X' : 'O';
    if (powerUps[currentPlayer][type] <= 0) return;

    setPowerUps(prev => ({
      ...prev,
      [currentPlayer]: {
        ...prev[currentPlayer],
        [type]: prev[currentPlayer][type] - 1
      }
    }));

    if (type === 'freeze') {
      setFrozenPlayer(currentPlayer === 'X' ? 'O' : 'X');
    } else if (type === 'double') {
      setDoubleMove(true);
    } else if (type === 'bomb') {
      handleBombPowerUp(currentPlayer);
    }
  };

  const undoLastMove = () => {
    if (moveHistory.length === 0 || winner || isDraw) return;
    
    const newHistory = [...moveHistory];
    const lastMove = newHistory.pop();
    const newBoard = [...board];
    newBoard[lastMove.index] = null;
    
    setBoard(newBoard);
    setMoveHistory(newHistory);
    setIsXNext(lastMove.player !== 'X');
  };

  const resetGame = () => {
    setBoard(createBoard(boardSize));
    setIsXNext(true);
    setWinner(null);
    setIsDraw(false);
    setTimeLeft(10);
    setIsTimeRunning(gameMode === 'time-attack');
    setFrozenPlayer(null);
    setDoubleMove(false);
    setMoveHistory([]);
    setWinningLine([]);
    setParticles([]);
    if (gameMode === 'power-ups') {
      setPowerUps({ X: { freeze: 1, double: 1, bomb: 1 }, O: { freeze: 1, double: 1, bomb: 1 } });
    }
  };

  const changeBoardSize = (size) => {
    setBoardSize(size);
    setBoard(createBoard(size));
    setWinner(null);
    setIsDraw(false);
    setMoveHistory([]);
    setWinningLine([]);
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900';
      case 'ocean':
        return 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600';
      case 'forest':
        return 'bg-gradient-to-br from-green-400 via-green-500 to-green-600';
      default:
        return 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500';
    }
  };

  const renderSquare = (index) => {
    const isWinningSquare = winningLine.includes(index);
    const size = boardSize;
    const squareSize = size === 3 ? 'w-20 h-20' : size === 4 ? 'w-16 h-16' : 'w-12 h-12';
    const fontSize = size === 3 ? 'text-4xl' : size === 4 ? 'text-3xl' : 'text-2xl';
    
    return (
      <button
        key={index}
        className={`
          ${squareSize} border-2 bg-white ${fontSize} font-bold
          hover:bg-gray-50 transition-all duration-300 transform hover:scale-105
          ${board[index] === 'X' ? 'text-blue-600' : 'text-red-600'}
          ${isWinningSquare ? 'border-yellow-400 bg-yellow-100 animate-pulse' : 'border-gray-400'}
          ${!board[index] && !winner && !isDraw ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}
          ${frozenPlayer === (isXNext ? 'X' : 'O') ? 'opacity-50' : ''}
        `}
        onClick={() => handleClick(index)}
      >
        {board[index]}
      </button>
    );
  };

  return (
    <div className={`min-h-screen ${getThemeClasses()} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Animated particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`absolute w-2 h-2 rounded-full animate-bounce`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color === 'blue' ? '#3b82f6' : '#ef4444',
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Ultimate Tic Tac Toe
        </h1>
        
        {/* Settings Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Game Mode Selector */}
          <div className="text-center">
            <h3 className="font-semibold text-gray-700 mb-2">Game Mode</h3>
            <div className="flex flex-wrap justify-center gap-1">
              {['classic', 'time-attack', 'power-ups'].map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setGameMode(mode);
                    resetGame();
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all text-sm ${
                    gameMode === mode 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* AI Settings */}
          <div className="text-center">
            <h3 className="font-semibold text-gray-700 mb-2">AI Mode</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-center gap-2">
                <input
                  type="checkbox"
                  checked={aiMode}
                  onChange={(e) => {
                    setAiMode(e.target.checked);
                    resetGame();
                  }}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Play vs AI</span>
              </label>
              {aiMode && (
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="px-3 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium text-sm shadow-sm hover:border-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                >
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              )}
            </div>
          </div>

          {/* Theme Selector */}
          <div className="text-center">
            <h3 className="font-semibold text-gray-700 mb-2">Theme</h3>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="px-3 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:border-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
            >
              <option value="gradient">🌈 Gradient</option>
              <option value="dark">🌙 Dark</option>
              <option value="ocean">🌊 Ocean</option>
              <option value="forest">🌲 Forest</option>
            </select>
          </div>
        </div>

        {/* Board Size Selector */}
        <div className="flex justify-center gap-2 mb-6">
          <span className="self-center font-semibold text-gray-700 mr-2">Board Size:</span>
          {[3, 4, 5].map(size => (
            <button
              key={size}
              onClick={() => changeBoardSize(size)}
              className={`px-3 py-1 rounded font-semibold ${
                boardSize === size 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {size}×{size}
            </button>
          ))}
        </div>

        {/* Timer (Time Attack Mode) */}
        {gameMode === 'time-attack' && (
          <div className="text-center mb-4">
            <div className={`text-3xl font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
              ⏰ {timeLeft}s
            </div>
          </div>
        )}

        {/* Power-ups (Power-ups Mode) */}
        {gameMode === 'power-ups' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="font-bold text-blue-600 mb-2">Player X Powers</div>
              <div className="flex gap-1 justify-center flex-wrap">
                <button
                  onClick={() => handlePowerUp('freeze')}
                  disabled={powerUps.X.freeze === 0 || !isXNext || (aiMode && !isXNext)}
                  className="px-2 py-1 bg-blue-500 text-white rounded disabled:opacity-30 hover:bg-blue-600 text-sm"
                >
                  ❄️ ({powerUps.X.freeze})
                </button>
                <button
                  onClick={() => handlePowerUp('double')}
                  disabled={powerUps.X.double === 0 || !isXNext || (aiMode && !isXNext)}
                  className="px-2 py-1 bg-blue-500 text-white rounded disabled:opacity-30 hover:bg-blue-600 text-sm"
                >
                  ⚡ ({powerUps.X.double})
                </button>
                <button
                  onClick={() => handlePowerUp('bomb')}
                  disabled={powerUps.X.bomb === 0 || !isXNext || (aiMode && !isXNext)}
                  className="px-2 py-1 bg-blue-500 text-white rounded disabled:opacity-30 hover:bg-blue-600 text-sm"
                >
                  💣 ({powerUps.X.bomb})
                </button>
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600 mb-2">{aiMode ? 'AI' : 'Player O'} Powers</div>
              <div className="flex gap-1 justify-center flex-wrap">
                <button
                  onClick={() => handlePowerUp('freeze')}
                  disabled={powerUps.O.freeze === 0 || isXNext || aiMode}
                  className="px-2 py-1 bg-red-500 text-white rounded disabled:opacity-30 hover:bg-red-600 text-sm"
                >
                  ❄️ ({powerUps.O.freeze})
                </button>
                <button
                  onClick={() => handlePowerUp('double')}
                  disabled={powerUps.O.double === 0 || isXNext || aiMode}
                  className="px-2 py-1 bg-red-500 text-white rounded disabled:opacity-30 hover:bg-red-600 text-sm"
                >
                  ⚡ ({powerUps.O.double})
                </button>
                <button
                  onClick={() => handlePowerUp('bomb')}
                  disabled={powerUps.O.bomb === 0 || isXNext || aiMode}
                  className="px-2 py-1 bg-red-500 text-white rounded disabled:opacity-30 hover:bg-red-600 text-sm"
                >
                  💣 ({powerUps.O.bomb})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Score Board and Stats */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-100 rounded-lg p-3 border border-blue-200">
              <div className="text-xl font-bold text-blue-600 mb-1">X</div>
              <div className="text-xl font-bold text-blue-800">{scores.X}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
              <div className="text-sm font-bold text-gray-600 mb-1">Draws</div>
              <div className="text-xl font-bold text-gray-800">{scores.draws}</div>
            </div>
            <div className="bg-red-100 rounded-lg p-3 border border-red-200">
              <div className="text-xl font-bold text-red-600 mb-1">{aiMode ? 'AI' : 'O'}</div>
              <div className="text-xl font-bold text-red-800">{scores.O}</div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="text-sm font-bold text-yellow-700 mb-1">Game Stats</div>
            <div className="text-xs text-yellow-600 space-y-1">
              <div>Total Games: {gameStats.totalGames}</div>
              <div>Win Streak: {gameStats.currentStreak} ({gameStats.streakPlayer || 'None'})</div>
              <div>Best Streak: {gameStats.longestWinStreak}</div>
            </div>
          </div>
        </div>

        {/* Game Status */}
        <div className="text-center mb-6">
          {winner ? (
            <div className="text-3xl font-bold text-green-600 animate-bounce">
              🎉 {aiMode && winner === 'O' ? 'AI' : `Player ${winner}`} Wins! 🎉
            </div>
          ) : isDraw ? (
            <div className="text-3xl font-bold text-orange-600">
              🤝 It&apos;s a Draw! 🤝
            </div>
          ) : (
            <div className={`text-xl font-semibold ${frozenPlayer === (isXNext ? 'X' : 'O') ? 'text-blue-400' : 'text-gray-700'}`}>
              {frozenPlayer === (isXNext ? 'X' : 'O') ? `❄️ ${isXNext ? 'Player X' : (aiMode ? 'AI' : 'Player O')} is Frozen!` : 
               doubleMove ? `⚡ ${isXNext ? 'Player X' : (aiMode ? 'AI' : 'Player O')} gets another turn!` :
               `${isXNext ? 'Player X' : (aiMode ? 'AI' : 'Player O')}&apos;s Turn${aiMode && !isXNext ? ' (Thinking...)' : ''}`}
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className="flex justify-center mb-6">
          <div className={`grid gap-2`} style={{gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`}}>
            {board.map((_, index) => renderSquare(index))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg"
          >
            New Game
          </button>
          <button
            onClick={() => {
              setScores({ X: 0, O: 0, draws: 0 });
              setGameStats({ totalGames: 0, longestWinStreak: 0, currentStreak: 0, streakPlayer: null });
            }}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-semibold"
          >
            Reset All
          </button>
          <button
            onClick={undoLastMove}
            disabled={moveHistory.length === 0 || aiMode}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-semibold disabled:opacity-50"
          >
            Undo Move
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-600 space-y-1">
          <p><strong>Classic:</strong> Traditional Tic Tac Toe • <strong>Time Attack:</strong> 10 seconds per turn!</p>
          <p><strong>Power-ups:</strong> ❄️ Freeze opponent • ⚡ Double move • 💣 Remove opponent piece</p>
          <p><strong>AI Mode:</strong> Challenge the computer at different difficulty levels!</p>
        </div>
      </div>
    </div>
  );
}