<template>
  <v-container>
    <v-row v-if="status === 'lobby'">
      <v-col cols="12">
        <v-text-field
          v-model="name"
          :error="inputError"
          label="Your Name"
          outlined
          :hide-details="message === ''"
          :messages="[message]"
        ></v-text-field>
      </v-col>
      <v-col>
        <v-row>
          <v-col
            v-for="c in colors"
            :key="c"
            class="text-center pa-1"
          >
            <v-btn
              :color="c"
              @click="() => color = c"
              :class="`${color === c ? '' : ''}`"
            ></v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col
        cols="12"
        v-if="color !== '' && name !== ''"
      >
        <v-btn
          :color="`${color ? color : 'blue'}`"
          block
          @click="submitName"
        >
          Submit
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-else-if="status === 'waiting'">
      <v-col>
        <v-card-text>
          {{name}}
        </v-card-text>
        <v-card-text>
          Please wait for everyone else.
        </v-card-text>
      </v-col>
    </v-row>
    <v-row v-else-if="status === 'question'">
      <v-col cols="12">
        <v-text-field
          v-model="answer"
          :error="inputError"
          label="Your Answer"
          outlined
          :hide-details="message === ''"
          :messages="[message]"
        ></v-text-field>
      </v-col>
      <v-col cols="12">
        <v-btn
          :color="color"
          block
          @click="submitAnswer"
        >
          Submit
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-else-if="status === 'it'">
      <v-col>
        <v-card-text>
          You are it, just hang tight!
        </v-card-text>
      </v-col>
    </v-row>
    <v-row v-else-if="status === 'vote-correct'">
      <v-col>
        <v-card-text>
          Choose your favorite answer.
        </v-card-text>
      </v-col>
      <v-col cols="12">
        <v-card
          v-for="player in activeAnswers"
          :key="player.guid"
          @click="chosenAnswer = player.guid"
          :class="`${chosenAnswer === player.guid ? 'blue' : ''}`"
        >
          <v-card-text>
            {{player.answer}}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" v-if="chosenAnswer !== ''">
        <v-btn
          :color="color"
          @click="submitCorrect"
        >
          submit
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-else-if="status === 'vote-guess'">
      <v-col>
        <v-card-text>
          Choose the answer you think will be chosen.
        </v-card-text>
      </v-col>
      <v-col cols="12">
        <v-card
          v-for="player in activeAnswers"
          :key="player.guid"
          @click="chooseGuess(player.guid)"
        >
          <v-card-text>
            <v-icon class="" v-if="chosenGuesses[0] == player.guid">
              M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z
            </v-icon>
            <v-icon class="" v-if="chosenGuesses[1] == player.guid">
              M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z
            </v-icon>
            {{player.answer}}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="chosenGuesses[1] !== ''">
        <v-btn
          :color="color"
          @click="submitGuesses"
        >
          submit
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-else>
      status: {{status}}
    </v-row>
  </v-container>
</template>

<script>
import Cookies from 'js-cookie'
export default {
  name: 'Home',

  components: {
  },

  data: () => ({
    inputError: false,
    name: '',
    answer: '',
    status: 'lobby',
    message: '',
    socket: null,
    guid: '',
    players: [],
    chosenAnswer: '',
    chosenGuesses: ['', ''],
    guessIndex: 0,
    color: '',
    colors: [
      'green lighten-1',
      'pink lighten-2',
      'purple lighten-3',
      'indigo lighten-2',
      'blue lighten-4',
      'cyan lighten-2',
      'brown lighten-2',
      'blue-grey',
      'deep-orange lighten-2',
      'deep-orange darken-3',
      'blue darken-4',
      'red lighten-1',
      'amber lighten-1',
      'grey',
      'purple lighten-1',
      'yellow',
      'light-blue',
    ]
  }),

  methods: {
    submitName () {
      if (this.nameInput == '' || this.color === '') {
        this.inputError = true
        return
      }
      this.inputError = false
      this.message = ''
      this.socket.send(JSON.stringify({
        type: 'name',
        name: this.name,
        color: this.color
      }))
    },
    submitAnswer () {
      if (this.answer == '') {
        this.inputError = true
        return
      }
      this.inputError = false
      this.message = ''
      this.socket.send(JSON.stringify({
        type: 'answer',
        answer: this.answer,
        guid: this.guid
      }))
    },
    submitCorrect () {
      this.socket.send(JSON.stringify({
        type: 'correct',
        guid: this.guid,
        correct: this.chosenAnswer
      }))
      this.chosenAnswer = ''
    },
    submitGuesses () {
      this.socket.send(JSON.stringify({
        type: 'guesses',
        guid: this.guid,
        guesses: this.chosenGuesses
      }))
      this.chosenGuesses = ['', '']
    },
    chooseGuess (guid) {
      this.chosenGuesses[this.guessIndex] = guid

      // TODO: Use vue.set on this
      this.players.push({guid: '3'})
      this.players.pop()

      this.guessIndex = this.guessIndex === 0 ? 1 : 0
    }
  },

  computed: {
    activeAnswers () {
      let ret = []
      this.players.forEach(e => {
        if (e.answer !== '') {
          ret.push(e)
        }
      })
      return ret
    }
  },

  created () {
    // this.socket = new WebSocket('ws://localhost:3000')
    this.socket = new WebSocket(`ws://${window.location.host}`)

    this.socket.addEventListener('open', (event) => {
      console.log('connected to WS server')
      const cookie = Cookies.get('guid')
      this.guid = cookie
      if (cookie) {
        this.socket.send(JSON.stringify({
          type: 'returning',
          guid: cookie
        }))
        }
    })

    this.socket.addEventListener('message', (event) => {
      console.log('Message from server', event.data)
      const m = JSON.parse(event.data)
      switch (m.type) {
        case 'player-added':
          Cookies.set('guid', m.guid)
          this.guid = m.guid
          this.status = m.status
          break
        case 'reconnect':
          this.name = m.name,
          this.status = m.status
          this.color = m.color
          break
        case 'input-error':
          this.inputError = true
          this.message = m.message
          break
        case 'status-update':
          this.status = m.status
          break
        case 'vote':
          this.status = m.status
          this.players = m.players
          break
        default:
          break;
      }
    })
  },

  beforeUnmount () {
    this.socket.send(JSON.stringify({
      type: 'close',
      name: this.name
    }))
    this.socket.close()
  }
}
</script>

// localStorage.setItem('myCat', 'Tom');
// const cat = localStorage.getItem('myCat');
// localStorage.removeItem('myCat');
