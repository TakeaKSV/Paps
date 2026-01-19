import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext();

const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    rfc: user.rfc,
    address: user.address,
    companyName: user.companyName,
    companyAddress: user.companyAddress,
    signatureName: user.signatureName,
    signatureTitle: user.signatureTitle,
    role: user.role
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include'
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(sanitizeUser(data.user));
    } catch (err) {
      console.error('Error obteniendo perfil:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async ({ rfc, password }) => {
    setError(null);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rfc, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.message || 'No se pudo iniciar sesión');
      throw new Error(errorData.message || 'No se pudo iniciar sesión');
    }

    const data = await response.json();
    setUser(sanitizeUser(data.user));
    return data.user;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    logout,
    refreshUser: fetchProfile
  }), [user, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
