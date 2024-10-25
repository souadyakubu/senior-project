import { initializeApp } from 'firebase/app';  // Correct import for initializing Firebase
import { getFirestore } from 'firebase/firestore';  // Correct import for Firestore

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const firebaseApp = initializeApp(firebaseConfig);  // Initialize Firebase app
const db = getFirestore(firebaseApp);  // Initialize Firestore

// Optional helper function for saving book progress
export const saveBookProgress = (bookId, chapterIndex) => {
    // Function logic to save the progress to Firestore
    db.collection('userProgress').doc('userId').set({
        bookId,
        chapterIndex,
    });
};

export { db };
