import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  loginWithFirebase,
  loginWithGoogle as signInWithGoogle,
  logoutFromFirebase,
  signupWithFirebase,
  subscribeToFirebaseSession,
} from '../services/firebaseAuthService';

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('ai_job_portal_user'));
  } catch {
    return null;
  }
}

function persistUser(user) {
  if (user) {
    localStorage.setItem('ai_job_portal_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('ai_job_portal_user');
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToFirebaseSession(currentUser => {
      setUser(currentUser);
      persistUser(currentUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    async login(credentials) {
      const currentUser = await loginWithFirebase(credentials);
      setUser(currentUser);
      persistUser(currentUser);
      return currentUser;
    },
    async register(payload) {
      const currentUser = await signupWithFirebase(payload);
      setUser(currentUser);
      persistUser(currentUser);
      return currentUser;
    },
    async loginWithGoogle(role = 'candidate') {
      const currentUser = await signInWithGoogle(role);
      setUser(currentUser);
      persistUser(currentUser);
      return currentUser;
    },
    async logout() {
      await logoutFromFirebase();
      localStorage.removeItem('ai_job_portal_token');
      localStorage.removeItem('ai_job_portal_firebase_token');
      localStorage.removeItem('ai_job_portal_user');
      sessionStorage.removeItem('afaiInterview');
      setUser(null);
    },
  }), [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
