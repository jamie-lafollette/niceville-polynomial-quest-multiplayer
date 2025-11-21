import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { questions } from './questions';
import './App.css';

function App() {
  const [view, setView] = useState('home'); // 'home', 'create', 'join', 'lobby', 'game', 'results'
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameData, setGameData] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [textAnswer, setTextAnswer] = useState('');

  // Generate random game code
  const generateGameCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create new game
  const createGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }

    const code = generateGameCode();
    const playerId = Date.now().toString();
    
    const gameRef = doc(db, 'games', code);
    await setDoc(gameRef, {
      code: code,
      host: playerId,
      players: [{
        id: playerId,
        name: playerName,
        score: 0,
        ready: false
      }],
      status: 'lobby', // 'lobby', 'playing', 'finished'
      currentQuestion: 0,
      questionStartTime: null,
      usedQuestions: []
    });

    setGameCode(code);
    setCurrentPlayerId(playerId);
    setView('lobby');
  };

  // Join existing game
  const joinGame = async () => {
    if (!playerName.trim() || !gameCode.trim()) {
      alert('Please enter your name and game code!');
      return;
    }

    const gameRef = doc(db, 'games', gameCode.toUpperCase());
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      alert('Game not found!');
      return;
    }

    const game = gameSnap.data();
    
    if (game.status !== 'lobby') {
      alert('Game has already started!');
      return;
    }

    if (game.players.length >= 4) {
      alert('Game is full (max 4 players)!');
      return;
    }

    const playerId = Date.now().toString();
    
    await updateDoc(gameRef, {
      players: arrayUnion({
        id: playerId,
        name: playerName,
        score: 0,
        ready: false
      })
    });

    setGameCode(gameCode.toUpperCase());
    setCurrentPlayerId(playerId);
    setView('lobby');
  };

  // Listen to game updates
  useEffect(() => {
    if (!gameCode) return;

    const gameRef = doc(db, 'games', gameCode);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGameData(data);

        // Auto-transition to game view when host starts
        if (data.status === 'playing' && view === 'lobby') {
          setView('game');
        }

        // Handle timer
        if (data.status === 'playing' && data.questionStartTime) {
          const elapsed = Math.floor((Date.now() - data.questionStartTime) / 1000);
          const remaining = Math.max(0, 180 - elapsed);
          setTimeRemaining(remaining);
        }
      }
    });

    return () => unsubscribe();
  }, [gameCode, view]);

  // Timer countdown
  useEffect(() => {
    if (view !== 'game' || !gameData || gameData.status !== 'playing') return;

    const interval = setInterval(() => {
      if (gameData.questionStartTime) {
        const elapsed = Math.floor((Date.now() - gameData.questionStartTime) / 1000);
        const remaining = Math.max(0, 180 - elapsed);
        setTimeRemaining(remaining);

        // Auto-submit when time runs out
        if (remaining === 0) {
          submitAnswer(true); // auto-submit
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [view, gameData]);

  // Start game (host only)
  const startGame = async () => {
    const gameRef = doc(db, 'games', gameCode);
    
    // Pick first random question
    const questionIdx = Math.floor(Math.random() * questions.length);
    
    await updateDoc(gameRef, {
      status: 'playing',
      currentQuestion: 0,
      currentQuestionIdx: questionIdx,
      questionStartTime: Date.now(),
      usedQuestions: [questionIdx],
      answers: {}
    });
  };

  // Submit answer
  const submitAnswer = async (isAutoSubmit = false) => {
    const gameRef = doc(db, 'games', gameCode);
    const currentQuestion = questions[gameData.currentQuestionIdx];
    
    let isCorrect = false;
    const submissionTime = Date.now() - gameData.questionStartTime;
    
    if (currentQuestion.type === 'multiple' && selectedAnswer !== null) {
      isCorrect = (selectedAnswer.sort().join(',') === currentQuestion.correct.sort().join(','));
    } else if (currentQuestion.type === 'short_text' && textAnswer.trim()) {
      const normalized = textAnswer.trim().toLowerCase();
      isCorrect = currentQuestion.correct_answer.some(ans => ans.toLowerCase() === normalized);
    }

    // Calculate points: 1 point for correct, +1 bonus if answered within 60 seconds
    let points = 0;
    if (isCorrect) {
      points = 1;
      if (submissionTime < 60000) { // 60 seconds
        points = 2;
      }
    }

    // Update player score
    const updatedPlayers = gameData.players.map(p => {
      if (p.id === currentPlayerId) {
        return { ...p, score: p.score + points };
      }
      return p;
    });

    // Record answer
    const answerKey = `answers.${currentPlayerId}`;
    await updateDoc(gameRef, {
      players: updatedPlayers,
      [answerKey]: {
        answer: selectedAnswer || textAnswer,
        correct: isCorrect,
        points: points,
        time: submissionTime
      }
    });

    // Reset for next question
    setSelectedAnswer(null);
    setTextAnswer('');
  };

  // Next question (host only)
  const nextQuestion = async () => {
    const gameRef = doc(db, 'games', gameCode);
    
    // Get available questions
    const availableQuestions = questions
      .map((_, idx) => idx)
      .filter(idx => !gameData.usedQuestions.includes(idx));

    if (availableQuestions.length === 0) {
      // Game over
      await updateDoc(gameRef, {
        status: 'finished'
      });
      setView('results');
      return;
    }

    const questionIdx = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    
    await updateDoc(gameRef, {
      currentQuestion: gameData.currentQuestion + 1,
      currentQuestionIdx: questionIdx,
      questionStartTime: Date.now(),
      usedQuestions: [...gameData.usedQuestions, questionIdx],
      answers: {}
    });
  };

  // Render functions
  const renderHome = () => (
    <div className="container">
      <h1>🦅 Niceville Polynomial Quest 🦅</h1>
      <h2>Multiplayer Mode</h2>
      <div className="button-group">
        <button onClick={() => setView('create')} className="btn-primary">Create Game</button>
        <button onClick={() => setView('join')} className="btn-secondary">Join Game</button>
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="container">
      <h2>Create New Game</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        className="input"
      />
      <div className="button-group">
        <button onClick={createGame} className="btn-primary">Create Game</button>
        <button onClick={() => setView('home')} className="btn-secondary">Back</button>
      </div>
    </div>
  );

  const renderJoin = () => (
    <div className="container">
      <h2>Join Game</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        className="input"
      />
      <input
        type="text"
        placeholder="Enter game code"
        value={gameCode}
        onChange={(e) => setGameCode(e.target.value.toUpperCase())}
        className="input"
      />
      <div className="button-group">
        <button onClick={joinGame} className="btn-primary">Join Game</button>
        <button onClick={() => setView('home')} className="btn-secondary">Back</button>
      </div>
    </div>
  );

  const renderLobby = () => (
    <div className="container">
      <h2>Game Lobby</h2>
      <div className="game-code">
        <p>Game Code:</p>
        <h1>{gameCode}</h1>
        <p className="hint">Share this code with other players</p>
      </div>
      
      <div className="players-list">
        <h3>Players ({gameData?.players.length || 0}/4)</h3>
        {gameData?.players.map((player, idx) => (
          <div key={player.id} className="player-item">
            {idx + 1}. {player.name} {player.id === gameData.host && '👑'}
          </div>
        ))}
      </div>

      {currentPlayerId === gameData?.host && (
        <button 
          onClick={startGame} 
          className="btn-primary"
          disabled={gameData?.players.length < 2}
        >
          {gameData?.players.length < 2 ? 'Waiting for players...' : 'Start Game'}
        </button>
      )}

      {currentPlayerId !== gameData?.host && (
        <p className="hint">Waiting for host to start the game...</p>
      )}
    </div>
  );

  const renderGame = () => {
    if (!gameData || !gameData.currentQuestionIdx === undefined) return null;

    const question = questions[gameData.currentQuestionIdx];
    const hasAnswered = gameData.answers && gameData.answers[currentPlayerId];
    const allAnswered = gameData.players.every(p => gameData.answers && gameData.answers[p.id]);

    return (
      <div className="container game-view">
        <div className="game-header">
          <h3>Question {gameData.currentQuestion + 1} / {questions.length}</h3>
          <div className={`timer ${timeRemaining < 30 ? 'timer-warning' : ''}`}>
            ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="question-box">
          <h2>{question.question}</h2>

          {!hasAnswered && (
            <>
              {question.type === 'multiple' && (
                <div className="choices">
                  {question.choices.map((choice, idx) => (
                    <label key={idx} className="choice-label">
                      <input
                        type="checkbox"
                        checked={selectedAnswer?.includes(idx) || false}
                        onChange={() => {
                          const current = selectedAnswer || [];
                          if (current.includes(idx)) {
                            setSelectedAnswer(current.filter(i => i !== idx));
                          } else {
                            setSelectedAnswer([...current, idx]);
                          }
                        }}
                      />
                      {choice}
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'short_text' && (
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer"
                  className="input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') submitAnswer();
                  }}
                />
              )}

              <button onClick={() => submitAnswer()} className="btn-primary">
                Submit Answer
              </button>
            </>
          )}

          {hasAnswered && (
            <div className="answered-message">
              <h3>✅ Answer Submitted!</h3>
              <p>
                {gameData.answers[currentPlayerId].correct ? (
                  <>Correct! You earned {gameData.answers[currentPlayerId].points} point(s)! 🎉</>
                ) : (
                  <>Incorrect. Better luck on the next question! 💪</>
                )}
              </p>
              {currentPlayerId === gameData.host ? (
                <button 
                  onClick={nextQuestion} 
                  className="btn-primary"
                  disabled={!allAnswered && timeRemaining > 0}
                >
                  {allAnswered || timeRemaining === 0 ? 'Next Question' : 'Waiting for others...'}
                </button>
              ) : (
                <p className="hint">Waiting for host to continue...</p>
              )}
            </div>
          )}
        </div>

        <div className="scoreboard">
          <h3>Scoreboard</h3>
          {[...gameData.players]
            .sort((a, b) => b.score - a.score)
            .map((player, idx) => (
              <div key={player.id} className="score-item">
                <span>#{idx + 1} {player.name}</span>
                <span className="score">{player.score} pts</span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const sortedPlayers = [...(gameData?.players || [])]
      .sort((a, b) => b.score - a.score);

    return (
      <div className="container">
        <h1>🏆 Final Results 🏆</h1>
        <div className="results-list">
          {sortedPlayers.map((player, idx) => (
            <div key={player.id} className={`result-item ${idx === 0 ? 'winner' : ''}`}>
              <span className="rank">#{idx + 1}</span>
              <span className="name">{player.name}</span>
              <span className="score">{player.score} points</span>
            </div>
          ))}
        </div>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Play Again
        </button>
      </div>
    );
  };

  // Main render
  if (view === 'home') return renderHome();
  if (view === 'create') return renderCreate();
  if (view === 'join') return renderJoin();
  if (view === 'lobby') return renderLobby();
  if (view === 'game') return renderGame();
  if (view === 'results') return renderResults();

  return null;
}

export default App;