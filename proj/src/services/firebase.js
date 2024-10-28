import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDpsag3KQcOyzTiR9Xc_w-yPXnuEyrjtDg",
  authDomain: "ccel-tools.firebaseapp.com",
  projectId: "ccel-tools",
  storageBucket: "ccel-tools.appspot.com",
  messagingSenderId: "653125521567",
  appId: "1:653125521567:web:764b7432f36532279e52aa",
  measurementId: "G-2ZV6ELGWJR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions remain the same...
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const registerWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};



// // Highlight functions
// export const saveHighlight = async (bookId, highlight) => {
//   const user = auth.currentUser;
//   if (!user || !bookId) {
//     console.error('No user logged in or missing bookId');
//     return { error: 'User must be logged in and bookId is required' };
//   }

//   try {
//     // Create a sanitized bookId (remove special characters and spaces)
//     const sanitizedBookId = bookId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
//     const highlightRef = doc(db, 'users', user.uid, 'books', sanitizedBookId);
//     const docSnap = await getDoc(highlightRef);
    
//     if (docSnap.exists()) {
//       await updateDoc(highlightRef, {
//         highlights: arrayUnion({
//           ...highlight,
//           createdAt: new Date().toISOString()
//         })
//       });
//     } else {
//       await setDoc(highlightRef, {
//         highlights: [{
//           ...highlight,
//           createdAt: new Date().toISOString()
//         }],
//         bookId: sanitizedBookId,
//         title: bookId, // Store original title
//         createdAt: new Date().toISOString()
//       });
//     }
    
//     return { error: null };
//   } catch (error) {
//     console.error('Save highlight error:', error);
//     return { error: error.message };
//   }
// };

// export const getHighlights = async (bookId) => {
//   const user = auth.currentUser;
//   if (!user || !bookId) {
//     console.error('No user logged in or missing bookId');
//     return { highlights: [], error: 'User must be logged in and bookId is required' };
//   }

//   try {
//     const sanitizedBookId = bookId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
//     const highlightRef = doc(db, 'users', user.uid, 'books', sanitizedBookId);
//     const docSnap = await getDoc(highlightRef);
    
//     if (docSnap.exists()) {
//       const data = docSnap.data();
//       return { highlights: data.highlights || [], error: null };
//     }
//     return { highlights: [], error: null };
//   } catch (error) {
//     console.error('Get highlights error:', error);
//     return { highlights: [], error: error.message };
//   }
// };

// export const removeHighlight = async (bookId, highlightToRemove) => {
//   const user = auth.currentUser;
//   if (!user || !bookId) {
//     console.error('No user logged in or missing bookId');
//     return { error: 'User must be logged in and bookId is required' };
//   }

//   try {
//     const sanitizedBookId = bookId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
//     const highlightRef = doc(db, 'users', user.uid, 'books', sanitizedBookId);
    
//     await updateDoc(highlightRef, {
//       highlights: arrayRemove(highlightToRemove)
//     });
    
//     return { error: null };
//   } catch (error) {
//     console.error('Remove highlight error:', error);
//     return { error: error.message };
//   }
// };