import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { authService, roleService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Moon, Sun, LogOut, Menu, X, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { toast } from 'sonner';

interface Role {
  id_role: number;
  nombre: string;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    id_role: 1,
    nombre_completo: '',
    username: '',
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const response = await roleService.getAll();
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Error al cargar los roles');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (isRegisterOpen) {
      fetchRoles();
    }
  }, [isRegisterOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !registerForm.nombre_completo ||
      !registerForm.username ||
      !registerForm.email ||
      !registerForm.password
    ) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.register({
        id_role: registerForm.id_role,
        nombre_completo: registerForm.nombre_completo,
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
      });
      toast.success('Usuario creado correctamente');
      setIsRegisterOpen(false);
      setRegisterForm({
        id_role: 1,
        nombre_completo: '',
        username: '',
        email: '',
        password: '',
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      const msg = error?.response?.data?.message || 'Error al crear el usuario';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-12 w-36 items-center justify-center rounded-lg bg-white border border-border shadow-sm overflow-hidden p-0.5">
            {!logoError ? (
              <img
                src="/logo.png"
                alt="Logo"
                className="h-full w-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-lg font-bold text-primary">H</span>
            )}
          </div>
          {logoError && (
            <span className="hidden text-xl font-bold text-foreground sm:inline">HabitumCUN</span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
          <Link href="/dashboard" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/clientes" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Clientes
          </Link>
          <Link href="/reservas" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Reservas
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-accent-foreground text-sm font-semibold">
                    {user.nombre_completo.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{user.nombre_completo}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground py-2">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsRegisterOpen(true)}
                  className="gap-2 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  Crear nuevo usuario
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container flex flex-col gap-2 px-4 py-3">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/clientes"
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Clientes
            </Link>
            <Link
              href="/reservas"
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Reservas
            </Link>
          </div>
        </div>
      )}

      {/* Register Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario y asigna un rol para acceder al sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4 pt-2" noValidate>
            <div className="space-y-1">
              <Label htmlFor="id_role">Rol</Label>
              <select
                id="id_role"
                value={registerForm.id_role}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    id_role: parseInt(e.target.value),
                  }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                disabled={isLoadingRoles}
              >
                {roles.map((role) => (
                  <option key={role.id_role} value={role.id_role}>
                    {role.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="nombre_completo">Nombre Completo</Label>
              <Input
                id="nombre_completo"
                placeholder="Ej: Juan Pérez"
                value={registerForm.nombre_completo}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    nombre_completo: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                placeholder="Ej: juanperez"
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: juan@ejemplo.com"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsRegisterOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSubmitting || isLoadingRoles}
              >
                {isSubmitting ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </nav>
  );
}

