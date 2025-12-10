import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Connect to backend (Change URL for production)
const socket = io('http://localhost:4000'); 

function App() {
  const [gameState, setGameState] = useState(null);
  const [menu, setMenu] = useState(true);

  useEffect(() => {
    socket.on('game_started', (game) => { setGameState(game); setMenu(false); });
    socket.on('update_state', (game) => setGameState(game));
    socket.on('player_joined', (game) => setGameState(game));
  }, []);

  const createGame = (mode) => {
    socket.emit('create_game', { mode });
  };

  const performAction = (actionType) => {
    socket.emit('action', { roomId: gameState.roomId, actionType });
  };

  if (menu) {
    return (
      <div style={{textAlign: 'center', marginTop: '50px'}}>
        <h1>The Corporate Climb</h1>
        <button onClick={() => createGame('SINGLE')}>Play Solo (vs Bots)</button>
        <button onClick={() => createGame('MULTIPLAYER')}>Create Multiplayer Room</button>
      </div>
    );
  }

  // Find My Stats
  const myStats = gameState.players[socket.id]?.stats || {};

  return (
    <div style={{padding: '20px'}}>
      <h2>Week {gameState.turn} | Room: {gameState.roomId}</h2>
      
      <div style={{border: '1px solid #ccc', padding: '10px', marginBottom: '20px'}}>
        <h3>My Dashboard</h3>
        <p>Energy: {myStats.energy} | Skill: {myStats.skill} | Rep: {myStats.repSolid + myStats.repFlash}</p>
        <button onClick={() => performAction('WORK_HARD')}>Grind (Work Hard)</button>
        <button onClick={() => performAction('TAKE_CREDIT')}>Steal Credit</button>
      </div>

      <h3>Office Floor (Peers)</h3>
      <div style={{display: 'flex', gap: '10px'}}>
        {Object.values(gameState.players).map(p => (
            <div key={p.id} style={{border: '1px solid black', padding: '10px', background: p.id === socket.id ? '#e0f7fa' : 'white'}}>
                <strong>{p.type === 'Bot' ? p.id : 'Player'}</strong><br/>
                Role: {p.role}<br/>
                Status: {p.stats.repFlash > 50 ? "Rising Star" : "Average"}
            </div>
        ))}
      </div>
    </div>
  );
}

export default App;