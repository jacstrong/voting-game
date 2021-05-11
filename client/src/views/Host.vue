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
            <v-card v-for="name in ['jacob', 'josh', 'grace', 'samantha']" :key="name">
              {{name}}
            </v-card>
          </v-col>
          <v-col v-if="state === 'a'" cols="9" class="">
            <v-sheet
              width="100%"
              color="blue"
              class="pa-3 rounded-t"
            >
              How old will Jacob be when he dies?
            </v-sheet>
            <v-sheet
              color="white"
              width="100%"
              class="fill-height"
            >
              Please fill out the answers on your phone!
            </v-sheet>
          </v-col>
          <v-col v-else-if="state === 'b'" cols="9" >
            <v-card
              width="100%"
              color="blue"
              class="rounded-t"
            >
              <v-card-title primary-title>
                How old will Jacob be when he dies?
              </v-card-title>
            </v-card>
              <v-card v-for="answer in ['29', '22', '25', '35', '60']" :key="answer" class="ma-3">
                {{answer}}
                <v-icon
                  right
                >
                  mdi-checkbox-marked-circle
                </v-icon>
              </v-card>
            <!-- </v-sheet> -->
          </v-col>
        </v-row>
        <v-row>
          <v-sheet height="20px" width="80%" color="green">
            Time remaining
          </v-sheet>
        </v-row>
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
    state: 'b'
  })
}
</script>
