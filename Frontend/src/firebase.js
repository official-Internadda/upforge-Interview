import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDZqthtRvba3HGUNL2Km8Zy-69cATfD-v4",
  authDomain: "upforge-ai-interview.firebaseapp.com",
  projectId: "upforge-ai-interview",
  storageBucket: "upforge-ai-interview.firebasestorage.app",
  messagingSenderId: "874415250689",
  appId: "1:874415250689:web:c9905fc324ab97afd94f00"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
