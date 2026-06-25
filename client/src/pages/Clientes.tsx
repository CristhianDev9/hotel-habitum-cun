import { useEffect, useState } from 'react';
import { clientService } from '@/services/api';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Pencil, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Cliente {
  id_cliente: number;
  documento_identidad: string;
  nombre_completo: string;
  email: string;
  telefono: string;
}

interface FormErrors {
  documento_identidad?: string;
  nombre_completo?: string;
  email?: string;
  telefono?: string;
}

// ─── Validation helpers ────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(data: {
  documento_identidad: string;
  nombre_completo: string;
  email: string;
  telefono: string;
}): FormErrors {
  const errors: FormErrors = {};

  // Documento: solo dígitos, entre 6 y 11 caracteres
  if (!data.documento_identidad) {
    errors.documento_identidad = 'El documento es obligatorio';
  } else if (!/^\d+$/.test(data.documento_identidad)) {
    errors.documento_identidad = 'Solo se permiten números';
  } else if (data.documento_identidad.length < 6) {
    errors.documento_identidad = 'Mínimo 6 dígitos';
  } else if (data.documento_identidad.length > 11) {
    errors.documento_identidad = 'Máximo 11 dígitos';
  }

  // Nombre: mínimo 3 caracteres
  if (!data.nombre_completo) {
    errors.nombre_completo = 'El nombre es obligatorio';
  } else if (data.nombre_completo.trim().length < 3) {
    errors.nombre_completo = 'Mínimo 3 caracteres';
  }

  // Email: formato válido
  if (!data.email) {
    errors.email = 'El email es obligatorio';
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Ingresa un email con formato válido (ej: usuario@dominio.com)';
  }

  // Teléfono: solo dígitos, máximo 10 caracteres
  if (!data.telefono) {
    errors.telefono = 'El teléfono es obligatorio';
  } else if (!/^\d+$/.test(data.telefono)) {
    errors.telefono = 'Solo se permiten números';
  } else if (data.telefono.length > 10) {
    errors.telefono = 'Máximo 10 dígitos';
  } else if (data.telefono.length < 7) {
    errors.telefono = 'Mínimo 7 dígitos';
  }

  return errors;
}

// ─── Field wrapper with inline error ──────────────────────────────────────

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

// ─── Component ─────────────────────────────────────────────────────────────

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    documento_identidad: '',
    nombre_completo: '',
    email: '',
    telefono: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const resetForm = () => {
    setFormData(initialForm);
    setErrors({});
    setTouched({});
    setSelectedCliente(null);
    setIsEditMode(false);
  };

  const fetchClientes = async (search?: string) => {
    try {
      setIsLoading(true);
      const response = await clientService.getAll(search);
      setClientes(response.data);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 0) {
      fetchClientes(value);
    } else {
      fetchClientes();
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    // Restricciones de entrada en tiempo real
    if (field === 'documento_identidad') {
      value = value.replace(/\D/g, '').slice(0, 11);
    }
    if (field === 'telefono') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateForm(updated));
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateForm(formData));
  };

  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsEditMode(true);
    setFormData({
      documento_identidad: cliente.documento_identidad,
      nombre_completo: cliente.nombre_completo,
      email: cliente.email,
      telefono: cliente.telefono,
    });
    setErrors({});
    setTouched({});
    setIsDialogOpen(true);
  };

  const handleDeleteCliente = async (id: number) => {
    const confirmed = window.confirm('¿Seguro que deseas eliminar este cliente? Esta acción es irreversible.');
    if (!confirmed) return;

    try {
      await clientService.delete(id);
      toast.success('Cliente eliminado correctamente');
      fetchClientes();
    } catch (error: any) {
      console.error('Error deleting cliente:', error);
      const msg = error?.response?.data?.message || 'Error al eliminar el cliente';
      toast.error(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Por favor corrige los errores antes de continuar');
      return;
    }

    if (isEditMode && selectedCliente) {
      const confirmed = window.confirm('¿Deseas guardar los cambios en este cliente?');
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode && selectedCliente) {
        await clientService.update(selectedCliente.id_cliente, formData);
        toast.success('Cliente actualizado exitosamente');
      } else {
        await clientService.create(formData);
        toast.success('Cliente creado exitosamente');
      }
      resetForm();
      setIsDialogOpen(false);
      fetchClientes();
    } catch (error: any) {
      console.error('Error saving cliente:', error);
      const msg = error?.response?.data?.message || 'Error al guardar el cliente';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const formValid = Object.keys(validateForm(formData)).length === 0 &&
    Object.values(formData).every((v) => v.trim() !== '');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-2">Gestión de clientes del hotel</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? 'Actualiza los datos del cliente y confirma para guardar los cambios.'
                    : 'Ingresa los datos del cliente. Todos los campos son obligatorios.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
                {/* Documento */}
                <FieldWrapper error={errors.documento_identidad} touched={touched.documento_identidad}>
                  <Label htmlFor="documento">
                    Documento de Identidad
                    <span className="ml-1 text-xs text-muted-foreground">(solo números, máx. 11 dígitos)</span>
                  </Label>
                  <Input
                    id="documento"
                    inputMode="numeric"
                    placeholder="Ej: 12345678901"
                    value={formData.documento_identidad}
                    onChange={(e) => handleChange('documento_identidad', e.target.value)}
                    onBlur={() => handleBlur('documento_identidad')}
                    className={touched.documento_identidad
                      ? errors.documento_identidad
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-green-500 focus-visible:ring-green-500'
                      : ''}
                    maxLength={11}
                  />
                </FieldWrapper>

                {/* Nombre */}
                <FieldWrapper error={errors.nombre_completo} touched={touched.nombre_completo}>
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Juan Pérez"
                    value={formData.nombre_completo}
                    onChange={(e) => handleChange('nombre_completo', e.target.value)}
                    onBlur={() => handleBlur('nombre_completo')}
                    className={touched.nombre_completo
                      ? errors.nombre_completo
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-green-500 focus-visible:ring-green-500'
                      : ''}
                  />
                </FieldWrapper>

                {/* Email */}
                <FieldWrapper error={errors.email} touched={touched.email}>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ej: juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={touched.email
                      ? errors.email
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-green-500 focus-visible:ring-green-500'
                      : ''}
                  />
                </FieldWrapper>

                {/* Teléfono */}
                <FieldWrapper error={errors.telefono} touched={touched.telefono}>
                  <Label htmlFor="telefono">
                    Teléfono
                    <span className="ml-1 text-xs text-muted-foreground">(solo números, máx. 10 dígitos)</span>
                  </Label>
                  <Input
                    id="telefono"
                    inputMode="numeric"
                    placeholder="Ej: 3001234567"
                    value={formData.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    onBlur={() => handleBlur('telefono')}
                    className={touched.telefono
                      ? errors.telefono
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-green-500 focus-visible:ring-green-500'
                      : ''}
                    maxLength={10}
                  />
                </FieldWrapper>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDialogClose(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formValid}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSubmitting
                      ? isEditMode
                        ? 'Guardando...'
                        : 'Creando...'
                      : isEditMode
                        ? 'Guardar cambios'
                        : 'Crear Cliente'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2 items-center">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Buscar por documento de identidad..."
                value={searchTerm}
                onChange={handleSearch}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Clientes</CardTitle>
            <CardDescription>Total: {clientes.length} clientes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : clientes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay clientes registrados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => (
                      <TableRow key={cliente.id_cliente}>
                        <TableCell className="font-medium">{cliente.documento_identidad}</TableCell>
                        <TableCell>{cliente.nombre_completo}</TableCell>
                        <TableCell>{cliente.email}</TableCell>
                        <TableCell>{cliente.telefono}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCliente(cliente)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCliente(cliente.id_cliente)}
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
      </main>
    </div>
  );
}
