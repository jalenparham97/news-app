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
      <ul class="comments">
        <li class="comment" v-for="comment in headline.comments" :key="comment.id">
          <div class="comment-data">
            <md-avatar><img :src="comment.user.avatar" :alt="comment.user.username"></md-avatar>
            <div class="comment-meta-data">
              <span>{{ comment.user.username }}</span>
              <span>{{ commentTime(comment.publishedAt) }}</span>
              <div class="comment-text">
                <p>{{ comment.text }}</p>
              </div>
              <div class="likes">
                <md-button class="md-icon-button md-ripple like-btn" @click="likeComment(comment.id)" :disabled="loading || !user">
                  <md-icon class="icon">thumb_up</md-icon>
                </md-button>
                <span class="like-count" v-if="comment.likes !== 0">{{ comment.likes }}</span>
              </div>
            </div>
          </div>
        </li>
      </ul>


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

<style scoped lang="scss">
  .actions {
    margin-top: -25px;
    margin-left: -8px;
  }

  .comments {
    list-style: none;
    padding: 0px;
    margin-top: 50px;
  }

  .comment {
    margin-top: 15px;
  }

  .md-avatar {
    margin: 0px 10px 0px 0px;
  }

  .comment-data {
    display: flex;
  }

  .comment-meta-data span {
    margin-right: 10px;

    &:first-child {
      font-weight: 700;
    }
  }

  .comment-text {
    margin-top: -5px;
  }

  .likes {
    display: flex;
    align-items: center;
    margin-top: -10px;
  }

  .like-btn {
    margin: 0px 0px 0px -12px;
  }

  .icon {
    font-size: 18px !important;
  }

  @media only screen and (max-width: 700px) {
    
  }
</style>

