const express = require('express');
const { exists } = require('fs');
const path = require('path')
const app = express()
const server = require('http').createServer(app);
const WebSocket = require('ws')
const Questions = require('./questions')
// const Q = require('./questions')
// let Questions = Q

const wss = new WebSocket.Server({ server })

app.use((req, res, next) => {
  console.log('a request happened')
  next()
})

let gameState = {
  status: 'lobby',
  turn: 0,
  round: 0,
  players: [], // {name, score, status, guid}
  time: 0,
  question: '',
  correct: ''
}

let host = null

let players = [] // {name guid, ws}

// let round = {
//   it: 0,
//   players: [], //{name, answer, votes}
//   state: 'answering',
// }

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
      case 'test':
        setTestGameState()
        break;
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
      case 'answer':
        answerHandler(m, ws)
        break
      case 'guesses':
        guessHandler(m, ws)
        break
      case 'correct':
        correctHandler(m, ws)
        break
      case 'score':
        calculateScore(m, ws)
        break
      default:
        break
    }

  });

  ws.on('close', function closing(connection) {
    console.log(`Connection is closing`, connection)
  });
});

function calculateScore (m, ws) {
  let correct = gameState.players[gameState.turn].correct
  let winner = indexOfStatePlayer(correct)
  gameState.players[winner].score += 10
  gameState.players.forEach((e, i) => {
    if (i !== gameState.turn) {
      if (e.guesses[0] === correct) {
        e.score += 4
      }
      if (e.guesses[1] === correct) {
        e.score += 4
      }
    }
  })
  updateHost()
  nextTurn()
}

function guessHandler (m, ws) {
  const i = indexOfStatePlayer(m.guid)
  gameState.players[i].guesses = m.guesses
  gameState.players[i].status = 'waiting'
  ws.send(JSON.stringify({
    type: 'status-update',
    status: 'waiting'
  }))

  checkAllGuesses()
}

function correctHandler (m, ws) {
  const i = indexOfStatePlayer(m.guid)
  gameState.players[i].correct = m.correct
  gameState.players[i].status = 'waiting'
  gameState.correct = m.correct
  ws.send(JSON.stringify({
    type: 'status-update',
    status: 'waiting'
  }))

  checkAllGuesses()
}

function checkAllGuesses() {
  console.log('checking guesses')
  console.log(gameState)
  let ready = true
  for (let i = 0; i < gameState.players.length; i++) {
    if (gameState.players[i].status !== 'waiting') {
      ready = false
    }
  }
  if (ready) {
    gameState.status = 'reveal'
    gameState.players.forEach(e => {
      if (e.correct === '') {
        console.log(e.guesses)
        let p = indexOfStatePlayer(e.guesses[0])
        gameState.players[p].votes.push(e.color)
        p = indexOfStatePlayer(e.guesses[1])
        gameState.players[p].votes.push(e.color)
      }
    })
  }
  updateHost()
}

function updateHost () {
  if (!host) {
    return
  }
  console.log('update host')
  console.log(gameState)
  host.send(JSON.stringify({
    type: 'update',
    gameState
  }))
}

function updatePlayersState () {
  players.forEach(e => {
    e.ws.send(JSON.stringify({
      type: 'status-update',
      status: gameState.players[
        indexOfStatePlayer(e.guid)
      ].status
    }))
  })
}

function sendVotingPhase () {
  players.forEach(e => {
    e.ws.send(JSON.stringify({
      type: 'vote',
      status: gameState.players[
        indexOfStatePlayer(e.guid)
      ].status,
      players: gameState.players
    }))
  })
}

function indexOfPlayer (guid) {
  return players.findIndex(e => e.guid === guid)
}

function indexOfStatePlayer (guid) {
  return gameState.players.findIndex(e => e.guid === guid)
}

function returningHandler (m, ws) {
  const player = indexOfStatePlayer(m.guid)
  if (player !== -1) {
    players[indexOfPlayer(gameState.players[player].guid)].ws = ws
    ws.send(JSON.stringify({
      type: 'reconnect',
      name: gameState.players[player].name,
      status: gameState.players[player].status,
      color: gameState.players[player].color
    }))

    if (gameState.status === 'vote') {
      sendVotingPhase()
    }
  }
}

function checkAllAnswers () {
  for (let i = 0; i < gameState.players.length; i++) {
    if (
      gameState.players[i].answer === '' &&
      gameState.players[i].status !== 'it'
    ) {
      return false
    }
  }
  return true
}

function answerExists (answer) {
  let exists = false
  gameState.players.forEach(e => {
    if (e.answer.toLowerCase() == answer.toLowerCase())
      exists = true
  })
  return exists
}

function answerHandler (m, ws) {
  if (answerExists()) {
    ws.send(JSON.stringify({
      type: 'input-error',
      message: 'Too close to another answer'
    }))
  }

  let stateIndex = indexOfStatePlayer(m.guid)
  let index = indexOfPlayer(m.guid)
  if (index !== -1) {
    gameState.players[stateIndex].answer = m.answer
    gameState.players[stateIndex].status = 'waiting'
    ws.send(JSON.stringify({
      type: 'status-update',
      status: 'waiting'
    }))
    
    if (checkAllAnswers()) {
      gameState.status = 'vote'
      gameState.players.forEach(e => {
        if (e.status === 'it') {
          e.status = 'vote-correct'
        } else {
          e.status = 'vote-guess'
        }
      })
      sendVotingPhase()
    }
    updateHost()
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
    color: m.color,
    guid,
    answer: '',
    guesses: ['', ''],
    correct: '',
    votes: []
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
  gameState.round = 1
  gameState.players[gameState.turn].status = 'it'
  gameState.status = 'question'
  gameState.players.forEach((e, i) => {
    if (i !== gameState.turn) {
      e.status = 'question'
      e.guesses = ['', '']
      e.correct = ''
    }
  })
  gameState.question = getRandomQuestion().q
  .replace(
    '%%',
    gameState.players[gameState.turn].name
  )
  console.log(gameState)
  updatePlayersState()
  updateHost()
}

function nextTurn () {
  gameState.turn += 1
  if (gameState.turn === gameState.players.length) {
    gameState.turn = 0
    gameState.round += 1
  }
  gameState.players[gameState.turn].status = 'it'
  gameState.status = 'question'
  gameState.players.forEach((e, i) => {
    if (i !== gameState.turn) {
      e.status = 'question'
    }
    e.answer = ''
    e.guesses = ['', '']
    e.correct = ''
    e.votes = []
  })
  gameState.question = getRandomQuestion().q
  .replace(
    '%%',
    gameState.players[gameState.turn].name
  )
  updatePlayersState()
  updateHost()
}

function getRandomQuestion() {
  let question = { u: true }
  let r = 0
  while (question.u === true) {
    console.log('finding question')
    r = getRandomArray(Questions.length)
    question = Questions[r]
  }
  Questions[r].u = true
  return question
}

function getRandomArray(length) {
  return Math.floor(Math.random() * length)
}

function guidGenerator() {
  var S4 = function() {
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  // return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  return (S4()+'-'+S4());
}

app.use(express.static(path.join(__dirname, 'dist')))

server.listen(3000, () => console.log(`Lisening on port :3000`))

function setTestGameState () {
  gameState = {
    status: 'reveal',
    turn: 1,
    round: 1,
    players: [
      {
        name: 'Joosh ',
        score: 0,
        status: 'waiting',
        color: 'green lighten-1',
        guid: '6437-e4d6',
        answer: '🧀🧀🧀🧀🧀🧀 ____________________          \\             /            \\         /              \\😬/                  l                  l                  l                / \\              /     \\            /         \\',
        guesses: [Array],
        correct: '',
        votes: ''
      },
      {
        name: 'Grace',
        score: 4,
        status: 'waiting',
        color: 'blue lighten-1',
        guid: 'cff1-ce20',
        answer: '',
        guesses: [Array],
        correct: '3a5f-626d',
        votes: ''
      },
      {
        name: 'Dee',
        score: 0,
        status: 'waiting',
        color: 'purple lighten-1',
        guid: '008e-a23d',
        answer: 'MONGOLIAN BEEF!',
        guesses: [Array],
        correct: '',
        votes: ''
      },
      {
        name: 'Angela ',
        score: 0,
        status: 'waiting',
        color: 'amber lighten-1',
        guid: 'e71e-8903',
        answer: 'Mac n cheese ',
        guesses: [Array],
        correct: '',
        votes: ''
      },
      {
        name: 'G$',
        score: 0,
        status: 'waiting',
        color: 'grey',
        guid: '3a5f-626d',
        answer: 'Mac and cheese',
        guesses: [Array],
        correct: '',
        votes: ''
      },
      {
        name: 'Jacob',
        score: 10,
        status: 'waiting',
        color: 'grey',
        guid: '324e-eb9d',
        answer: 'Korean',
        guesses: [Array],
        correct: '',
        votes: ''
      },
      {
        name: 'Momme’',
        score: 0,
        status: 'waiting',
        color: 'blue lighten-1',
        guid: 'ce8b-f71f',
        answer: 'Amazing Grace sandwiches ',
        guesses: [Array],
        correct: '',
        votes: ''
      }
    ],
    time: 0,
    question: 'If Grace opened a restaurant what kind of food would they serve?',
    correct: '3a5f-626d'
  }
  updateHost()
}