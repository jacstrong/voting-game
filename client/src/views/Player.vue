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
      <v-col cols="12">
        <v-btn
          color="blue"
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
    name: 'Jacob',
    status: 'lobby',
    message: '',
    socket: null,
  }),

  methods: {
    submitName () {
      if (this.nameInput == '') {
        this.inputError = true
        return
      }
      this.socket.send(JSON.stringify({
        type: 'name',
        name: this.name
      }))
    }
  },

  created () {
    this.socket = new WebSocket('ws://localhost:3000')

    this.socket.addEventListener('open', (event) => {
      console.log('connected to WS server')
      const cookie =  Cookies.get('guid')
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
          this.status = m.status
          break
        case 'reconnect':
          this.name = m.name,
          this.status = m.status
          break
        case 'input-error':
          this.inputError = true
          this.message = m.message
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
