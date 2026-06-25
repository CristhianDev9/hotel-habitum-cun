import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import Footer from '@/components/Footer';

export default function Login() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [logoError, setLogoError] = useState(false);

  // Navegar al dashboard cuando la autenticación sea exitosa
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      await login(username, password);
      toast.success('Sesión iniciada correctamente');
      // La navegación la maneja el useEffect que observa isAuthenticated
    } catch (error) {
      toast.error('Credenciales inválidas. Intenta de nuevo.');
      console.error('Error en login:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary via-primary/80 to-primary/60">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex h-28 w-64 items-center justify-center rounded-xl bg-white border border-border shadow-lg overflow-hidden p-1">
              {!logoError ? (
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-full w-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-3xl font-bold text-primary">H</span>
              )}
            </div>
          </div>

          {/* Card */}
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-bold text-foreground">HabitumCUN</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sistema de Gestión Hotelera
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">
                    Usuario
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold h-10 animate-hover"
                >
                  {isLoading ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-muted-foreground">
                <p>Sistema de Gestión de Reservas Hoteleras</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
