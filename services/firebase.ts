import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBH6nvv_JkrMX9lLoKg_tI_Utf8349HWDc", 
  authDomain: "sismun-ns.firebaseapp.com",
  projectId: "sismun-ns",
  storageBucket: "sismun-ns.appspot.com",
  messagingSenderId: "805656978960", 
  appId: "1:805656978960:web:c37c3249de6cb508370c95"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);