import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByInpMod3R3d5r0wuWTgKJ0jZpmUqrBPQ",
  authDomain: "niceville-polynomial-quest.firebaseapp.com",
  projectId: "niceville-polynomial-quest",
  storageBucket: "niceville-polynomial-quest.firebasestorage.app",
  messagingSenderId: "580371582308",
  appId: "1:580371582308:web:87759d5c9816510d0b7e71",
  measurementId: "G-PQKQ99GGSH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);