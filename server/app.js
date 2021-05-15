const e = require('express');
const express = require('express')
const app = express()
const server = require('http').createServer(app);
const WebSocket = require('ws')

const wss = new WebSocket.Server({ server })

let gameState = {
  state: 'lobby',
  turn: 0,
  round: 0,
  players: [], // {name, score, status, ws, guid}
  time: 0,
}

let host = null

let players = []

let round = {
  it: 0,
  players: [], //{name, answer, votes}
  state: 'answering',
}

wss.on('connection', function connection(ws) {
  console.log('new connection')
  ws.on('message', function incoming(message) {
    // ws.send('got your message')
    let m = ''
    try {
      m = JSON.parse(message)
      console.log(m.type)
    } catch (error) {
      console.log(error)
      m = { type: 'error', message: 'Could not parse message' }
    }
    
    switch (m.type) {
      case 'error':
        ws.send({ error: m.message })
        break
      case 'host':
        host = ws
        updateHost()
        break
      case 'returning':
        returningHandler(m, ws)
        break
      case 'name':
        nameHandler(m, ws)
        break
      case 'start-game':
        startGameHandler(m, ws)
        break
      default:
        break
    }

  });

  ws.on('close', function closing(connection) {
    console.log(`Connection is closing`, connection)
  });
});

function updateHost () {
  if (!host) {
    return
  }
  host.send(JSON.stringify({
    type: 'update',
    gameState
  }))
}

function updatePlayersState () {
  players.forEach(e => {
    e.ws.send(JSON.stringify({
      type: 'status-update',
      // status: e.status
      status: 'other'
    }))
  })
}


function returningHandler (m, ws) {
  const player = gameState.players.findIndex(e => e.guid === m.guid)
  if (player !== -1) {
    players[player].ws = ws
    ws.send(JSON.stringify({
      type: 'reconnect',
      name: gameState.players[player].name,
      status: gameState.players[player].status
    }))
  }
}

function nameHandler (m, ws) {
  
  if (players.findIndex(e => e.name === m.name) !== -1) {
    ws.send(JSON.stringify({
      type: 'input-error',
      message: 'Name already exists'
    }))
    return
  }
  
  const guid = guidGenerator()
  
  gameState.players.push({
    name: m.name,
    score: 0,
    status: 'waiting',
    guid
  })
  
  players.push({
    guid,
    ws,
    name: m.name
  })
  
  ws.send(JSON.stringify({
    type: 'player-added',
    status: 'waiting',
    guid
  }))
  updateHost()
}

function startGameHandler (m, ws) {
  gameState.state = 'question'
  gameState.round = 1
  updatePlayersState()
  updateHost()
}

function guidGenerator() {
  var S4 = function() {
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  // return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  return (S4()+'-'+S4());
}

app.get('/', (req, res) => res.send('Hello World!'))

server.listen(3000, () => console.log(`Lisening on port :3000`))