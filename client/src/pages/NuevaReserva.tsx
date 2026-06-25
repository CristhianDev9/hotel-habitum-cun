import { useEffect, useState } from 'react';
import { clientService, roomService, reservationService } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, ArrowLeft, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Cliente {
  id_cliente: number;
  documento_identidad: string;
  nombre_completo: string;
  email: string;
  telefono: string;
}

interface Room {
  id_habitacion: number;
  numero_habitacion: string;
  tipo?: string;
  estado: string;
}

interface HabitacionReserva {
  id_habitacion: number;
  fecha_checkin: string;
  fecha_checkout: string;
}

// ─── Client form validation (same rules as Clientes page) ──────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ClienteErrors {
  documento_identidad?: string;
  nombre_completo?: string;
  email?: string;
  telefono?: string;
}

function validateClienteForm(data: {
  documento_identidad: string;
  nombre_completo: string;
  email: string;
  telefono: string;
}): ClienteErrors {
  const errors: ClienteErrors = {};
  if (!data.documento_identidad) {
    errors.documento_identidad = 'Obligatorio';
  } else if (!/^\d+$/.test(data.documento_identidad)) {
    errors.documento_identidad = 'Solo números';
  } else if (data.documento_identidad.length < 6) {
    errors.documento_identidad = 'Mínimo 6 dígitos';
  } else if (data.documento_identidad.length > 11) {
    errors.documento_identidad = 'Máximo 11 dígitos';
  }

  if (!data.nombre_completo || data.nombre_completo.trim().length < 3) {
    errors.nombre_completo = 'Mínimo 3 caracteres';
  }

  if (!data.email) {
    errors.email = 'Obligatorio';
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Formato inválido (ej: usuario@dominio.com)';
  }

  if (!data.telefono) {
    errors.telefono = 'Obligatorio';
  } else if (!/^\d+$/.test(data.telefono)) {
    errors.telefono = 'Solo números';
  } else if (data.telefono.length < 7) {
    errors.telefono = 'Mínimo 7 dígitos';
  } else if (data.telefono.length > 10) {
    errors.telefono = 'Máximo 10 dígitos';
  }
  return errors;
}

// ─── Small helper ──────────────────────────────────────────────────────────

function FieldError({ error, touched }: { error?: string; touched?: boolean }) {
  if (!touched || !error) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {error}
    </p>
  );
}

function FieldOk({ error, touched }: { error?: string; touched?: boolean }) {
  if (!touched || error) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
      <CheckCircle2 className="h-3 w-3 shrink-0" />
      Correcto
    </p>
  );
}

// Today in YYYY-MM-DD (local time)
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function NuevaReserva() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();

  // Reservation form
  const [formData, setFormData] = useState({
    id_cliente: '',
    notas_adicionales: '',
    habitaciones: [] as HabitacionReserva[],
  });

  // ─ New client modal state ────────────────────────────────────────────────
  const [showNewClient, setShowNewClient] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const clienteInitial = { documento_identidad: '', nombre_completo: '', email: '', telefono: '' };
  const [nuevoCliente, setNuevoCliente] = useState(clienteInitial);
  const [clienteErrors, setClienteErrors] = useState<ClienteErrors>({});
  const [clienteTouched, setClienteTouched] = useState<Record<string, boolean>>({});

  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [clientesRes, roomsRes] = await Promise.all([
          clientService.getAll(),
          roomService.getAll(),
        ]);
        setClientes(clientesRes.data);
        setRooms(roomsRes.data.filter((r: Room) => r.estado === 'Disponible'));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─ Room handlers ──────────────────────────────────────────────────────────

  const handleAddRoom = () => {
    setFormData({
      ...formData,
      habitaciones: [
        ...formData.habitaciones,
        { id_habitacion: 0, fecha_checkin: '', fecha_checkout: '' },
      ],
    });
  };

  const handleRemoveRoom = (index: number) => {
    setFormData({
      ...formData,
      habitaciones: formData.habitaciones.filter((_, i) => i !== index),
    });
  };

  const handleRoomChange = (index: number, field: string, value: any) => {
    const updated = [...formData.habitaciones];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fix: checkout must be after checkin
    if (field === 'fecha_checkin' && updated[index].fecha_checkout && value >= updated[index].fecha_checkout) {
      updated[index].fecha_checkout = '';
      toast.info('La fecha de check-out fue limpiada porque era anterior al check-in');
    }

    setFormData({ ...formData, habitaciones: updated });
  };

  // ─ Room validation per row ─────────────────────────────────────────────

  function getRoomError(h: HabitacionReserva): string | null {
    if (!h.id_habitacion) return 'Selecciona una habitación';
    if (!h.fecha_checkin) return 'Ingresa la fecha de check-in';
    if (!h.fecha_checkout) return 'Ingresa la fecha de check-out';
    if (h.fecha_checkout <= h.fecha_checkin) return 'El check-out debe ser posterior al check-in';
    return null;
  }

  // ─ New client handlers ───────────────────────────────────────────────────

  const handleClienteChange = (field: keyof typeof nuevoCliente, value: string) => {
    if (field === 'documento_identidad') value = value.replace(/\D/g, '').slice(0, 11);
    if (field === 'telefono') value = value.replace(/\D/g, '').slice(0, 10);
    const updated = { ...nuevoCliente, [field]: value };
    setNuevoCliente(updated);
    setClienteTouched((prev) => ({ ...prev, [field]: true }));
    setClienteErrors(validateClienteForm(updated));
  };

  const handleClienteBlur = (field: keyof typeof nuevoCliente) => {
    setClienteTouched((prev) => ({ ...prev, [field]: true }));
    setClienteErrors(validateClienteForm(nuevoCliente));
  };

  const handleCrearCliente = async () => {
    const allTouched = Object.keys(nuevoCliente).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setClienteTouched(allTouched);
    const errs = validateClienteForm(nuevoCliente);
    setClienteErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Corrige los errores del formulario de cliente');
      return;
    }
    try {
      setIsCreatingClient(true);
      const res = await clientService.create(nuevoCliente);
      const created: Cliente = res.data;
      setClientes((prev) => [...prev, created]);
      setFormData((prev) => ({ ...prev, id_cliente: created.id_cliente.toString() }));
      toast.success(`Cliente "${created.nombre_completo}" creado y seleccionado`);
      setNuevoCliente(clienteInitial);
      setClienteErrors({});
      setClienteTouched({});
      setShowNewClient(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al crear el cliente';
      toast.error(msg);
    } finally {
      setIsCreatingClient(false);
    }
  };

  // ─ Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id_cliente) {
      toast.error('Selecciona un cliente o crea uno nuevo');
      return;
    }

    if (formData.habitaciones.length === 0) {
      toast.error('Agrega al menos una habitación');
      return;
    }

    const roomErrors = formData.habitaciones.map(getRoomError).filter(Boolean);
    if (roomErrors.length > 0) {
      toast.error(roomErrors[0] as string);
      return;
    }

    try {
      setIsSubmitting(true);
      await reservationService.create({
        id_cliente: parseInt(formData.id_cliente),
        notas_adicionales: formData.notas_adicionales,
        habitaciones_detalle: formData.habitaciones,
      });
      toast.success('Reserva creada exitosamente');
      navigate('/reservas');
    } catch (error: any) {
      console.error('Error creating reserva:', error);
      const msg = error?.response?.data?.message || 'Error al crear la reserva';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clienteFormValid =
    Object.keys(validateClienteForm(nuevoCliente)).length === 0 &&
    Object.values(nuevoCliente).every((v) => v.trim() !== '');

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container py-8 flex-grow">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/reservas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nueva Reserva</h1>
            <p className="text-muted-foreground mt-2">Crear una nueva reserva de habitación</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* ── Selección de Cliente ────────────────────────────────── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cliente</CardTitle>
                    <CardDescription>Selecciona un cliente existente o crea uno nuevo</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary text-primary hover:bg-primary/10"
                    onClick={() => setShowNewClient(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Crear cliente
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Select
                    value={formData.id_cliente}
                    onValueChange={(value) => setFormData({ ...formData, id_cliente: value })}
                  >
                    <SelectTrigger id="cliente">
                      <SelectValue placeholder="Selecciona un cliente…" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                          No hay clientes. Usa "Crear cliente" →
                        </div>
                      ) : (
                        clientes.map((cliente) => (
                          <SelectItem key={cliente.id_cliente} value={cliente.id_cliente.toString()}>
                            {cliente.nombre_completo} · {cliente.documento_identidad}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.id_cliente && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3" /> Cliente seleccionado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Habitaciones ───────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Habitaciones</CardTitle>
                    <CardDescription>Agrega las habitaciones para esta reserva</CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddRoom}
                    className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Habitación
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.habitaciones.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay habitaciones agregadas. Haz clic en "Agregar Habitación" para comenzar.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.habitaciones.map((habitacion, index) => {
                      const roomErr = getRoomError(habitacion);
                      const minCheckout = habitacion.fecha_checkin
                        ? (() => {
                            const d = new Date(habitacion.fecha_checkin);
                            d.setDate(d.getDate() + 1);
                            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          })()
                        : today();

                      return (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Habitación {index + 1}</h4>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveRoom(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Habitación select */}
                            <div className="space-y-1">
                              <Label>Habitación *</Label>
                              <Select
                                value={habitacion.id_habitacion ? habitacion.id_habitacion.toString() : ''}
                                onValueChange={(value) =>
                                  handleRoomChange(index, 'id_habitacion', parseInt(value))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona habitación" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rooms.map((room) => (
                                    <SelectItem
                                      key={room.id_habitacion}
                                      value={room.id_habitacion.toString()}
                                    >
                                      Hab. {room.numero_habitacion}
                                      {room.tipo ? ` · ${room.tipo}` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Check-in */}
                            <div className="space-y-1">
                              <Label>Check-in *</Label>
                              <Input
                                type="date"
                                min={today()}
                                value={habitacion.fecha_checkin}
                                onChange={(e) =>
                                  handleRoomChange(index, 'fecha_checkin', e.target.value)
                                }
                              />
                            </div>

                            {/* Check-out */}
                            <div className="space-y-1">
                              <Label>Check-out *</Label>
                              <Input
                                type="date"
                                min={minCheckout}
                                value={habitacion.fecha_checkout}
                                disabled={!habitacion.fecha_checkin}
                                onChange={(e) =>
                                  handleRoomChange(index, 'fecha_checkout', e.target.value)
                                }
                              />
                              {!habitacion.fecha_checkin && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Primero elige el check-in
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Row-level error */}
                          {roomErr && habitacion.id_habitacion + habitacion.fecha_checkin + habitacion.fecha_checkout !== '' && (
                            <p className="flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3" /> {roomErr}
                            </p>
                          )}

                          {/* Row OK */}
                          {!roomErr && (
                            <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" /> Habitación completa
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Notas ──────────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>Notas Adicionales</CardTitle>
                <CardDescription>Opcional — peticiones especiales, alergias, etc.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Agrega notas o comentarios especiales para esta reserva…"
                  value={formData.notas_adicionales}
                  onChange={(e) => setFormData({ ...formData, notas_adicionales: e.target.value })}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {formData.notas_adicionales.length}/500
                </p>
              </CardContent>
            </Card>

            {/* ── Botones ─────────────────────────────────────────────── */}
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/reservas')}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? 'Creando reserva…' : 'Crear Reserva'}
              </Button>
            </div>
          </form>
        )}
      </main>

      {/* ── Modal: Crear nuevo cliente ─────────────────────────────────── */}
      <Dialog open={showNewClient} onOpenChange={(open) => {
        if (!open) {
          setNuevoCliente(clienteInitial);
          setClienteErrors({});
          setClienteTouched({});
        }
        setShowNewClient(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Crear Nuevo Cliente
            </DialogTitle>
            <DialogDescription>
              El cliente creado quedará seleccionado automáticamente para esta reserva.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Documento */}
            <div>
              <Label htmlFor="nc-doc">
                Documento de Identidad
                <span className="ml-1 text-xs text-muted-foreground">(solo números, máx. 11)</span>
              </Label>
              <Input
                id="nc-doc"
                inputMode="numeric"
                placeholder="Ej: 12345678901"
                value={nuevoCliente.documento_identidad}
                maxLength={11}
                onChange={(e) => handleClienteChange('documento_identidad', e.target.value)}
                onBlur={() => handleClienteBlur('documento_identidad')}
                className={clienteTouched.documento_identidad
                  ? clienteErrors.documento_identidad
                    ? 'border-destructive mt-1'
                    : 'border-green-500 mt-1'
                  : 'mt-1'}
              />
              <FieldError error={clienteErrors.documento_identidad} touched={clienteTouched.documento_identidad} />
              <FieldOk error={clienteErrors.documento_identidad} touched={clienteTouched.documento_identidad} />
            </div>

            {/* Nombre */}
            <div>
              <Label htmlFor="nc-nombre">Nombre Completo</Label>
              <Input
                id="nc-nombre"
                placeholder="Ej: Juan Pérez"
                value={nuevoCliente.nombre_completo}
                onChange={(e) => handleClienteChange('nombre_completo', e.target.value)}
                onBlur={() => handleClienteBlur('nombre_completo')}
                className={clienteTouched.nombre_completo
                  ? clienteErrors.nombre_completo
                    ? 'border-destructive mt-1'
                    : 'border-green-500 mt-1'
                  : 'mt-1'}
              />
              <FieldError error={clienteErrors.nombre_completo} touched={clienteTouched.nombre_completo} />
              <FieldOk error={clienteErrors.nombre_completo} touched={clienteTouched.nombre_completo} />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="nc-email">Email</Label>
              <Input
                id="nc-email"
                type="email"
                placeholder="Ej: juan@ejemplo.com"
                value={nuevoCliente.email}
                onChange={(e) => handleClienteChange('email', e.target.value)}
                onBlur={() => handleClienteBlur('email')}
                className={clienteTouched.email
                  ? clienteErrors.email
                    ? 'border-destructive mt-1'
                    : 'border-green-500 mt-1'
                  : 'mt-1'}
              />
              <FieldError error={clienteErrors.email} touched={clienteTouched.email} />
              <FieldOk error={clienteErrors.email} touched={clienteTouched.email} />
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="nc-tel">
                Teléfono
                <span className="ml-1 text-xs text-muted-foreground">(solo números, máx. 10)</span>
              </Label>
              <Input
                id="nc-tel"
                inputMode="numeric"
                placeholder="Ej: 3001234567"
                value={nuevoCliente.telefono}
                maxLength={10}
                onChange={(e) => handleClienteChange('telefono', e.target.value)}
                onBlur={() => handleClienteBlur('telefono')}
                className={clienteTouched.telefono
                  ? clienteErrors.telefono
                    ? 'border-destructive mt-1'
                    : 'border-green-500 mt-1'
                  : 'mt-1'}
              />
              <FieldError error={clienteErrors.telefono} touched={clienteTouched.telefono} />
              <FieldOk error={clienteErrors.telefono} touched={clienteTouched.telefono} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowNewClient(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isCreatingClient || !clienteFormValid}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleCrearCliente}
              >
                {isCreatingClient ? 'Creando…' : 'Crear y Seleccionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
