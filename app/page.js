"use client";

import { useState, useEffect } from 'react';

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [gameMode, setGameMode] = useState('classic'); // classic, time-attack, power-ups
  const [timeLeft, setTimeLeft] = useState(10);
  const [isTimeRunning, setIsTimeRunning] = useState(false);
  const [powerUps, setPowerUps] = useState({ X: { freeze: 1, double: 1 }, O: { freeze: 1, double: 1 } });
  const [frozenPlayer, setFrozenPlayer] = useState(null);
  const [doubleMove, setDoubleMove] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [winningLine, setWinningLine] = useState([]);
  const [boardSize, setBoardSize] = useState(3); // 3x3, 4x4, 5x5
  const [particles, setParticles] = useState([]);

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

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimeRunning && timeLeft > 0 && !winner && !isDraw && gameMode === 'time-attack') {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsXNext(!isXNext);
            return 10;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimeRunning, timeLeft, winner, isDraw, gameMode, isXNext]);

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
      createWinParticles();
    } else if (gameDraw && !gameWinner) {
      setIsDraw(true);
      setIsTimeRunning(false);
      setScores(prev => ({
        ...prev,
        draws: prev.draws + 1
      }));
    }
  }, [board, boardSize]);

  const createWinParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: winner === 'X' ? 'blue' : 'red'
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 3000);
  };

  const handleClick = (index) => {
    if (board[index] || winner || isDraw) return;
    if (frozenPlayer === (isXNext ? 'X' : 'O')) return;

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

  const usePowerUp = (type) => {
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
      setPowerUps({ X: { freeze: 1, double: 1 }, O: { freeze: 1, double: 1 } });
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
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`absolute w-2 h-2 rounded-full animate-bounce bg-${particle.color}-400`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Ultimate Tic Tac Toe
        </h1>
        
        {/* Game Mode Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {['classic', 'time-attack', 'power-ups'].map(mode => (
            <button
              key={mode}
              onClick={() => {
                setGameMode(mode);
                resetGame();
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                gameMode === mode 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Board Size Selector */}
        <div className="flex justify-center gap-2 mb-6">
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
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => usePowerUp('freeze')}
                  disabled={powerUps.X.freeze === 0 || !isXNext}
                  className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-30 hover:bg-blue-600"
                >
                  ❄️ Freeze ({powerUps.X.freeze})
                </button>
                <button
                  onClick={() => usePowerUp('double')}
                  disabled={powerUps.X.double === 0 || !isXNext}
                  className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-30 hover:bg-blue-600"
                >
                  ⚡ Double ({powerUps.X.double})
                </button>
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600 mb-2">Player O Powers</div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => usePowerUp('freeze')}
                  disabled={powerUps.O.freeze === 0 || isXNext}
                  className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-30 hover:bg-red-600"
                >
                  ❄️ Freeze ({powerUps.O.freeze})
                </button>
                <button
                  onClick={() => usePowerUp('double')}
                  disabled={powerUps.O.double === 0 || isXNext}
                  className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-30 hover:bg-red-600"
                >
                  ⚡ Double ({powerUps.O.double})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Score Board */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div className="bg-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600 mb-1">X</div>
            <div className="text-2xl font-bold text-blue-800">{scores.X}</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="text-lg font-bold text-gray-600 mb-1">Draws</div>
            <div className="text-2xl font-bold text-gray-800">{scores.draws}</div>
          </div>
          <div className="bg-red-100 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600 mb-1">O</div>
            <div className="text-2xl font-bold text-red-800">{scores.O}</div>
          </div>
        </div>

        {/* Game Status */}
        <div className="text-center mb-6">
          {winner ? (
            <div className="text-3xl font-bold text-green-600 animate-bounce">
              🎉 Player {winner} Wins! 🎉
            </div>
          ) : isDraw ? (
            <div className="text-3xl font-bold text-orange-600">
              🤝 It&apos;s a Draw! 🤝
            </div>
          ) : (
            <div className={`text-xl font-semibold ${frozenPlayer === (isXNext ? 'X' : 'O') ? 'text-blue-400' : 'text-gray-700'}`}>
              {frozenPlayer === (isXNext ? 'X' : 'O') ? `❄️ Player ${isXNext ? 'X' : 'O'} is Frozen!` : 
               doubleMove ? `⚡ Player ${isXNext ? 'X' : 'O'} gets another turn!` :
               `Player ${isXNext ? 'X' : 'O'}&apos;s Turn`}
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
            onClick={() => setScores({ X: 0, O: 0, draws: 0 })}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-semibold"
          >
            Reset Scores
          </button>
          <button
            onClick={undoLastMove}
            disabled={moveHistory.length === 0}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-semibold disabled:opacity-50"
          >
            Undo Move
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-600 space-y-1">
          <p><strong>Classic:</strong> Traditional Tic Tac Toe</p>
          <p><strong>Time Attack:</strong> 10 seconds per turn!</p>
          <p><strong>Power-ups:</strong> Freeze opponent or get double moves!</p>
          <p>Try different board sizes for extra challenge!</p>
        </div>
      </div>
    </div>
  );
}