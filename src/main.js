import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import firebase from './db/firebase.config'
import db from './db/db'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import './assets/theme.scss'

Vue.config.productionTip = false

Vue.use(VueMaterial)

new Vue({
  router,
  store,
  created () {
    firebase.auth().onAuthStateChanged(userData => {
      if (userData) {
        db.collection('users').doc(userData.email).get().then(user => {
          this.$store.commit('setUser', user.data())
          this.$store.commit('setToken', userData.uid)
        })
      }
    })
  },
  render: h => h(App)
}).$mount('#app')
