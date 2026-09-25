import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocs, query, where, collection, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole, ModulePermissions } from '../types';
import { INITIAL_USERS } from '../data/seedData';
import { updateUserPassword } from '../services/dataService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isSimulated: boolean;
  loginWithUsername: (username: string, pass: string) => Promise<void>;
  loginWithEmail: (emailOrUser: string, pass: string) => Promise<void>;
  updateCurrentUserPassword: (newPassword: string) => Promise<void>;
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
    products: { view: true, edit: true },
    reports: { view: true, edit: true },
    users: { view: true, edit: true }
  },
  editor: {
    dashboard: { view: true, edit: false },
    inventory: { view: true, edit: true },
    forms: { view: true, edit: true },
    outlets: { view: true, edit: false }, // Only admin can edit, add, delete, or suspend outlets
    products: { view: true, edit: false }, // Admin manages product master catalog; Editor has view
    reports: { view: true, edit: false },
    users: { view: true, edit: false }
  },
  viewer: {
    dashboard: { view: false, edit: false },
    inventory: { view: false, edit: false },
    forms: { view: false, edit: false },
    outlets: { view: false, edit: false },
    products: { view: false, edit: false },
    reports: { view: true, edit: false },
    users: { view: false, edit: false }
  },
  driver: {
    dashboard: { view: false, edit: false },
    inventory: { view: false, edit: false },
    forms: { view: false, edit: false },
    outlets: { view: false, edit: false },
    products: { view: false, edit: false },
    reports: { view: true, edit: false },
    users: { view: false, edit: false }
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

  // Real-time synchronization of active user's profile and permissions from Firestore
  useEffect(() => {
    if (!userProfile?.id) return;
    const unsub = onSnapshot(doc(db, 'users', userProfile.id), (docSnap) => {
      if (docSnap.exists()) {
        const latest = { ...docSnap.data(), id: docSnap.id } as UserProfile;
        // Check if account was suspended by admin
        if (latest.status === 'suspended') {
          setUserProfile(null);
          setRole('viewer');
          setIsSimulated(false);
          localStorage.removeItem('barista_simulated_user');
          alert('Your user account has been suspended by an Administrator. You have been signed out.');
          return;
        }
        setUserProfile(latest);
        setRole(latest.role || 'viewer');
        localStorage.setItem('barista_simulated_user', JSON.stringify(latest));
      }
    }, (error) => {
      console.warn('Real-time profile listener error:', error);
    });
    return () => unsub();
  }, [userProfile?.id]);

  const loadOrCreateUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        setUserProfile(data);
        setRole(data.role || 'viewer');
      } else {
        const uName = user.email ? user.email.split('@')[0] : 'admin';
        const isOwnerAdmin = uName === 'admin' || user.email?.includes('admin');
        const assignedRole: UserRole = isOwnerAdmin ? 'admin' : 'editor';
        const newProfile: UserProfile = {
          id: user.uid,
          uid: user.uid,
          username: uName,
          userIdCode: `USR-${user.uid.slice(0, 5).toUpperCase()}`,
          email: user.email || `${uName}@barista.lk`,
          displayName: user.displayName || uName,
          role: assignedRole,
          designation: isOwnerAdmin ? 'QA Executive / System Admin' : 'Pastry Central Kitchen Supervisor',
          department: 'Pastry Kitchen & Central Logistics',
          permissions: DEFAULT_PERMISSIONS[assignedRole],
          mustResetPassword: false,
          createdAt: new Date().toISOString()
        };

        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        setRole(assignedRole);
      }
    } catch (err) {
      console.warn('Could not sync user profile with Firestore, using fallback profile:', err);
      // Fallback
      const isOwnerAdmin = user.email?.includes('admin') || false;
      const fallbackRole: UserRole = isOwnerAdmin ? 'admin' : 'editor';
      const uName = user.email ? user.email.split('@')[0] : 'admin';
      const profile: UserProfile = {
        id: user.uid,
        uid: user.uid,
        username: uName,
        userIdCode: `USR-${user.uid.slice(0, 5).toUpperCase()}`,
        email: user.email || `${uName}@barista.lk`,
        displayName: user.displayName || 'Authorized User',
        role: fallbackRole,
        permissions: DEFAULT_PERMISSIONS[fallbackRole],
        mustResetPassword: false,
        createdAt: new Date().toISOString()
      };
      setUserProfile(profile);
      setRole(fallbackRole);
    }
  };

  const loginWithUsername = async (usernameInput: string, pass: string) => {
    setLoading(true);
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanUser) {
      setLoading(false);
      throw new Error('Please enter your staff username or ID.');
    }
    if (!cleanPass) {
      setLoading(false);
      throw new Error('Please enter your password.');
    }

    try {
      let matchedUser: UserProfile | null = null;

      // 1. Direct query against Firestore 'users' collection
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (!usersSnap.empty) {
          for (const docSnap of usersSnap.docs) {
            const data = { ...docSnap.data(), id: docSnap.id } as UserProfile;
            const uName = (data.username || '').toLowerCase();
            const uCode = (data.userIdCode || '').toLowerCase();
            const uMail = (data.email || '').toLowerCase();

            if (uName === cleanUser || uCode === cleanUser || uMail === cleanUser) {
              matchedUser = data;
              break;
            }
          }
        }
      } catch (dbErr: any) {
        console.warn('Could not query users collection in Firestore:', dbErr);
      }

      // 2. Direct check in INITIAL_USERS fallback
      if (!matchedUser) {
        const demoMatch = INITIAL_USERS.find(u => 
          (u.username && u.username.toLowerCase() === cleanUser) ||
          (u.userIdCode && u.userIdCode.toLowerCase() === cleanUser) ||
          (u.email && u.email.toLowerCase() === cleanUser)
        );
        if (demoMatch) {
          matchedUser = demoMatch;
        }
      }

      if (!matchedUser) {
        throw new Error(`User account "${usernameInput}" was not found. Please verify your username or contact the Administrator.`);
      }

      // 3. Check account active status
      if (matchedUser.status === 'suspended') {
        throw new Error('This user account has been suspended by an Administrator. Please contact IT.');
      }

      // 4. Password verification
      if (matchedUser.password && matchedUser.password !== cleanPass) {
        throw new Error('Incorrect password. If you forgot your password, an Administrator can reset it for you.');
      }

      setUserProfile(matchedUser);
      setRole(matchedUser.role || 'viewer');
      setIsSimulated(true);
      localStorage.setItem('barista_simulated_user', JSON.stringify(matchedUser));
      return;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (emailOrUser: string, pass: string) => {
    return loginWithUsername(emailOrUser, pass);
  };

  const updateCurrentUserPassword = async (newPassword: string) => {
    if (!userProfile) return;
    const cleanPass = newPassword.trim();
    if (!cleanPass) {
      throw new Error('New password cannot be empty.');
    }
    try {
      await updateUserPassword(userProfile.id, cleanPass, true);
      const updated: UserProfile = { 
        ...userProfile, 
        password: cleanPass, 
        mustResetPassword: false 
      };
      setUserProfile(updated);
      localStorage.setItem('barista_simulated_user', JSON.stringify(updated));
    } catch (err: any) {
      console.error('Error updating current user password:', err);
      throw err;
    }
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
    if (userProfile.status === 'suspended') return false;

    // Granular permissions assigned to this user always take primary precedence
    if (userProfile.permissions && userProfile.permissions[module] !== undefined) {
      // Outlets edit is strictly restricted to administrator role for system safety
      if (module === 'outlets' && action === 'edit' && userProfile.role !== 'admin') {
        return false;
      }
      return !!userProfile.permissions[module]?.[action];
    }

    // Role-based defaults when no granular override is set
    if (userProfile.role === 'admin') return true;

    if (userProfile.role === 'viewer') {
      return module === 'reports' && action === 'view';
    }

    // Strict rule: only admin can edit, add, delete, or suspend the outlet list
    if (module === 'outlets' && action === 'edit') {
      return false;
    }

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
        loginWithUsername,
        loginWithEmail,
        updateCurrentUserPassword,
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
