<template>
  <div class="md-layout md-alignment-center" style="margin: 4em 0px;">
    <md-progress-bar v-if="loading" md-mode="indeterminate"></md-progress-bar>
    <!-- Top Navigation -->
    <md-toolbar elevation="1" class="fixed-toolbar">
      <md-button @click="getUserFeed" class="md-icon-button">
        <md-icon>menu</md-icon>
      </md-button>

      <router-link class="md-title brand" to="/">
        NewsCycle
      </router-link>

      <div class="md-toolbar-section-end md-toolbar-row toolbar">
        <template v-if="isAuthenticated">
          <md-button class="md-primary" @click="showSearchDialog = true">Search</md-button>
          <md-menu md-size="medium" md-align-trigger>
            <md-button md-menu-trigger>
              <md-avatar><img :src="user.avatar" alt="user.email"></md-avatar>
            {{ username }}
            </md-button>

            <md-menu-content>
              <md-list>
                <md-list-item @click="logout">
                  <md-icon class="md-primary">lock_open</md-icon>
                  <span class="md-list-item-text">
                    Logout
                  </span>
                </md-list-item>
              </md-list>
            </md-menu-content>
          </md-menu>
        </template>

        <template v-else>
          <md-button class="md-primary" @click="showDialog">Search</md-button>
          <md-button @click="$router.push('/signup')">Sign Up</md-button>
          <md-button @click="$router.push('/login')">Login</md-button>
        </template>

        <!-- Search Dialog -->
        <md-dialog :md-active.sync="showSearchDialog">
          <md-dialog-title>Search Headlines</md-dialog-title>

          <div class="md-layout" style="padding: 1em;">
            <md-field>
              <label>Search Term(s)</label>
              <md-input v-model="query" placeholder="use quotes for exact matches, AND / OR / NOT for multiple terms" maxLength="30"></md-input>
            </md-field>
            <md-datepicker v-model="fromDate" md-immediatly>
              <label for="">Select start date (optional)</label>
            </md-datepicker>
            <md-datepicker v-model="toDate" md-immediatly>
              <label for="">Select end date (optional)</label>
            </md-datepicker>
            <md-field>
              <label for="sortBy">Sort search results by criteria (optional)</label>
              <md-select v-model="sortBy" name="sortBy" id="sortBy" md-dense>
                <md-option value="publishedAt">Newest(default)</md-option> 
                <md-option value="relevency"> Relevent</md-option>
                <md-option value="popularity">Popular</md-option>
              </md-select>
            </md-field>
          </div>

          <md-dialog-actions>
            <md-button class="md-accent" @click="showSearchDialog = false">Cancel</md-button>
            <md-button class="md-primary" @click="search">Search</md-button>
          </md-dialog-actions>
        </md-dialog>
      </div>

      <div class="md-toolbar-section-end toolbar-small">
        <md-button class="md-icon-button" @click="showDialog"><md-icon>search</md-icon></md-button>
        <md-button 
          class="md-icon-button" 
          @click="showRightpanel = true"
        >
          <md-icon>apps</md-icon>
        </md-button>
        <md-menu md-size="medium" md-align-trigger v-if="user">
          <md-button md-menu-trigger>
            <md-avatar><img :src="user.avatar" alt="user.email"></md-avatar>
          </md-button>

          <md-menu-content>
            <md-list>
              <md-list-item @click="logout">
                <md-icon class="md-primary">lock_open</md-icon>
                <span class="md-list-item-text">
                  Logout
                </span>
              </md-list-item>
            </md-list>
          </md-menu-content>
        </md-menu>
      </div>
    </md-toolbar>

    <!-- Personal News Feed (Left Drawer) -->
    <md-drawer md-fixed :md-active.sync="showLeftpanel">
      <md-toolbar :md-elevation="1">
        <span class="md-title">Personal Feed</span>
      </md-toolbar>

      <md-progress-bar v-if="loading" md-mode="indeterminate"></md-progress-bar>

      <md-field class="country">
        <label for="country">Country</label>
        <md-select @input="changeCountry" :value="country" name="country" id="country">
          <md-option value="us">United States</md-option>
          <md-option value="ca">Canada</md-option>
          <md-option value="de">Germany</md-option>
          <md-option value="ru">Russia</md-option>
        </md-select>
      </md-field>

      <!-- Default Markup (if Feed Empty) -->
      <md-empty-state class="md-primary" v-if="feed.length === 0 && !user" md-icon="bookmarks" md-label="Nothing in Feed" md-description="Login to bookmark headlines">
        <md-button class="md-primary md-raised"><router-link to="/login" class="login-feed-btn">Login</router-link></md-button>
      </md-empty-state>

      <md-empty-state class="md-primary" v-else-if="feed.length === 0" md-icon="bookmark_outline" md-label="Nothing in Feed" md-description="Anything you bookmark will be shown here">
      </md-empty-state>

      

       <!-- Feed Content (if Feed Not Empty) -->
       <md-list v-else class="md-tripple-line feed-list" v-for="headline in feed" :key="headline.id">
         <md-list-item>
           <md-avatar>
             <img :src="headline.urlToImage" :alt="headline.title">
           </md-avatar>

           <div class="md-list-item-text">
             <span><a :href="headline.url" target="_black">{{ headline.title }}</a></span>
             <span>{{ headline.source.name }}</span>
             <span class="view-comments" @click="saveHeadline(headline)">View Comments</span>
           </div>

           <md-button @click="removeHeadline(headline)" class="md-icon-button md-list-action">
             <md-icon class="md-accent">delete</md-icon>
           </md-button>
         </md-list-item>

         <md-divider class="md-inset"></md-divider>
       </md-list>
    </md-drawer>

    <!-- News Categories (Right Drawer) -->
    <md-drawer class="md-right" md-fixed :md-active.sync="showRightpanel">
      <md-toolbar :md-elevation="1">
        <span class="md-title">News Categories</span>
      </md-toolbar>

      <md-progress-bar v-if="loading" md-mode="indeterminate"></md-progress-bar>

      <md-list>
        <md-subheader class="md-primary">Categories</md-subheader>

        <md-list-item v-for="(newsCategory, i) in newsCategories" :key="i" @click="loadCategory(newsCategory.path)">
          <md-icon :class="newsCategory.path === category ? 'md-primary' : ''">{{ newsCategory.icon }}</md-icon>
          <span class="md-list-item-text">
            {{ newsCategory.name }}
          </span>
        </md-list-item>
      </md-list>
    </md-drawer>

    <!-- App Content -->
    <div class="md-layout-item md-size-95">
      <div class="header-content" v-if="!user">
        <h1 class="header-title">BE INFORMED</h1>
        <h1 class="header-title"><span>BE INSPIRED</span></h1>

        <h1 class="header-subtitle">Get Top Stories Anytime</h1>

        <md-button class="md-raised header-action-btn md-accent " :md-ripple="false" @click="$router.push('/signup')">Sign Up</md-button>
      </div>

      <div class="categories-nav" ref="categoryNav">
        <div class="categories-container">
          <h2 v-for="(newsCategory, i) in newsCategories" :key="i" class="news-category" :class="newsCategory.path === category ? 'highlight' : ''" @click="loadCategory(newsCategory.path)">
            {{ newsCategory.name }}
          </h2>
        </div>
      </div>

      <md-content class="md-layout" style="background: #303030;">
        <ul v-for="headline in headlines" :key="headline.id" class="md-layout-item md-large-size-25 md-medium-size-33 md-small-size-50 md-xsmall-size-100 headline">
          <md-card style="margin-top: 1em;" md-with-hover>
            <md-ripple>
              <md-card-media md-ratio="16:9">
                <img :src="headline.urlToImage" :alt="headline.title">
              </md-card-media>

              <md-card-header>
                <div class="md-title title">
                  <a :href="headline.url" target="_blank" class="card-title">{{ headline.title }}</a>
                </div>
                <div @click="loadSource(headline.source.id)">
                  {{ headline.source.name }}
                  <md-icon class="small-icon">book</md-icon>
                </div>
                <div class="md-subhead" v-if="headline.author">
                  {{ headline.author }}
                  <md-icon class="small-icon">face</md-icon>
                </div>
                <div class="md-subhead">
                  {{ formatDate(headline.publishedAt) }}
                  <md-icon class="small-icon">alarm</md-icon>
                </div>
              </md-card-header>

              <md-card-content>
                {{ headline.description }}
              </md-card-content>

              <md-card-actions>
                <md-button @click="addHeadlineToFeed(headline)" class="md-icon-button" :class="isInFeed(headline.title)">
                  <md-icon>bookmark</md-icon>
                </md-button>
                
                <md-button @click="saveHeadline(headline)" class="md-icon-button">
                  <md-icon>message</md-icon>
                </md-button>
              </md-card-actions>
            </md-ripple>
          </md-card>
        </ul>
      </md-content>
    </div>

    <div class="footer-container">
      <md-button @click="loadMoreHeadlines" class="load-more md-primary">Load More</md-button>
      <span class="powered-by">Powered By News API</span>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import axios from 'axios'
import db from '../db/db'
import env from '../config/config'

export default {
  data: () => ({
    showLeftpanel: false,
    showRightpanel: false,
    showSearchDialog: false,
    newsCategories: [
      { name: 'Top Headlines', path: '', icon: 'today' },
      { name: 'Technology', path: 'technology', icon: 'keyboard' },
      { name: 'Business', path: 'business', icon: 'business_center' },
      { name: 'Entertainment', path: 'entertainment', icon: 'weekend' },
      { name: 'Health', path: 'health', icon: 'fastfood' },
      { name: 'Science', path: 'science', icon: 'fingerprint' },
      { name: 'Sports', path: 'sports', icon: 'golf_course' },
    ], 
    query: '',
    fromDate: '',
    toDate: '',
    sortBy: '',
    pageSize: 21,
    page: 1
  }),
  async created() {
    this.page = 1
    await this.$store.dispatch('loadHeadlines', `https://newsapi.org/v2/top-headlines?country=${this.$store.state.country}&category=${this.$store.state.category}&pageSize=${this.pageSize}&apiKey=${env.API_KEY}`)
  },
  mounted() {
    this.fixedCategoryNav()
  },
  watch: {
    async country() {
      this.page = 1
      await this.$store.dispatch('loadHeadlines', `https://newsapi.org/v2/top-headlines?country=${this.country}&category=${this.category}&pageSize=${this.pageSize}&page=${this.page}&apiKey=${env.API_KEY}`)
    }
  },
  computed: {
    headlines() {
      return this.$store.getters.headlines
    },
    source() {
      return this.$store.getters.source
    },
    feed() {
      return this.$store.getters.feed
    },
    category() {
      return this.$store.getters.category
    },
    country() {
      return this.$store.getters.country
    }, 
    loading() {
      return this.$store.getters.loading
    },
    user() {
      return this.$store.getters.user
    },
    isAuthenticated() {
      return this.$store.getters.isAuthenticated
    },
    username() {
      return this.user.email.split('@')[0]
    }
  },
  methods: {
    async loadCategory(category) {
      this.page = 1
      this.$store.commit('setCategory', category)
      await this.$store.dispatch('loadHeadlines', `https://newsapi.org/v2/top-headlines?country=${this.country}&category=${this.category}&pageSize=${this.pageSize}&page=${this.page}&apiKey=${env.API_KEY}`)
    },
    async loadSource(sourceId) {
      if (sourceId) {
        this.page = 1
        this.$store.commit('setSource', sourceId)
        await this.$store.dispatch('loadHeadlines', `https://newsapi.org/v2/top-headlines?sources=${this.source}&pageSize=${this.pageSize}&page=${this.page}&apiKey=${env.API_KEY}`)
      }
    },
    changeCountry(country) {
      this.$store.commit('setCountry', country)
    },
    logout() {
      this.$store.dispatch('logout')
    },
    async addHeadlineToFeed(headline) {
      if (this.user) {
        await this.$store.dispatch('addHeadlineToFeed', headline)
      }
    },
    async getUserFeed() {
      this.showLeftpanel = true
      await this.$store.dispatch('loadUserFeed', this.user.email)
    },
    isInFeed(title) {
      const inFeed = this.feed.findIndex(headline => headline.title === title) > -1
      return inFeed ? 'md-primary' : ''
    },
    fixedCategoryNav() {
      window.onscroll = () => {
        const header = this.$refs.categoryNav

        if (!this.user) {
          if (window.pageYOffset > 400) {
            header.classList.add('fixed-category-nav');
          } else {
            header.classList.remove("fixed-category-nav");
          }
        } else {
          if (window.pageYOffset > 20) {
            header.classList.add('fixed-category-nav');
          } else {
            header.classList.remove("fixed-category-nav");
          }
        }
        
      }
    },
    formatDate(date) {
      return moment(date).format('MMM Do YYYY, h:mm a')
    },
    async removeHeadline(headline) {
      await this.$store.dispatch('removeHeadline', headline)
    },
    async saveHeadline(headline) {
      await this.$store.dispatch('saveHeadline', headline).then(() => {
        this.$router.push(`/news/${headline.slug}`)
      })
    },
    async search() {
      this.page = 1
      await this.$store.dispatch('loadHeadlines', `https://newsapi.org/v2/everything?q=${this.query}&from=${this.dateToISOString(this.fromDate)}&to=${this.dateToISOString(this.toDate)}&sortBy=${this.sortBy}&pageSize=${this.pageSize}&page=${this.page}&apiKey=${env.API_KEY}`)

      this.showSearchDialog = false
    },
    dateToISOString(date) {
      if (date) {
        return new Date(date).toISOString()
      }
    },
    getUsername() {
      const username = { ...this.user }
      username['username'] = username['email'].split('@')[0]
      return username
    },
    async loadMoreHeadlines() {
      if (this.query !== '') {
        this.page++
        console.log('Page number', this.page)
        await this.$store.dispatch('loadMoreHeadlines', `https://newsapi.org/v2/everything?q=${this.query}&from=${this.dateToISOString(this.fromDate)}&to=${this.dateToISOString(this.toDate)}&sortBy=${this.sortBy}&pageSize=${this.pageSize}&page=${this.page}&apiKey=${env.API_KEY}`)
        console.log('Search')
        console.log(this.headlines)
      } else {
        this.page++
        console.log('Page number', this.page)
        await this.$store.dispatch('loadMoreHeadlines', `https://newsapi.org/v2/top-headlines?country=${this.$store.state.country}&category=${this.$store.state.category}&pageSize=${this.pageSize}&page=${this.page}&apiKey=${env.API_KEY}`)
        console.log(this.headlines)
      }
    },
    showDialog() {
      this.query = ''
      this.fromDate = ''
      this.toDate = ''
      this.sortBy = ''

      this.showSearchDialog = true
    }
  }
}
</script>

<style scoped lang="scss">
  .highlight {
    color: #00E677;
  }

  .tooltip {
    margin-top: -10px
  }

  .header-content {
    padding: 60px 0px;
    text-align: center;
  }

  .header-title {
    font-size: 4rem;
  }

  .header-title span {
    border-bottom: 10px solid #FF1644;
  }

  .header-subtitle {
    padding-top: 20px;
  }

  .header-action-btn {
    margin-top: 40px;
    height: 60px;
    padding: 0px 40px;
    font-size: 1.2rem;
  }

  .categories-container {
    display: flex;
    justify-content: space-around;
    border-bottom: 1px solid #fff;
    width: 98.5%;
    margin: 30px auto auto auto;

    & h2 {
      cursor: pointer;
    }
  }

  .fixed-category-nav {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    margin: 50px auto auto auto;
    width: 100%;
    background: #212121;

    & .categories-container {
      border: none;
    }
  }

  .headline {
    padding: 0px 10px;
  }

  .md-title {
    & a.card-title {
      &:hover {
        text-decoration: none;
      }
    }
  }

  .brand {
    color: #fff !important;

    &:hover {
      text-decoration: none;
    }
  }

  .small-icon {
    font-size: 18px !important;
  }

  .fixed-toolbar {
    position: fixed;
    top: 0;
    z-index: 100;
  }

  .feed-list {
    padding-bottom: 10px;
  }

  .view-comments {
    margin-top: 5px;
    padding-bottom: 5px;
    cursor: pointer;
  }

  .nav-btn {
    &:hover {
      text-decoration: none;
    }
  }

  .login-feed-btn {
    color: #000 !important;

    &:hover {
      color: #000 !important;
      text-decoration: none;
    }
  }

  .country {
    padding-left: 10px;

    & label {
      padding-left: 10px;
    }
  }

  .avatar {
    display: none;
  }

  .toolbar-small {
    display: none;
  }

  .powered-by {
    text-align: center;
  }

  .footer-container {
    display: flex;
    flex-direction: column;
  }

  @media only screen and (max-width: 960px) {
    .fixed-category-nav {
      margin-top: 40px;
    }
  }

  @media only screen and (max-width: 840px) {
    .news-category {
      font-size: 16px;
    }
  }

  @media only screen and (max-width: 720px) {
    .categories-nav {
      display: none;
    }

    .fixed-category-nav {
      display: none;
    }

    .toolbar {
      display: none;
    }

    .toolbar-small {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
  }

  @media only screen and (max-width: 500px) {
    .header-title {
      font-size: 3rem;
    }

    .header-title span {
      border-bottom: 7.5px solid #FF1644;
    }

    .header-subtitle {
      font-size: 1.5rem;
    }
  }
</style>


