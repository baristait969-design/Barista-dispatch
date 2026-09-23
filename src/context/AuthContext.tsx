import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole, ModulePermissions } from '../types';
import { INITIAL_USERS } from '../data/seedData';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isSimulated: boolean;
  signInWithGoogle: () => Promise<void>;
  loginDemoRole: (role: UserRole) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: (module: keyof ModulePermissions, action?: 'view' | 'edit') => boolean;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  admin: {
    dashboard: { view: true, edit: true },
    inventory: { view: true, edit: true },
    forms: { view: true, edit: true },
    outlets: { view: true, edit: true },
    users: { view: true, edit: true },
    roles: { view: true, edit: true },
    reports: { view: true, edit: true }
  },
  editor: {
    dashboard: { view: true, edit: false },
    inventory: { view: true, edit: true },
    forms: { view: true, edit: true },
    outlets: { view: true, edit: true },
    users: { view: true, edit: false },
    roles: { view: true, edit: false },
    reports: { view: true, edit: false }
  },
  viewer: {
    dashboard: { view: true, edit: false },
    inventory: { view: true, edit: false },
    forms: { view: true, edit: false },
    outlets: { view: true, edit: false },
    users: { view: false, edit: false },
    roles: { view: false, edit: false },
    reports: { view: true, edit: false }
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // Restore simulated user from localStorage if present
  useEffect(() => {
    const savedSimulated = localStorage.getItem('barista_simulated_user');
    if (savedSimulated) {
      try {
        const parsed = JSON.parse(savedSimulated);
        setUserProfile(parsed);
        setRole(parsed.role || 'admin');
        setIsSimulated(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('barista_simulated_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsSimulated(false);
        localStorage.removeItem('barista_simulated_user');
        await loadOrCreateUserProfile(user);
      } else {
        if (!localStorage.getItem('barista_simulated_user')) {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadOrCreateUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        setUserProfile(data);
        setRole(data.role || 'viewer');
      } else {
        // Auto-assign admin if owner email
        const isOwnerAdmin = user.email === 'baristait969@gmail.com' || (user.email && user.email.includes('admin'));
        const assignedRole: UserRole = isOwnerAdmin ? 'admin' : 'editor';
        const newProfile: UserProfile = {
          id: user.uid,
          uid: user.uid,
          userIdCode: `USR-${user.uid.slice(0, 5).toUpperCase()}`,
          email: user.email || 'user@barista.lk',
          displayName: user.displayName || user.email?.split('@')[0] || 'Kitchen Staff',
          role: assignedRole,
          designation: isOwnerAdmin ? 'QA Executive / System Admin' : 'Pastry Central Kitchen Supervisor',
          department: 'Pastry Kitchen & Central Logistics',
          permissions: DEFAULT_PERMISSIONS[assignedRole],
          createdAt: new Date().toISOString()
        };

        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        setRole(assignedRole);
      }
    } catch (err) {
      console.warn('Could not sync user profile with Firestore, using fallback profile:', err);
      // Fallback
      const isOwnerAdmin = user.email === 'baristait969@gmail.com';
      const fallbackRole: UserRole = isOwnerAdmin ? 'admin' : 'editor';
      const profile: UserProfile = {
        id: user.uid,
        uid: user.uid,
        userIdCode: `USR-${user.uid.slice(0, 5).toUpperCase()}`,
        email: user.email || 'user@barista.lk',
        displayName: user.displayName || 'Authorized User',
        role: fallbackRole,
        permissions: DEFAULT_PERMISSIONS[fallbackRole],
        createdAt: new Date().toISOString()
      };
      setUserProfile(profile);
      setRole(fallbackRole);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setIsSimulated(false);
        localStorage.removeItem('barista_simulated_user');
        await loadOrCreateUserProfile(result.user);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        setIsSimulated(false);
        localStorage.removeItem('barista_simulated_user');
        await loadOrCreateUserProfile(cred.user);
      }
    } catch (err: any) {
      // 1. Check if user was provisioned by Administrator in Firestore 'users' collection
      try {
        const userQ = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
        const userSnapshot = await getDocs(userQ);
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = { ...userDoc.data(), id: userDoc.id } as UserProfile;
          setUserProfile(userData);
          setRole(userData.role || 'viewer');
          setIsSimulated(true);
          localStorage.setItem('barista_simulated_user', JSON.stringify(userData));
          setLoading(false);
          return;
        }
      } catch (dbErr) {
        console.warn('Could not query users collection fallback:', dbErr);
      }

      // 2. Check if matching preset staff accounts for university presentation convenience
      const demoMatch = INITIAL_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (demoMatch) {
        setUserProfile(demoMatch);
        setRole(demoMatch.role);
        setIsSimulated(true);
        localStorage.setItem('barista_simulated_user', JSON.stringify(demoMatch));
        setLoading(false);
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, selectedRole: UserRole) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newProfile: UserProfile = {
        id: cred.user.uid,
        uid: cred.user.uid,
        userIdCode: `USR-${Math.floor(100 + Math.random() * 900)}`,
        email,
        displayName: name,
        role: selectedRole,
        designation: selectedRole === 'admin' ? 'QA Executive / Admin' : selectedRole === 'editor' ? 'Pastry Supervisor' : 'Store Auditor',
        department: 'Central Kitchen & Outlets',
        permissions: DEFAULT_PERMISSIONS[selectedRole],
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setUserProfile(newProfile);
      setRole(selectedRole);
      setIsSimulated(false);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginDemoRole = (targetRole: UserRole) => {
    const demoUser = INITIAL_USERS.find(u => u.role === targetRole) || INITIAL_USERS[0];
    const customizedUser: UserProfile = {
      ...demoUser,
      permissions: DEFAULT_PERMISSIONS[targetRole]
    };
    setUserProfile(customizedUser);
    setRole(targetRole);
    setIsSimulated(true);
    localStorage.setItem('barista_simulated_user', JSON.stringify(customizedUser));
  };

  const logout = async () => {
    try {
      if (currentUser) {
        await fbSignOut(auth);
      }
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(null);
    setUserProfile(null);
    setIsSimulated(false);
    localStorage.removeItem('barista_simulated_user');
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await loadOrCreateUserProfile(currentUser);
    }
  };

  const hasAccess = (module: keyof ModulePermissions, action: 'view' | 'edit' = 'view'): boolean => {
    if (!userProfile) return false;
    if (userProfile.role === 'admin') return true;

    // Check custom permissions first if assigned
    if (userProfile.permissions && userProfile.permissions[module]) {
      return !!userProfile.permissions[module]?.[action];
    }

    // Role-based defaults
    const defaults = DEFAULT_PERMISSIONS[userProfile.role];
    if (defaults && defaults[module]) {
      return !!defaults[module][action];
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        loading,
        isSimulated,
        signInWithGoogle,
        loginDemoRole,
        loginWithEmail,
        registerWithEmail,
        logout,
        hasAccess,
        refreshProfile
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
