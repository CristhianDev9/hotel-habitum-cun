import { useEffect, useState } from 'react';
import { roleService } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id_role: number;
  nombre: string;
  descripcion?: string;
}

interface RoleForm {
  nombre: string;
  descripcion: string;
}

interface RoleErrors {
  nombre?: string;
}

function validateRoleForm(data: RoleForm): RoleErrors {
  const errors: RoleErrors = {};
  if (!data.nombre.trim()) {
    errors.nombre = 'El nombre del rol es obligatorio';
  } else if (data.nombre.trim().length < 3) {
    errors.nombre = 'El nombre debe tener al menos 3 caracteres';
  }
  return errors;
}

function FieldWrapper({ error, touched, children }: {
  error?: string;
  touched?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {children}
      {touched && error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
      {touched && !error && (
        <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          Correcto
        </p>
      )}
    </div>
  );
}

const initialForm: RoleForm = {
  nombre: '',
  descripcion: '',
};

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleForm>(initialForm);
  const [errors, setErrors] = useState<RoleErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await roleService.getAll();
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Error al cargar los roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const resetForm = () => {
    setFormData(initialForm);
    setErrors({});
    setTouched({});
    setSelectedRole(null);
    setIsEditMode(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({ nombre: role.nombre, descripcion: role.descripcion ?? '' });
    setErrors({});
    setTouched({});
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteRole = async (id: number) => {
    const confirmed = window.confirm('¿Seguro que deseas eliminar este rol? Esta acción es irreversible.');
    if (!confirmed) return;

    try {
      await roleService.delete(id);
      toast.success('Rol eliminado correctamente');
      fetchRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      const msg = error?.response?.data?.message || 'Error al eliminar el rol';
      toast.error(msg);
    }
  };

  const handleChange = (field: keyof RoleForm, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateRoleForm(updated));
  };

  const handleBlur = (field: keyof RoleForm) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateRoleForm(formData));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    const validationErrors = validateRoleForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Corrige los errores antes de continuar');
      return;
    }

    if (isEditMode && selectedRole) {
      const confirmed = window.confirm('¿Deseas guardar los cambios en este rol?');
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode && selectedRole) {
        await roleService.update(selectedRole.id_role, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        });
        toast.success('Rol actualizado correctamente');
      } else {
        await roleService.create({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        });
        toast.success('Rol creado correctamente');
      }
      resetForm();
      setIsDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error('Error saving role:', error);
      const msg = error?.response?.data?.message || 'Error al guardar el rol';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formValid = Object.keys(validateRoleForm(formData)).length === 0 && formData.nombre.trim().length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container py-8 flex-grow">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Roles</h1>
            <p className="text-muted-foreground mt-2">Crea y administra roles para el sistema.</p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4" />
            Nuevo Rol
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Roles</CardTitle>
            <CardDescription>Total: {roles.length} roles</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay roles registrados aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre del Rol</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id_role}>
                        <TableCell>{role.nombre}</TableCell>
                        <TableCell>{role.descripcion ?? '-'}</TableCell>
                        <TableCell className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(role)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id_role)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Editar Rol' : 'Crear Rol'}</DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? 'Actualiza la información del rol y confirma para guardar los cambios.'
                  : 'Ingresa un nombre y una descripción para el nuevo rol.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
              <FieldWrapper error={errors.nombre} touched={touched.nombre}>
                <Label htmlFor="nombre">Nombre del Rol</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Administrador"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  onBlur={() => handleBlur('nombre')}
                />
              </FieldWrapper>

              <div className="space-y-1">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  placeholder="Ej: Puede gestionar clientes, reservas y roles"
                  value={formData.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isSubmitting || !formValid}
                >
                  {isSubmitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear rol'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
