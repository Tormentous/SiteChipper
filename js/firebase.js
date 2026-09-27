// public/js/firebase.js
// Full CDN imports for plain HTML/JS (no bundler)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcxFPQU10CvAR8aEas54DEo7foxynsaeM",
  authDomain: "coolbrador.firebaseapp.com",
  projectId: "coolbrador",
  storageBucket: "coolbrador.firebasestorage.app",
  messagingSenderId: "295802425127",
  appId: "1:295802425127:web:fe68d85c00311cec25a302",
  measurementId: "G-HFHWZP631W"
};

const app = initializeApp(firebaseConfig);

// This line is REQUIRED – it creates and EXPORTS the auth object
export const auth = getAuth(app);

