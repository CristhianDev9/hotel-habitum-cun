import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  return null;
}
