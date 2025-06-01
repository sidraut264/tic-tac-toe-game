"use client";

import { useState, useEffect } from 'react';

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  useEffect(() => {
    const checkWinner = (squares) => {
      for (let line of winningLines) {
        const [a, b, c] = line;
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
          return squares[a];
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
      setScores(prev => ({
        ...prev,
        [gameWinner]: prev[gameWinner] + 1
      }));
    } else if (gameDraw && !gameWinner) {
      setIsDraw(true);
      setScores(prev => ({
        ...prev,
        draws: prev.draws + 1
      }));
    }
  }, [board]);

  const handleClick = (index) => {
    if (board[index] || winner || isDraw) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setIsDraw(false);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0, draws: 0 });
  };

  const renderSquare = (index) => {
    return (
      <button
        key={index}
        className={`
          w-20 h-20 border-2 border-gray-400 bg-white text-4xl font-bold
          hover:bg-gray-50 transition-colors duration-200
          ${board[index] === 'X' ? 'text-blue-600' : 'text-red-600'}
          ${!board[index] && !winner && !isDraw ? 'cursor-pointer' : 'cursor-default'}
        `}
        onClick={() => handleClick(index)}
      >
        {board[index]}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Tic Tac Toe
        </h1>
        
        {/* Score Board */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div className="bg-blue-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">X</div>
            <div className="text-lg">{scores.X}</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-600">Draws</div>
            <div className="text-lg">{scores.draws}</div>
          </div>
          <div className="bg-red-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-600">O</div>
            <div className="text-lg">{scores.O}</div>
          </div>
        </div>

        {/* Game Status */}
        <div className="text-center mb-6">
          {winner ? (
            <div className="text-2xl font-bold text-green-600">
              🎉 Player {winner} Wins! 🎉
            </div>
          ) : isDraw ? (
            <div className="text-2xl font-bold text-orange-600">
              🤝 It's a Draw! 🤝
            </div>
          ) : (
            <div className="text-xl font-semibold text-gray-700">
              Player {isXNext ? 'X' : 'O'}'s Turn
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-3 gap-2 mb-6 justify-center">
          {Array(9).fill(null).map((_, index) => renderSquare(index))}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
          >
            New Game
          </button>
          <button
            onClick={resetScores}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-semibold"
          >
            Reset Scores
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Click on any empty square to make your move!</p>
          <p className="mt-1">X goes first, then alternate turns.</p>
        </div>
      </div>
    </div>
  );
}