import { useEffect, useState } from 'react';
import { reservationService, consumptionService, paymentService } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface HabitacionReservaDetalle {
  id_habitacion?: number;
  numero_habitacion?: string;
  fecha_checkin?: string;
  fecha_checkout?: string;
}

interface Reserva {
  id_reserva: number;
  id_cliente: number;
  id_usuario_registro: number;
  fecha_creacion: string;
  estado_reserva: 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Finalizada';
  notas_adicionales?: string;
  habitaciones_detalle?: HabitacionReservaDetalle[];
  habitaciones?: HabitacionReservaDetalle[];
}

interface Consumo {
  id_consumo: number;
  id_servicio: number;
  cantidad: number;
  precio_cobrado: number;
}

interface Pago {
  id_pago: number;
  monto: number;
  metodo_pago: string;
  fecha_pago: string;
}

export default function Reservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    notas_adicionales: '',
    estado_reserva: 'Pendiente' as Reserva['estado_reserva'],
  });
  const [, navigate] = useLocation();

  const fetchReservas = async () => {
    try {
      setIsLoading(true);
      const response = await reservationService.getAll();
      const data = response.data;
      setReservas(
        Array.isArray(data)
          ? data
          : data?.data ?? data?.reservas ?? []
      );
    } catch (error) {
      console.error('Error fetching reservas:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  const handleViewDetails = async (reserva: Reserva) => {
    setSelectedReserva(reserva);
    try {
      const [consumosRes, pagosRes] = await Promise.all([
        consumptionService.getByReservation(reserva.id_reserva),
        paymentService.getByReservation(reserva.id_reserva),
      ]);
      setConsumos(consumosRes.data);
      setPagos(pagosRes.data);
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Error al cargar los detalles');
    }
    setIsDetailsOpen(true);
  };

  const handleEditReserva = (reserva: Reserva) => {
    setEditingReserva(reserva);
    setEditForm({
      notas_adicionales: reserva.notas_adicionales ?? '',
      estado_reserva: reserva.estado_reserva,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteReserva = async (id: number) => {
    const confirmed = window.confirm('¿Seguro que deseas eliminar esta reserva? Esta acción es irreversible.');
    if (!confirmed) return;

    try {
      await reservationService.delete(id);
      toast.success('Reserva eliminada correctamente');
      setReservas((prev) => prev.filter((r) => r.id_reserva !== id));
    } catch (error: any) {
      console.error('Error deleting reserva:', error);
      const msg = error?.response?.data?.message || 'Error al eliminar la reserva';
      toast.error(msg);
    }
  };

  const handleSaveReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReserva) return;

    const confirmed = window.confirm('¿Deseas guardar los cambios en esta reserva?');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      await reservationService.update(editingReserva.id_reserva, {
        notas_adicionales: editForm.notas_adicionales,
        estado_reserva: editForm.estado_reserva,
      });
      toast.success('Reserva actualizada correctamente');
      setIsEditDialogOpen(false);
      setEditingReserva(null);
      fetchReservas();
    } catch (error: any) {
      console.error('Error updating reserva:', error);
      const msg = error?.response?.data?.message || 'Error al actualizar la reserva';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Confirmada':
        return 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary';
      case 'Cancelada':
        return 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive';
      case 'Finalizada':
        return 'bg-accent/20 text-accent dark:bg-accent/30 dark:text-accent';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoomLabel = (reserva: Reserva) => {
    const detalle = Array.isArray(reserva.habitaciones_detalle)
      ? reserva.habitaciones_detalle
      : Array.isArray(reserva.habitaciones)
      ? reserva.habitaciones
      : [];

    const labels = detalle
      .map((habitacion) => habitacion.numero_habitacion || (habitacion.id_habitacion ? `Hab. ${habitacion.id_habitacion}` : null))
      .filter(Boolean) as string[];

    if (labels.length > 0) {
      return labels.join(', ');
    }

    return 'Sin habitación asignada';
  };

  const getDateRange = (reserva: Reserva) => {
    const detalle = Array.isArray(reserva.habitaciones_detalle)
      ? reserva.habitaciones_detalle
      : Array.isArray(reserva.habitaciones)
      ? reserva.habitaciones
      : [];

    const checkin = detalle[0]?.fecha_checkin;
    const checkout = detalle[0]?.fecha_checkout;

    if (checkin && checkout) {
      const checkinDate = new Date(checkin).toLocaleDateString();
      const checkoutDate = new Date(checkout).toLocaleDateString();
      return `${checkinDate} - ${checkoutDate}`;
    }

    return 'Sin fechas';
  };

  const getActiveReservations = () =>
    reservas.filter((reserva) => reserva.estado_reserva === 'Pendiente' || reserva.estado_reserva === 'Confirmada');

  const getHistoryReservations = () =>
    reservas.filter((reserva) => reserva.estado_reserva === 'Finalizada' || reserva.estado_reserva === 'Cancelada');


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container py-8 flex-grow">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reservas</h1>
            <p className="text-muted-foreground mt-2">Gestión de reservas del hotel</p>
          </div>
          <Button
            onClick={() => navigate('/nueva-reserva')}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Nueva Reserva
          </Button>
        </div>

        {/* Reservas activas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Reservas Activas</CardTitle>
            <CardDescription>Total: {getActiveReservations().length} reservas activas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : getActiveReservations().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay reservas activas</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Reserva</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Habitación</TableHead>
                      <TableHead>Check-in / Check-out</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getActiveReservations().map((reserva) => (
                      <TableRow key={reserva.id_reserva}>
                        <TableCell className="font-medium">#{reserva.id_reserva}</TableCell>
                        <TableCell>Cliente {reserva.id_cliente}</TableCell>
                        <TableCell>{getRoomLabel(reserva)}</TableCell>
                        <TableCell className="text-sm">{getDateRange(reserva)}</TableCell>
                        <TableCell>{new Date(reserva.fecha_creacion).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reserva.estado_reserva)}`}>
                            {reserva.estado_reserva}
                          </span>
                        </TableCell>
                        <TableCell className="flex flex-wrap gap-2">
                          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(reserva)}
                                className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary"
                              >
                                <Eye className="h-4 w-4" />
                                Ver
                              </Button>
                            </DialogTrigger>
                            {selectedReserva?.id_reserva === reserva.id_reserva && (
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalles de Reserva #{reserva.id_reserva}</DialogTitle>
                                  <DialogDescription>
                                    Estado: {reserva.estado_reserva} · Habitación: {getRoomLabel(reserva)}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
                                  <div>
                                    <h3 className="font-semibold mb-3">Consumos</h3>
                                    {consumos.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">Sin consumos registrados</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {consumos.map((consumo) => (
                                          <div key={consumo.id_consumo} className="flex justify-between text-sm border-b pb-2">
                                            <span>Servicio {consumo.id_servicio}</span>
                                            <span className="font-medium">${consumo.precio_cobrado}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <h3 className="font-semibold mb-3">Pagos</h3>
                                    {pagos.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {pagos.map((pago) => (
                                          <div key={pago.id_pago} className="flex justify-between text-sm border-b pb-2">
                                            <span>{pago.metodo_pago}</span>
                                            <span className="font-medium">${pago.monto}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="border-t pt-4">
                                    <div className="flex justify-between font-semibold text-accent">
                                      <span>Total Consumos:</span>
                                      <span>${consumos.reduce((sum, c) => sum + c.precio_cobrado, 0)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-primary">
                                      <span>Total Pagos:</span>
                                      <span>${pagos.reduce((sum, p) => sum + p.monto, 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReserva(reserva)}
                            className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteReserva(reserva.id_reserva)}
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

        {/* Historial de Reservas */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Reservas</CardTitle>
            <CardDescription>Total: {getHistoryReservations().length} reservas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : getHistoryReservations().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay reservas en el historial</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Reserva</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Habitación</TableHead>
                      <TableHead>Check-in / Check-out</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getHistoryReservations().map((reserva) => (
                      <TableRow key={reserva.id_reserva}>
                        <TableCell className="font-medium">#{reserva.id_reserva}</TableCell>
                        <TableCell>Cliente {reserva.id_cliente}</TableCell>
                        <TableCell>{getRoomLabel(reserva)}</TableCell>
                        <TableCell className="text-sm">{getDateRange(reserva)}</TableCell>
                        <TableCell>{new Date(reserva.fecha_creacion).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reserva.estado_reserva)}`}>
                            {reserva.estado_reserva}
                          </span>
                        </TableCell>
                        <TableCell className="flex flex-wrap gap-2">
                          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(reserva)}
                                className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary"
                              >
                                <Eye className="h-4 w-4" />
                                Ver
                              </Button>
                            </DialogTrigger>
                            {selectedReserva?.id_reserva === reserva.id_reserva && (
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalles de Reserva #{reserva.id_reserva}</DialogTitle>
                                  <DialogDescription>
                                    Estado: {reserva.estado_reserva} · Habitación: {getRoomLabel(reserva)}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
                                  <div>
                                    <h3 className="font-semibold mb-3">Consumos</h3>
                                    {consumos.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">Sin consumos registrados</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {consumos.map((consumo) => (
                                          <div key={consumo.id_consumo} className="flex justify-between text-sm border-b pb-2">
                                            <span>Servicio {consumo.id_servicio}</span>
                                            <span className="font-medium">${consumo.precio_cobrado}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <h3 className="font-semibold mb-3">Pagos</h3>
                                    {pagos.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {pagos.map((pago) => (
                                          <div key={pago.id_pago} className="flex justify-between text-sm border-b pb-2">
                                            <span>{pago.metodo_pago}</span>
                                            <span className="font-medium">${pago.monto}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="border-t pt-4">
                                    <div className="flex justify-between font-semibold text-accent">
                                      <span>Total Consumos:</span>
                                      <span>${consumos.reduce((sum, c) => sum + c.precio_cobrado, 0)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-primary">
                                      <span>Total Pagos:</span>
                                      <span>${pagos.reduce((sum, p) => sum + p.monto, 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
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
      <Footer />
    </div>
  );
}
