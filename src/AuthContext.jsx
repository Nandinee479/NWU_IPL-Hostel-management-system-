import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      setUser(JSON.parse(stored));
      setLoading(false);
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const role = localStorage.getItem('auth_role');
        if (role === 'admin') {
          const data = { uid: firebaseUser.uid, email: firebaseUser.email, role: 'admin', name: 'Admin' };
          setUser(data);
          localStorage.setItem('auth_user', JSON.stringify(data));
        } else {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const data = { uid: firebaseUser.uid, email: firebaseUser.email, role: 'student', ...snap.data() };
            setUser(data);
            localStorage.setItem('auth_user', JSON.stringify(data));
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_role');
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const loginUser = (userData, role) => {
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_role', role);
    setUser(userData);
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
