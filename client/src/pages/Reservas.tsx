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

interface Reserva {
  id_reserva: number;
  id_cliente: number;
  id_usuario_registro: number;
  fecha_creacion: string;
  estado_reserva: 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Finalizada';
  notas_adicionales?: string;
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

        {/* Tabla de Reservas */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Reservas</CardTitle>
            <CardDescription>Total: {reservas.length} reservas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : reservas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay reservas registradas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Reserva</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservas.map((reserva) => (
                      <TableRow key={reserva.id_reserva}>
                        <TableCell className="font-medium">#{reserva.id_reserva}</TableCell>
                        <TableCell>Cliente {reserva.id_cliente}</TableCell>
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
                                    Estado: {reserva.estado_reserva}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
                                  {/* Consumos */}
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

                                  {/* Pagos */}
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

                                  {/* Resumen */}
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
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Editar Reserva</DialogTitle>
                      <DialogDescription>
                        Actualiza el estado o las notas adicionales de la reserva.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveReserva} className="space-y-4 pt-2" noValidate>
                      <div className="space-y-1">
                        <Label htmlFor="estado_reserva">Estado de Reserva</Label>
                        <select
                          id="estado_reserva"
                          value={editForm.estado_reserva}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              estado_reserva: e.target.value as Reserva['estado_reserva'],
                            }))
                          }
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Confirmada">Confirmada</option>
                          <option value="Cancelada">Cancelada</option>
                          <option value="Finalizada">Finalizada</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="notas_adicionales">Notas Adicionales</Label>
                        <Textarea
                          id="notas_adicionales"
                          value={editForm.notas_adicionales}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, notas_adicionales: e.target.value }))}
                          className="h-32"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                          Guardar cambios
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
