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
  loginWithUsername: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (emailOrUser: string, pass: string) => Promise<{ success: boolean; error?: string }>;
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
    outlets: { view: false, edit: false }, // Strictly hidden for editor
    products: { view: false, edit: false }, // Strictly hidden for editor
    reports: { view: true, edit: false },
    users: { view: false, edit: false } // Strictly hidden for editor
  },
  viewer: { // Report Only role
    dashboard: { view: false, edit: false },
    inventory: { view: false, edit: false }, // Strictly hidden for report only
    forms: { view: false, edit: false }, // Strictly hidden for report only
    outlets: { view: false, edit: false }, // Strictly hidden for report only
    products: { view: false, edit: false }, // Strictly hidden for report only
    reports: { view: true, edit: false },
    users: { view: false, edit: false } // Strictly hidden for report only
  },
  driver: {
    dashboard: { view: true, edit: false },
    inventory: { view: false, edit: false }, // Strictly hidden for driver
    forms: { view: false, edit: false }, // Strictly hidden for driver
    outlets: { view: false, edit: false }, // Strictly hidden for driver
    products: { view: false, edit: false }, // Strictly hidden for driver
    reports: { view: true, edit: false },
    users: { view: false, edit: false } // Strictly hidden for driver
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
          window.dispatchEvent(new CustomEvent('barista-account-suspended'));
          return;
        }
        setUserProfile(latest);
        setRole(latest.role || 'viewer');
        localStorage.setItem('barista_simulated_user', JSON.stringify(latest));
      } else {
        // User account was deleted in Firestore! Revoke access immediately.
        setUserProfile(null);
        setRole('viewer');
        setIsSimulated(false);
        localStorage.removeItem('barista_simulated_user');
        window.dispatchEvent(new CustomEvent('barista-account-deleted'));
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

  const loginWithUsername = async (usernameInput: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // 0. Check client-side security lockout state
    const lockoutUntilStr = localStorage.getItem('barista_security_lockout_until');
    if (lockoutUntilStr) {
      const lockoutUntil = parseInt(lockoutUntilStr, 10);
      const now = Date.now();
      if (!isNaN(lockoutUntil) && now < lockoutUntil) {
        const remainingSec = Math.ceil((lockoutUntil - now) / 1000);
        return { 
          success: false, 
          error: `Too many failed attempts. Please wait ${remainingSec} seconds.` 
        };
      } else {
        localStorage.removeItem('barista_security_lockout_until');
      }
    }

    setLoading(true);
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanUser || !cleanPass) {
      setLoading(false);
      return { success: false, error: 'Invalid username or password.' };
    }

    try {
      // Small simulated delay for consistent timing
      await new Promise(r => setTimeout(r, 150));

      let matchedUser: UserProfile | null = null;

      // 1. Check if user account was deleted / blacklisted in Firestore
      try {
        const deletedSnap = await getDoc(doc(db, 'deleted_users', cleanUser));
        if (deletedSnap.exists()) {
          return { success: false, error: 'Invalid username or password.' };
        }
      } catch (delErr: any) {
        // Ignore read errors
      }

      // 2. Direct query against Firestore 'users' collection
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

      // 3. Fallback for valid initial users (skipping any in deleted_users)
      if (!matchedUser) {
        const initMatch = INITIAL_USERS.find(u => 
          (u.username || '').toLowerCase() === cleanUser ||
          (u.userIdCode || '').toLowerCase() === cleanUser ||
          (u.email || '').toLowerCase() === cleanUser
        );
        if (initMatch) {
          let isDeleted = false;
          try {
            const delDoc = await getDoc(doc(db, 'deleted_users', (initMatch.username || '').toLowerCase()));
            if (delDoc.exists()) isDeleted = true;
          } catch (e) {
            // ignore
          }
          if (!isDeleted) {
            matchedUser = initMatch;
            // Persist into Firestore users collection for future operations
            try {
              await setDoc(doc(db, 'users', initMatch.id), initMatch);
            } catch (persistErr) {
              console.warn('Could not persist initial user into users collection:', persistErr);
            }
          }
        }
      }

      if (!matchedUser) {
        return { success: false, error: 'Invalid username or password.' };
      }

      // 4. Check account active status
      if (matchedUser.status === 'suspended') {
        return { success: false, error: 'Invalid username or password.' };
      }

      // 5. Password verification
      const userPass = matchedUser.password || '123';
      let passwordMatches = (userPass === cleanPass);

      // Support common default variations for initial un-reset credentials
      if (!passwordMatches && userPass === '123') {
        const passLower = cleanPass.toLowerCase();
        if (matchedUser.username.toLowerCase() === 'admin') {
          passwordMatches = ['123', 'admin', 'admin123', 'barista', 'password'].includes(passLower);
        } else {
          passwordMatches = ['123', 'password', matchedUser.username.toLowerCase()].includes(passLower);
        }
      }

      if (!passwordMatches) {
        return { success: false, error: 'Invalid username or password.' };
      }

      // Success: Clear failed attempts and lockouts
      localStorage.removeItem('barista_security_failed_attempts');
      localStorage.removeItem('barista_security_lockout_until');

      setUserProfile(matchedUser);
      setRole(matchedUser.role || 'viewer');
      setIsSimulated(true);
      localStorage.setItem('barista_simulated_user', JSON.stringify(matchedUser));
      return { success: true };
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
        mustResetPassword: false,
        isFirstLogin: false 
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

    const currentRole = userProfile.role || role || 'viewer';

    // Administrator has unrestricted full access to all system modules and actions
    if (currentRole === 'admin') return true;

    // Explicit Policy 1: For Editor role - Strictly hide Outlets, Products, Users & Access
    if (currentRole === 'editor' && (module === 'outlets' || module === 'products' || module === 'users')) {
      return false;
    }

    // Explicit Policy 2: For Driver role - Strictly hide Inventory, Dispatch Forms, Outlets, Products, Users & Access
    if (currentRole === 'driver' && (module === 'inventory' || module === 'forms' || module === 'outlets' || module === 'products' || module === 'users')) {
      return false;
    }

    // Explicit Policy 3: For Report Only (Viewer) role - Strictly hide Inventory, Dispatch Forms, Outlets, Products, Users & Access
    if (currentRole === 'viewer' && (module === 'inventory' || module === 'forms' || module === 'outlets' || module === 'products' || module === 'users')) {
      return false;
    }

    // Safety lock: Outlets, Products, and Users management actions are strictly restricted to Administrators
    if ((module === 'outlets' || module === 'products' || module === 'users') && action === 'edit') {
      return false;
    }

    // Granular permissions assigned to this user profile
    if (userProfile.permissions && userProfile.permissions[module] !== undefined) {
      return !!userProfile.permissions[module]?.[action];
    }

    // Role-based defaults
    const defaults = DEFAULT_PERMISSIONS[currentRole];
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
