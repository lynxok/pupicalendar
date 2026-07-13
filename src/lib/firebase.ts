import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0173788778",
  appId: "1:215556747892:web:4ab934454a0d51d2709721",
  apiKey: "AIzaSyA779bmE8WmlH43pFUP1ux5RtcM6wv2Gwc",
  authDomain: "gen-lang-client-0173788778.firebaseapp.com",
  storageBucket: "gen-lang-client-0173788778.firebasestorage.app",
  messagingSenderId: "215556747892"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence failed: Browser not supported');
    }
  });
}

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.addScope('https://www.googleapis.com/auth/calendar');

let cachedAccessToken: string | null = (typeof window !== 'undefined') 
  ? sessionStorage.getItem('pupi_google_access_token') 
  : null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pupi_google_access_token');
        }
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No access token received');
    }
    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pupi_google_access_token', cachedAccessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = () => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = sessionStorage.getItem('pupi_google_access_token');
  }
  return cachedAccessToken;
};
