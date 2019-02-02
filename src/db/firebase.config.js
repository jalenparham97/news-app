import firebase from 'firebase'

const config = {
  apiKey: "AIzaSyBISoi-Sd98PYtwMf8xUA03RKctiuNMZ78",
  authDomain: "news-app-5909c.firebaseapp.com",
  databaseURL: "https://news-app-5909c.firebaseio.com",
  projectId: "news-app-5909c",
  storageBucket: "news-app-5909c.appspot.com",
  messagingSenderId: "1045669352894"
};
firebase.initializeApp(config);

export default firebase;