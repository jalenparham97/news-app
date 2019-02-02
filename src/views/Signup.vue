<template>
  <div class="md-layout md-alignment-center-center" style="height: 100vh;">
    <md-card class="md-layout-item md-large-size-50 md-medium-size-80 md-small-size-95 md-xsmall-size-100">
      <md-card-header>
        <div class="title">Sign Up</div>
      </md-card-header>

      <div class="oauth-btns">
        <md-button @click="signupWithGoogle" class="md-accent md-raised">Sign Up With Google</md-button>
        <md-button @click="signupWithFacebook" class="md-raised facebook-btn">Sign Up With Facebook</md-button>
      </div>

      <div class="options">
        <p>Or Sign Up with</p>
      </div>

      <!-- Sign up form -->
      <form @submit.prevent="validateForm">
        <md-card-content>
          <md-field md-clearable :class="getValidationClass('email')">
            <label for="email">Email</label>
            <md-input :disabled="loading" type="email" name="email" id="email" autocomplete="email" v-model="form.email"/> 
            <span class="md-error" v-if="!$v.form.email.required">The email is required</span>
            <span class="md-error" v-else-if="!$v.form.email">Invalid email</span>
          </md-field>
          <md-field :class="getValidationClass('password')">
            <label for="password">Password</label>
            <md-input :disabled="loading" type="password" name="password" id="password" autocomplete="password" v-model="form.password"/> 
            <span class="md-error" v-if="!$v.form.password.required">The password is required</span>
            <span class="md-error" v-else-if="!$v.form.password.minLength">Password must be between 6 and 20 charaters</span>
            <span class="md-error" v-else-if="!$v.form.password.maxLength">Password must be between 6 and 20 charaters</span>
          </md-field>
          <md-field :class="confirmPassword !== form.password ? 'md-invalid' : ''">
            <label for="confirmPassword">Confirm Password</label>
            <md-input :disabled="loading" type="password" name="confirmPassword" id="confirmPassword" autocomplete="password" v-model="confirmPassword"/> 
            <span class="md-error" v-if="confirmPassword !== form.password">Passwords do not match</span>
          </md-field>
        </md-card-content>

        <md-card-actions>
          <div class="card-actions">
            <div class="submit-btn">
              <md-button :disabled="loading" class="md-primary md-raised" type="submit">Submit</md-button>
            </div>
            <div class="account-link">
              <span>Already have an account?</span>
              <router-link class="auth-link" to="/login">Login</router-link>
            </div>
          </div>
        </md-card-actions>
      </form>

      <md-snackbar :md-active.sync="isAuthenticated" class="snackbar">
        {{ form.email || 'user' }} was successfully signed up!
      </md-snackbar>
    </md-card>

    <!-- Back Button -->
    <md-button class="md-fab md-fab-bottom-right md-fixed md-primary" @click="$router.go(-1)">
      <md-icon>arrow_back</md-icon>
    </md-button>
  </div>
</template>

<script>
import { validationMixin } from 'vuelidate'
import { required, email, minLength, maxLength } from 'vuelidate/lib/validators'

export default {
  mixins: [validationMixin],
  data: () => ({
    form: {
      email: '',
      password: ''
    },
    confirmPassword: ''
  }),
  validations: {
    form: {
      email: {
        required,
        email
      },
      password: {
        required,
        minLength: minLength(6),
        maxLength: maxLength(20)
      }
    }
  },
  computed: {
    loading() {
      return this.$store.getters.loading
    },
    isAuthenticated() {
      return this.$store.getters.isAuthenticated
    }
  },
  watch: {
    isAuthenticated(value) {
      if (value) {
        setTimeout(() => this.$router.push('/'), 2000)
      }
    }
  },
  methods: {
    validateForm() {
      this.$v.$touch()
      if (this.confirmPassword === this.form.password) {
        if (!this.$v.$invalid) {
          this.signupUser()
        }
      }
    },
    signupUser() {
      this.$store.dispatch('signup', { ...this.form })
    },
    signupWithGoogle() {
      this.$store.dispatch('signupWithGoogle')
    },
    signupWithFacebook() {
      this.$store.dispatch('signupWithFacebook')
    },
    getValidationClass(fieldName) {
      const field = this.$v.form[fieldName]
      if (field) {
        return {
          'md-invalid': field.$invalid && field.$dirty
        }
      }
    }
  }
}
</script>

<style scoped>
  .title {
    text-align: center; 
    font-size: 2rem;
    padding: 8px 0;
  }

  .oauth-btns {
    text-align: center;
  }

  .options {
    text-align: center;
    font-size: 1.2rem;
    margin-bottom: -20px;
  }

  .card-actions {
    display: flex;
    flex-direction: column;
    margin: -20px auto 0 auto;
  }

  .submit-btn {
    margin: 0 auto;
  }

  .account-link {
    margin-top: 8px;
  }

  .auth-link {
    margin-left: 8px;
  }

  .facebook-btn {
    background: #4267B2 !important;
  }

  .snackbar {
    background: #424242 !important;
    color: #fff !important;
  }
</style>





