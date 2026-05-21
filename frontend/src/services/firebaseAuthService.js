import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../firebase';
import { loginUser, registerUser } from './authService';

const usersCollection = 'users';

function formatFirebaseError(error, fallback) {
  const messages = {
    'auth/email-already-in-use': 'Email already registered.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/missing-password': 'Password is required.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/weak-password': 'Password must be at least 6 characters.',
  };

  return messages[error?.code] || error?.message || fallback;
}

function formatApiError(error, fallback) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;
}

function persistBackendSession(data) {
  if (data?.token) {
    localStorage.setItem('ai_job_portal_token', data.token);
  }

  return data?.user || data;
}

function getStoredBackendSession() {
  try {
    return JSON.parse(localStorage.getItem('ai_job_portal_user') || 'null');
  } catch {
    return null;
  }
}

function normalizeUser(firebaseUser, profile = {}) {
  if (!firebaseUser) return null;

  return {
    _id: firebaseUser.uid,
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    name: profile.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    email: firebaseUser.email,
    role: profile.role || 'candidate',
    profile: profile.profile || {
      phone: '',
      skills: [],
      experience: '',
      education: '',
      resume: null,
    },
  };
}

async function getUserProfile(uid) {
  if (!db) return null;
  const snapshot = await getDoc(doc(db, usersCollection, uid));
  return snapshot.exists() ? snapshot.data() : null;
}

async function saveUserProfile(firebaseUser, payload = {}) {
  const userRef = doc(db, usersCollection, firebaseUser.uid);
  const existing = await getUserProfile(firebaseUser.uid);
  const profile = {
    name: payload.name || existing?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    email: firebaseUser.email,
    role: payload.role || existing?.role || 'candidate',
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, {
    ...profile,
    createdAt: existing?.createdAt || serverTimestamp(),
  }, { merge: true });

  return {
    ...existing,
    ...profile,
  };
}

async function storeFirebaseToken(firebaseUser) {
  const token = await firebaseUser.getIdToken();
  localStorage.setItem('ai_job_portal_firebase_token', token);
  return token;
}

async function syncLegacyBackendTokenForEmailPassword(payload, mode) {
  try {
    const data = mode === 'register'
      ? await registerUser(payload).catch(error => {
        if (error.response?.status === 409) return loginUser(payload);
        throw error;
      })
      : await loginUser(payload);

    if (data?.token) {
      localStorage.setItem('ai_job_portal_token', data.token);
    }
  } catch {
    localStorage.removeItem('ai_job_portal_token');
  }
}

export async function signupWithFirebase(payload) {
  if (!isFirebaseConfigured) {
    try {
      return persistBackendSession(await registerUser(payload));
    } catch (error) {
      throw new Error(formatApiError(error, 'Registration failed.'));
    }
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    await updateProfile(credential.user, { displayName: payload.name });
    const profile = await saveUserProfile(credential.user, {
      name: payload.name,
      role: payload.role,
    });
    await storeFirebaseToken(credential.user);
    await syncLegacyBackendTokenForEmailPassword(payload, 'register');
    return normalizeUser(credential.user, profile);
  } catch (error) {
    throw new Error(formatFirebaseError(error, 'Registration failed.'));
  }
}

export async function loginWithFirebase(credentials) {
  if (!isFirebaseConfigured) {
    try {
      return persistBackendSession(await loginUser(credentials));
    } catch (error) {
      throw new Error(formatApiError(error, 'Login failed.'));
    }
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    let profile = await getUserProfile(credential.user.uid);
    if (!profile) {
      profile = await saveUserProfile(credential.user);
    }
    await storeFirebaseToken(credential.user);
    await syncLegacyBackendTokenForEmailPassword(credentials, 'login');
    return normalizeUser(credential.user, profile);
  } catch (error) {
    try {
      return persistBackendSession(await loginUser(credentials));
    } catch (apiError) {
      throw new Error(formatApiError(apiError, formatFirebaseError(error, 'Login failed.')));
    }
  }
}

export async function loginWithGoogle(role = 'candidate') {
  if (!isFirebaseConfigured) {
    throw new Error('Google sign-in needs Firebase configuration. Use email/password login or add your Firebase Vite env variables.');
  }

  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const profile = await saveUserProfile(credential.user, { role });
    await storeFirebaseToken(credential.user);
    localStorage.removeItem('ai_job_portal_token');
    return normalizeUser(credential.user, profile);
  } catch (error) {
    throw new Error(formatFirebaseError(error, 'Google sign-in failed.'));
  }
}

export async function logoutFromFirebase() {
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToFirebaseSession(callback) {
  if (!isFirebaseConfigured) {
    try {
      callback(JSON.parse(localStorage.getItem('ai_job_portal_user') || 'null'));
    } catch {
      callback(null);
    }
    return () => {};
  }

  return onAuthStateChanged(auth, async firebaseUser => {
    try {
      if (!firebaseUser) {
        callback(getStoredBackendSession());
        return;
      }

      const profile = await getUserProfile(firebaseUser.uid);
      await storeFirebaseToken(firebaseUser);
      callback(normalizeUser(firebaseUser, profile || {}));
    } catch {
      callback(null);
    }
  });
}
