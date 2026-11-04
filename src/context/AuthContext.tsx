import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';

export const ROOT_ADMIN_EMAIL = 'cleefordtayaban6@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAdmin = Boolean(
    currentUser?.email &&
    currentUser.email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()
  ) || profile?.role === 'admin';

  const syncUserProfile = async (user: User) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const isRootAdmin = (user.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase());

      // If root administrator, ensure admin privilege document exists
      if (isRootAdmin) {
        try {
          await setDoc(
            doc(db, 'admins', user.uid),
            {
              email: user.email,
              grantedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('Could not update admin registry:', e);
        }
      }

      const snap = await getDoc(userDocRef);
      const now = new Date().toISOString();

      if (snap.exists()) {
        const data = snap.data();
        const effectiveRole: UserRole = isRootAdmin ? 'admin' : (data.role || 'viewer');
        const userProf: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          photoURL: user.photoURL || undefined,
          role: effectiveRole,
          status: data.status || 'active',
          createdAt: data.createdAt || now,
          lastLoginAt: now,
          canShareScreen: data.canShareScreen ?? true,
          canGenerateText: data.canGenerateText ?? true,
          notes: data.notes || '',
        };

        // Update last login
        await updateDoc(userDocRef, {
          lastLoginAt: serverTimestamp(),
          displayName: userProf.displayName,
          photoURL: userProf.photoURL || null,
          ...(isRootAdmin ? { role: 'admin' } : {}),
        });

        setProfile(userProf);
      } else {
        // Create initial profile
        const newProf: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || undefined,
          role: isRootAdmin ? 'admin' : 'presenter',
          status: 'active',
          createdAt: now,
          lastLoginAt: now,
          canShareScreen: true,
          canGenerateText: true,
          notes: isRootAdmin ? 'Platform Administrator' : 'Standard Account',
        };

        await setDoc(userDocRef, {
          ...newProf,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });

        setProfile(newProf);
      }
    } catch (err: any) {
      console.error('Error syncing user profile:', err);
      // Fallback in-memory profile if Firestore write is blocked
      const isRootAdmin = (user.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase());
      setProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || undefined,
        role: isRootAdmin ? 'admin' : 'viewer',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        canShareScreen: true,
        canGenerateText: true,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setAuthError(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setProfile(null);
      setCurrentUser(null);
    } catch (err: any) {
      console.error('Sign-out failed:', err);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await syncUserProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        isAdmin,
        isLoading,
        loginWithGoogle,
        logout,
        refreshProfile,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
