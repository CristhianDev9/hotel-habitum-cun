import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeAPI } from '@/services/api';

interface User {
  id_usuario: number;
  id_role: number;
  nombre_completo: string;
  username: string;
  email?: string;
  activo?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sesión desde localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        initializeAPI(storedToken);
      } catch (error) {
        console.error('Error restaurando sesión:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      let apiUrl = import.meta.env.VITE_API_URL || 'https://hotel-backend-625r.onrender.com';
      apiUrl = apiUrl.replace(/\/api\/?$/, '');
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();
      // La API puede devolver el usuario como "usuario" o "user"
      const newToken = data.token;
      const userData: User = data.usuario ?? data.user;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      // Inicializar API con el nuevo token
      initializeAPI(newToken);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
