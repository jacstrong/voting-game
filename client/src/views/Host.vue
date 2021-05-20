<template>
  <v-container fill-height fluid>
    <v-sheet
      height="100%"
      width="100%"
      color="grey"
      class="pa-4"
    >
      <v-container fill-height fluid>
        <v-row class="fill-height">
          <v-col cols="3" fill-height>
            <v-card>
              <v-card-title primary-title>
                Players
              </v-card-title>
            </v-card>
            <v-card
              v-for="player in gameState.players"
              :key="player.name"
              :class="`mt-1 ${player.status === 'waiting' ? player.color : ''}`"
            >
              <v-card-text class="pa-2">
                {{player.score + ' ' + player.name}}
              </v-card-text>
            </v-card>
            <v-card class="mt-1">
              <v-card-text>
                Status: {{gameState.status}}
              </v-card-text>
            </v-card>
          </v-col>
          <v-col v-if="gameState.status === 'lobby'" cols="9" class="">
            <v-card>
              <v-card-text class="headline">
                Connect as a player to join the game
              </v-card-text>
            </v-card>
            <v-btn
              color="blue my-3"
              @click="startGame()"
            >
              Start Game
            </v-btn>
          </v-col>
          <v-col v-else-if="gameState.status === 'question'" cols="9" >
            <v-card
              width="100%"
              color="blue"
              class=""
            >
              <v-card-text class="headline">
                {{gameState.question}}
              </v-card-text>
            </v-card>
            <!-- <v-card
              v-for="player in notIt"
              :key="player.guid"
              class="ma-3"
            >
              {{player.answer}}
              <v-icon
                right
              >
                mdi-checkbox-marked-circle
              </v-icon>
            </v-card> -->
          </v-col>
          <v-col v-else-if="gameState.status === 'vote'">
            <v-card
              color="blue"
            >
              <v-card-text class="headline">
                {{gameState.question}}
              </v-card-text>
            </v-card>
            <v-card
              v-for="player in onlyAnswers"
              :key="player.guid"
              class="ma-3"
            >
              <v-card-text>
                {{player.answer}}
              </v-card-text>
            </v-card>
          </v-col>
          <v-col v-else-if="gameState.status === 'reveal'">
            <v-card
              width="100%"
              color="blue"
            >
              <v-card-text class="headline">
                {{gameState.question}}
              </v-card-text>
            </v-card>
            <v-card
              v-for="player in onlyAnswers"
              :key="player.guid"
              :class="`ma-3 ${player.guid === gameState.correct ? 'green lighten-3' : ''}`"
            >
              <v-card-text>
                <v-icon
                  v-for="color in player.votes"
                  :key="color + Date.now()"
                  :color="color"
                >
                  M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z
                </v-icon>
                {{player.answer}}
              </v-card-text>
            </v-card>
            <v-btn
              color="success"
              @click="submitScore"
            >
              score
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-sheet height="20px" width="80%" color="green">
            Time remaining
          </v-sheet>
        </v-row>
        <v-btn color="success" @click="test()">text</v-btn>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script>
export default {
  name: 'Home',

  components: {
  },

  data: () => ({
    socket: null,
    gameState: {
      turn: 0,
      round: 0,
      players: [],
      time: 0,
      state: 'lobby',
      question: '',
      correct: ''
    }
  }),

  methods: {
    test () {
      this.socket.send(JSON.stringify({type: 'test'}))
    },
    startGame () {
      this.socket.send(JSON.stringify({type: 'start-game'}))
    },
    submitScore () {
      this.socket.send(JSON.stringify({type: 'score'}))
    }
  },

  computed: {
    notIt () {
      let ret = []
      this.gameState.players.forEach(e => {
        if (e.status !== 'it') {
          ret.push(e)
        }
      })
      return ret
    },
    onlyAnswers () {
      let ret = []
      this.gameState.players.forEach(e => {
        if (e.answer !== '') {
          ret.push(e)
        }
      })
      return ret
    },
    correct () {
      let i =  this.gameState.players.findIndex(e => e.guid === this.gameState.correct)
      if (i !== -1) {
        return this.gameState.players[i].answer
      } else {
        return 'bad juju'
      }
    },
  },

  created () {
    this.socket = new WebSocket('ws://localhost:3000')
    // this.socket = new WebSocket(`ws://${window.location.host}`)

//     // Connection opened
    this.socket.addEventListener('open', (event) => {
      console.log('Connected to WS Server')
      this.socket.send(JSON.stringify({type: 'host'}))
    });

//     // Listen for messages
    this.socket.addEventListener('message', (event) => {
      console.log('Message from server ', event.data);
      const m = JSON.parse(event.data)
      switch (m.type) {
        case 'update':
          this.gameState = {...m.gameState}
          this.gameState.players.sort((a, b) => {
            return a.guid[this.gameState.round] > b.guid[this.gameState.round]
          })
          break;
        default:
          break;
      }
    });
  }
}
</script>
