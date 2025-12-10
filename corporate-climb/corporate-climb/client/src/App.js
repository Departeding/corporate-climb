import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Auto-detect if we are local or in production
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:4000';

const socket = io(SOCKET_URL);

function App() {
  const [gameState, setGameState] = useState(null);
  const [menu, setMenu] = useState(true);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [myId, setMyId] = useState('');

  useEffect(() => {
    socket.on('connect', () => setMyId(socket.id));
    socket.on('game_started', (game) => { setGameState(game); setMenu(false); });
    socket.on('player_joined', (game) => setGameState(game));
    socket.on('update_state', (game) => setGameState(game));
    socket.on('cycle_results', (results) => alert("Performance Review:\n" + results.join('\n')));
  }, []);

  const createGame = (mode) => {
    socket.emit('create_game', { mode });
  };

  const joinGame = () => {
    if(roomIdInput) socket.emit('join_game', roomIdInput);
  };

  const performAction = (actionType) => {
    socket.emit('action', { roomId: gameState.roomId, actionType });
  };

  // --- RENDER MENU ---
  if (menu) {
    return (
      <div className="container menu">
        <h1>THE CORPORATE CLIMB</h1>
        <p>Up or Out. Choose your path.</p>
        <div className="card">
            <button onClick={() => createGame('SINGLE')}>Start Solo Career (vs Bots)</button>
            <div className="divider">OR</div>
            <button onClick={() => createGame('MULTIPLAYER')}>Create Multiplayer Room</button>
            <div className="join-section">
                <input 
                    type="text" 
                    placeholder="Enter Room Code" 
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                />
                <button onClick={joinGame}>Join Room</button>
            </div>
        </div>
      </div>
    );
  }

  // --- RENDER GAME ---
  const myPlayer = gameState.players[myId] || {};
  const stats = myPlayer.stats || { energy: 0, skill: 0, repSolid: 0, repFlash: 0, stress: 0 };
  const totalRep = stats.repSolid + stats.repFlash;

  return (
    <div className="container game">
      <header>
        <div className="status-bar">
            <span>Cycle: {Math.floor((gameState.turn - 1) / 12) + 1}</span>
            <span>Week: {gameState.turn}</span>
            <span>Room: {gameState.roomId}</span>
        </div>
      </header>
      
      <div className="main-grid">
        {/* LEFT: MY DASHBOARD */}
        <div className="card dashboard">
            <h2>{myPlayer.role}</h2>
            <p className="subtitle">{myPlayer.dept} Department</p>
            
            <div className="stats-grid">
                <div className="stat-box"><strong>Energy</strong>{stats.energy}/100</div>
                <div className="stat-box"><strong>Stress</strong>{stats.stress}%</div>
                <div className="stat-box"><strong>Skill</strong>{stats.skill}</div>
                <div className="stat-box"><strong>Rep</strong>{totalRep}</div>
            </div>

            <div className="actions">
                <h3>Actions</h3>
                <button onClick={() => performAction('WORK_HARD')} disabled={stats.energy < 30}>
                    Grind (Work Hard) <span className="cost">-30 AP</span>
                </button>
                <button onClick={() => performAction('TAKE_CREDIT')} disabled={stats.energy < 20}>
                    Steal Credit <span className="cost">-20 AP</span>
                </button>
                <button onClick={() => performAction('SLACK_OFF')}>
                    Slack Off <span className="cost">Heal Stress</span>
                </button>
            </div>
        </div>

        {/* RIGHT: THE OFFICE FLOOR */}
        <div className="card office">
            <h3>The Office Floor</h3>
            <div className="peers-list">
                {Object.values(gameState.players).map(p => (
                    <div key={p.id} className={`peer-card ${p.id === myId ? 'me' : ''} ${p.status === 'FIRED' ? 'fired' : ''}`}>
                        <div className="peer-header">
                            <strong>{p.type === 'Bot' ? p.id : (p.id === myId ? "YOU" : "Player")}</strong>
                            <span className="role-badge">{p.role}</span>
                        </div>
                        {p.status === 'FIRED' ? (
                            <div className="fired-stamp">FIRED</div>
                        ) : (
                            <div className="peer-stats">
                                Est. Rep: {p.stats.repFlash > 30 ? "High" : "Avg"}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;