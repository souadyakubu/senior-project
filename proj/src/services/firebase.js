import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
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

// Authentication functions
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

// Modernization storage functions
export const saveModernization = async (bookId, section, modernizedText) => {
    const user = auth.currentUser;
    if (!user || !bookId) {
        return { error: 'User must be logged in and bookId is required' };
    }

    try {
        const sanitizedBookId = bookId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const modernizationRef = doc(db, 'users', user.uid, 'modernizations', `${sanitizedBookId}_${section}`);
        
        const docSnap = await getDoc(modernizationRef);
        
        if (docSnap.exists()) {
            await updateDoc(modernizationRef, {
                history: arrayUnion({
                    text: modernizedText,
                    timestamp: new Date().toISOString()
                })
            });
        } else {
            await setDoc(modernizationRef, {
                bookId: sanitizedBookId,
                section: section,
                history: [{
                    text: modernizedText,
                    timestamp: new Date().toISOString()
                }]
            });
        }
        
        return { error: null };
    } catch (error) {
        console.error('Save modernization error:', error);
        return { error: error.message };
    }
};

export const getModernizations = async (bookId, section) => {
    const user = auth.currentUser;
    if (!user || !bookId) {
        return { history: [], error: 'User must be logged in and bookId is required' };
    }

    try {
        const sanitizedBookId = bookId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const modernizationRef = doc(db, 'users', user.uid, 'modernizations', `${sanitizedBookId}_${section}`);
        
        const docSnap = await getDoc(modernizationRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            return { history: data.history || [], error: null };
        }
        return { history: [], error: null };
    } catch (error) {
        console.error('Get modernizations error:', error);
        return { history: [], error: error.message };
    }
};

export const deleteModernization = async (bookId, section, timestamp) => {
    const user = auth.currentUser;
    if (!user || !bookId) {
        return { error: 'User must be logged in and bookId is required' };
    }

    try {
        const sanitizedBookId = bookId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const modernizationRef = doc(db, 'users', user.uid, 'modernizations', `${sanitizedBookId}_${section}`);
        
        const docSnap = await getDoc(modernizationRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const itemToRemove = data.history.find(item => item.timestamp === timestamp);
            if (itemToRemove) {
                await updateDoc(modernizationRef, {
                    history: arrayRemove(itemToRemove)
                });
            }
        }
        
        return { error: null };
    } catch (error) {
        console.error('Delete modernization error:', error);
        return { error: error.message };
    }
};