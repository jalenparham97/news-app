import firebase from './firebase.config';

const db = firebase.firestore();

db.settings({ timestampsInSnapshots: true });

export default db;