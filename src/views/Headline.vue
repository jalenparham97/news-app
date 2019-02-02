<template>
  <div class="md-layout md-alignment-center" style="margin: 5em 0;">
    <div class="md-layout-item md-size-75 md-small-size-80 md-xsmall-100">
      <!-- Headline Markup -->
      <md-card class="main-card">
        <md-card-media >
          <img :src="headline.urlToImage" :alt="headline.title">
        </md-card-media>

        <md-card-header>
          <div class="md-title">
            <a :href="headline.url" target="_blank">{{ headline.title }}</a>
          </div>
          <div>
            {{ headline.source.name }}
            <md-icon>book</md-icon>
          </div>
          <span class="md-subhead" v-if="headline.author">
            {{ headline.author }}
            <md-icon>face</md-icon>
          </span>
        </md-card-header>

        <md-card-content>
          {{ headline.description }}
        </md-card-content>
      </md-card>

      <!-- Comment Form -->
      <form @submit.prevent="addComment">
        <md-field>
          <md-textarea @click="showActions = true" md-autogrow placeholder="Add a public comment..." v-model="comment" :disabled="loading || !user"></md-textarea>
          <!-- <md-icon>description</md-icon> -->
        </md-field>
        <div class="actions" v-if="showActions">
          <md-button class="md-primary md-raised comment-btn" type="submit" :disabled="loading || !user">Comment</md-button>
          <md-button @click="cancel" class="cancel-btn">Cancel</md-button>
        </div>
      </form>

      <!-- Comments -->
      <md-list class="md-triple-line" style="margin-top: 2em;" v-if="headline.comments">
        <md-list-item class="list-item" v-for="comment in headline.comments" :key="comment.id">
          <md-avatar><img :src="comment.user.avatar" :alt="comment.user.username"></md-avatar>
          <div class="md-list-item-text">
            <div class="comment-meta-data">
              <span>{{ comment.user.username }}</span>
              <span>{{ commentTime(comment.publishedAt) }}</span>
            </div>
            <p class="comment-text">{{ comment.text }}</p>
          </div>

          <md-badge class="md-primary" md-position="bottom" :md-content="comment.likes" />
          <md-button @click="likeComment(comment.id)" class="md-icon-button" :disabled="loading || !user">
            <md-icon>thumb_up</md-icon>
          </md-button>
        </md-list-item>
      </md-list>

      <!-- Back Button -->
      <md-button class="md-fab md-fab-bottom-right md-fixed md-primary" @click="$router.go(-1)">
        <md-icon>arrow_back</md-icon>
      </md-button>
    </div>
  </div>
</template>

<script>
import uuidv4 from 'uuid/v4'
import moment from 'moment'

export default {
  name: 'Headline',
  data: () => ({
    showActions: false,
    comment: ''
  }),
  async created() {
    await this.$store.dispatch('loadHeadline', this.$route.params.headline)
  },
  computed: {
    headline() {
      return this.$store.getters.headline
    },
    loading() {
      return this.$store.getters.loading
    },
    user() {
      return this.$store.getters.user
    }
  },
  methods: {
    async addComment() {
      const comment = {
        id: uuidv4(),
        text: this.comment,
        user: this.getCommentUserData(),
        publishedAt: Date.now(),
        likes: 0
      }
      await this.$store.dispatch('addComment', comment)
      this.showActions = false
      this.comment = ''
    },
    getCommentUserData() {
      const commentUserData = { ...this.user }
      commentUserData['username'] = commentUserData['email'].split('@')[0]
      return commentUserData
    },
    async likeComment(commentId) {
      await this.$store.dispatch('likeComment', commentId)
    },
    commentTime(time) {
      return moment(time).fromNow()
    },
    cancel() {
      this.comment = ''
      this.showActions = false
    }
  }
}
</script>

<style scoped>
  .actions {
    margin-top: -25px;
  }

  .comment-meta-data span {
    margin-right: 10px;
  }

  .comment-text {
    margin-top: 10px;
  }
</style>

