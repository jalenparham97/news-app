import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import md5 from 'md5'
import slugify from 'slugify'
import firebase from './db/firebase.config'
import db from './db/db'
import defaultImage from './assets/img/newspaper.jpg'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    headlines: [],
    headline: null,
    feed: [],
    category: '',
    token: '',
    loading: false,
    country: 'us',
    user: null,
    source: ''
  },
  mutations: {
    setHeadlines: (state, headlines) => {
      state.headlines = headlines
    },
    setCategory: (state, category) => {
      state.category = category
    },
    setToken: (state, token) => {
      state.token = token
    },
    setLoading: (state, loading) => {
      state.loading = loading
    },
    setCountry: (state, country) => {
      state.country = country
    },
    setUser: (state, user) => {
      state.user = user
    },
    setFeed: (state, headlines) => {
      state.feed = headlines
    },
    setHeadline: (state, headline) => {
      state.headline = headline
    },
    setSource: (state, source) => {
      state.source = source
    },
    clearUser: state => {
      state.user = null
    },
    clearToken: state => {
      state.token = ''
    },
    clearFeed: state => {
      state.feed = []
    }
  },
  actions: {
    async loadHeadlines({ commit }, apiUrl) {
      commit('setLoading', true)
      const response = await axios.get(apiUrl)
      const headlines = response.data.articles.map(article => {
        const slug = slugify(article.title, {
          replacement: '-',
          remove: /[^a-zA-Z0-9 -]/g,
          lower: true
        })
        if (!article.urlToImage) {
          article.urlToImage = defaultImage
        }
        const headline = { ...article, slug }
        return headline
      })
      commit('setHeadlines', headlines)
      commit('setLoading', false)
    },
    async addHeadlineToFeed({ state }, headline) {
      const feedRef = db.collection(`users/${state.user.email}/feed`).doc(headline.title)
  
      await feedRef.set(headline)
    },
    async loadHeadline({ commit }, headlineSlug) {
      const headlineRef = db.collection('headlines').doc(headlineSlug)
      const commentsRef = db.collection(`headlines/${headlineSlug}/comments`).orderBy('publishedAt', 'desc')
      
      let loadedHeadline = {}
      await headlineRef.get().then(async doc => {
        if (doc.exists) {
          loadedHeadline = doc.data()

          await commentsRef.get().then(snapShot => {
            if (snapShot.empty  ) {
              commit('setHeadline', loadedHeadline)
            }
            let loadedComments = []
            snapShot.forEach(doc => {
              loadedComments.push(doc.data())
              loadedHeadline['comments'] = loadedComments
              commit('setHeadline', loadedHeadline)
            })
          })
        }
      })
    },
    async addComment({ state, commit }, comment) {
      const commentsRef = db.collection(`headlines/${state.headline.slug}/comments`)

      commit('setLoading', true)
      await commentsRef.doc(comment.id).set(comment)
      await commentsRef.orderBy('publishedAt', 'desc').get().then(snapShot => {
        let comments = []
        snapShot.forEach(doc => {
          comments.push(doc.data())
          const updatedHeadline = { ...state.headline, comments }
          commit('setHeadline', updatedHeadline)
        })
      })

      commit('setLoading', false)
    },
    async likeComment({ state, commit }, commentId) {
      const commentsRef = db.collection(`headlines/${state.headline.slug}/comments`).orderBy('publishedAt', 'desc')
      const likedCommentRef = db.collection('headlines').doc(state.headline.slug).collection('comments').doc(commentId)

      await likedCommentRef.get().then(doc => {
        if (doc.exists) {
          const prevLikes = doc.data().likes
          const currentLikes = prevLikes + 1
          console.log(currentLikes)
          likedCommentRef.update({ likes: currentLikes })
        }
      })

      await commentsRef.onSnapshot(snapShot => {
        let loadedComments = []
        snapShot.forEach(doc => {
          loadedComments.push(doc.data())
          const updatedHeadline = {
            ...state.headline,
            comments: loadedComments
          }
          commit('setHeadline', updatedHeadline)
        })
      })
    },
    async saveHeadline({}, headline) {
      const headlineRef = db.collection('headlines').doc(headline.slug)

      let headlineId
      await headlineRef.get().then(doc => {
        if (doc.exists) {
          headlineId = doc.id
        }
      })

      if (!headlineId) {
        await headlineRef.set(headline)
      }
    },
    async loadUserFeed({ state, commit }, email) {
      if (state.user) {
        const feedRef = db.collection(`users/${email}/feed`)
    
        await feedRef.onSnapshot(snapShot => {
          let headlines = []
          snapShot.forEach(doc => {
            headlines.push(doc.data())
          })
          commit('setFeed', headlines)
        })
      }
    },
    async removeHeadline({ state }, headline) {
      const headlineRef = db.collection(`users/${state.user.email}/feed`).doc(headline.title)

      await headlineRef.delete()
    },

    // AUTHENTICATION
    async signup({ commit }, userPayload) {
      try {
        commit('setLoading', true)
        const userData = await firebase.auth().createUserWithEmailAndPassword(userPayload.email, userPayload.password)
        commit('setToken', userData.user.uid)
        commit('setLoading', false)
        const avatar = `https://gravatar.com/avatar/${md5(userData.user.email)} `
        const user = { email: userData.user.email, avatar, user_id: userData.user.uid }
        db.collection('users').doc(userData.user.email).set(user)
        commit('setUser', user)
      } catch (err) {
        console.log(err)
        commit('setLoading', true)
      }
    },

    async login({ commit }, userPayload) {
      try {
        commit('setLoading', true)
        const userData = await firebase.auth().signInWithEmailAndPassword(userPayload.email, userPayload.password)
        commit('setToken', userData.user.uid)
        commit('setLoading', false)
        const loginRef = db.collection('users').doc(userPayload.email)
        const loggedInUser = await loginRef.get()
        const user = loggedInUser.data()
        commit('setUser', user)
      } catch (err) {
        console.log(err)
        commit('setLoading', true)
      }
    },
    async signupWithGoogle({ commit }) {
      try {
        commit('setLoading', true)
        const userData = await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
        commit('setToken', userData.user.uid)
        commit('setLoading', false)
        const user = { email: userData.user.email, avatar: userData.user.photoURL, user_id: userData.user.uid }
        db.collection('users').doc(userData.user.email).set(user)
        commit('setUser', user)
      } catch (err) {
        console.log(err)
        commit('setLoading', true)
      }
    },
    async loginWithGoogle({ commit }) {
      try {
        commit('setLoading', true)
        const userData = await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
        commit('setToken', userData.user.uid)
        commit('setLoading', false)
        const loginRef = db.collection('users').doc(userData.user.email)
        const loggedInUser = await loginRef.get()
        const user = loggedInUser.data()
        commit('setUser', user)
      } catch (err) {
        console.log(err)
      }
    },
    async loginWithFacebook({ commit }) {
      try {
        commit('setLoading', true)
        const userData = await firebase.auth().signInWithPopup(new firebase.auth.FacebookAuthProvider())
        commit('setToken', userData.user.uid)
        commit('setLoading', false)
        const loginRef = db.collection('users').doc(userData.user.email)
        const loggedInUser = await loginRef.get()
        const user = loggedInUser.data()
        commit('setUser', user)
      } catch (err) {
        console.log(err)
      }
    },
    async signupWithFacebook({ commit }) {
      try {
        commit('setLoading', true)
        const userData = await firebase.auth().signInWithPopup(new firebase.auth.FacebookAuthProvider())
        commit('setToken', userData.user.uid)
        commit('setLoading', false)
        const user = { email: userData.user.email, avatar: userData.user.photoURL }
        db.collection('users').doc(userData.user.email).set(user)
        commit('setUser', user)
        commit('setUser', user)
      } catch (err) {
        console.log(err)
      }
    },
    autoSignIn() {
      firebase.auth().onAuthStateChanged(userData => {
        db.collection('users').doc(userData.email).get().then(user => {
          store.commit('setUser', user.data())
          store.commit('setToken', userData.uid)
        })
      })
    },
    logout({ commit }) {
      commit('clearUser')
      commit('clearToken')
      commit('clearFeed')
      firebase.auth().signOut()
    }
  },
  getters: {
    headlines: state => state.headlines,
    headline: state => state.headline,
    source: state => state.source,
    loading: state => state.loading,
    isAuthenticated: state => !!state.token,
    category: state => state.category,
    country: state => state.country,
    user: state => state.user,
    feed: state => state.feed
  }
})
