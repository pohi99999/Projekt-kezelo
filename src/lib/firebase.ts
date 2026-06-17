import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyABP-TWgS9VdfXppVFCE2Rt0rntfH31rRU",
  authDomain: "bas1987.firebaseapp.com",
  projectId: "bas1987",
  storageBucket: "bas1987.firebasestorage.app",
  messagingSenderId: "1064371205091",
  appId: "1:1064371205091:web:8370fab7e221d6c83066d6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, 'ai-studio-6312b315-ce52-4f30-8aae-b648db4ff083');
export const auth = getAuth(app);
