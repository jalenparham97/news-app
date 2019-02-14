<template>
  <div class="md-layout md-alignment-center" style="margin: 3em 0;">
    <div class="md-layout-item md-size-75 md-small-size-80 md-xsmall-100">
      <!-- Headline Markup -->
      <md-card class="main-card">
        <md-card-media>
          <img :src="headline.urlToImage" :alt="headline.title">
        </md-card-media>

        <md-card-header>
          <div class="md-title">
            <a :href="headline.url" target="_blank">{{ headline.title }}</a>
          </div>
          <div class="article-data">

            <div class="article-meta-data">
              <div>
                {{ headline.source.name }}
                <md-icon>book</md-icon>
              </div>
              <span class="md-subhead" v-if="headline.author">
                {{ headline.author }}
                <md-icon>face</md-icon>
              </span>
              <md-button @click="addHeadlineToFeed(headline)" class="md-icon-button" :class="isInFeed(headline.title)">
                <md-icon>bookmark</md-icon>
              </md-button>
            </div>
          </div>
        </md-card-header>

        <md-card-content>
          {{ headline.description }}
        </md-card-content>
      </md-card>

      <!-- Comment Form -->
      <form @submit.prevent="addComment">
        <md-field>
          <md-textarea @click="showActions = true" md-autogrow placeholder="Add a public comment..." v-model="comment" :disabled="loading || !user"></md-textarea>
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
              <div class="likes-container">
                <span class="likes">
                  <md-button class="md-icon-button md-ripple like-btn" @click="likeComment(comment)" :disabled="loading || !user" :class="isLikedComment(comment)">
                    <md-icon class="icon">thumb_up</md-icon>
                  </md-button>
                  <span class="like-count" v-if="comment.likes !== 0">{{ comment.likes }}</span>
                </span>
                <span class="dislikes">
                  <md-button class="md-icon-button md-ripple like-btn" @click="dislikeComment(comment)" :disabled="loading || !user" :class="isdislikedComment(comment)">
                    <md-icon class="icon">thumb_down</md-icon>
                  </md-button>
                  <span class="dislike-count" v-if="comment.dislikes !== 0">{{ comment.dislikes }}</span>
                </span>
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
    await this.$store.dispatch('getLikedAndDislikedComments')
    await this.$store.dispatch('loadUserFeed', this.user.email)
  },
  computed: {
    feed() {
      return this.$store.getters.feed
    },
    headline() {
      return this.$store.getters.headline
    },
    loading() {
      return this.$store.getters.loading
    },
    user() {
      return this.$store.getters.user 
    },
    likedHeadlines() {
      return this.$store.getters.likedHeadlines
    },
    dislikedHeadlines() {
      return this.$store.getters.dislikedHeadlines
    },
    likedComments() {
      return this.$store.getters.likedComments
    },
    dislikedComments() {
      return this.$store.getters.dislikedComments
    }
  },
  methods: {
    async addComment() {
      if (this.comment !== '') {
        const comment = {
          id: uuidv4(),
          text: this.comment,
          user: this.getCommentUserData(),
          publishedAt: Date.now(),
          likes: 0,
          dislikes: 0
        }
        await this.$store.dispatch('addComment', comment)
        this.showActions = false
        this.comment = ''
      }
    },
    getCommentUserData() {
      const commentUserData = { ...this.user }
      commentUserData['username'] = commentUserData['email'].split('@')[0]
      return commentUserData
    },
    async likeComment(comment) {
      const likedComment = this.likedComments.findIndex(likedComment => likedComment.id === comment.id) > -1
      const dislikedComment = this.dislikedComments.findIndex(dislikedComment => dislikedComment.id === comment.id) > -1

      if (likedComment) {
        await this.$store.dispatch('deleteLikedComment', comment)
      } else {
        await this.$store.dispatch('likeComment', comment)
        if (dislikedComment) {
          this.$store.dispatch('deleteDislikedComment', comment)
        }
      }
    },
    async dislikeComment(comment) {
      const dislikedComment = this.dislikedComments.findIndex(dislikedComment => dislikedComment.id === comment.id) > -1
      const likedComment = this.likedComments.findIndex(likedComment => likedComment.id === comment.id) > -1 

      if (dislikedComment) {
        await this.$store.dispatch('deleteDislikedComment', comment)
      } else {
        await this.$store.dispatch('dislikeComment', comment)
        if (likedComment) {
          this.$store.dispatch('deleteLikedComment', comment)
        }
      }
    },
    commentTime(time) {
      return moment(time).fromNow()
    },
    cancel() {
      this.comment = ''
      this.showActions = false
    },
    isLikedComment(comment) {
      const likedComments = this.likedComments.findIndex(likedComment => likedComment.id === comment.id) > -1
      return likedComments ? 'md-primary' : ''
    },
    isdislikedComment(comment) {
      const dislikedComments = this.dislikedComments.findIndex(dislikedComment => dislikedComment.id === comment.id) > -1
      return dislikedComments ? 'md-primary' : ''
    },
    isLikedHeadline(title) {
      const likedHeadline = this.likedHeadlines.findIndex(headline => headline.title === title) > -1
      return likedHeadline ? 'md-primary' : ''
    },
    isDisLikedHeadline(title) {
      const dislikedHeadline = this.dislikedHeadlines.findIndex(headline => headline.title === title) > -1
      return dislikedHeadline ? 'md-primary' : ''
    },
    async addHeadlineToFeed(headline) {
      if (this.user) {
        await this.$store.dispatch('addHeadlineToFeed', headline)
      }
    },
    isInFeed(title) {
      const inFeed = this.feed.findIndex(headline => headline.title === title) > -1
      return inFeed ? 'md-primary' : ''
    },
  }
}
</script>

<style scoped lang="scss">
  .actions {
    margin-top: -25px;
    margin-left: -8px;
  }

  .article-data {
    display: flex;
  }

  .article-likes {
    display: flex;
    margin-left: 30px;
  }

  .article-like-btn {
    display: flex;
    align-items: center;
  }

  .like-article-icon {
    color: #fff !important; 
    font-size: 20px !important;
  }

  .comments {
    list-style: none;
    padding: 0px;
    margin-top: 50px;
  }

  .comment {
    margin-top: 15px;
  }

  .likes-container {
    display: flex;
    align-items: center;
    margin-top: -10px;
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

  .likes, .dislikes {
    display: flex;
    align-items: center;
  }

  .like-btn {
    margin: 0px 0px 0px -12px;
  }

  .icon {
    font-size: 18px !important;
  }

  .article-meta-data {
    display: flex;
    flex-direction: column;
  }

  @media only screen and (max-width: 700px) {
    
  }
</style>

