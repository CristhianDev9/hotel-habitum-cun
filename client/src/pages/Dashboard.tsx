import { useEffect, useState } from 'react';
import { roomService } from '@/services/api';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Building2, CheckCircle2, AlertCircle, Wrench, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface Room {
  id_habitacion: number;
  numero_habitacion: string;
  id_tipo_habitacion: number;
  estado: 'Disponible' | 'Ocupada' | 'Mantenimiento';
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'Disponible' | 'Ocupada' | 'Mantenimiento'>('Disponible');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await roomService.getAll();
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Error al cargar las habitaciones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setNewStatus(room.estado);
    setIsEditDialogOpen(true);
  };

  const handleSaveRoomStatus = async () => {
    if (!selectedRoom) return;

    if (newStatus === selectedRoom.estado) {
      toast.info('El estado es el mismo');
      return;
    }

    try {
      setIsSubmitting(true);
      await roomService.update(selectedRoom.id_habitacion, { estado: newStatus });
      toast.success('Estado de habitación actualizado');
      setIsEditDialogOpen(false);
      fetchRooms();
    } catch (error: any) {
      console.error('Error updating room:', error);
      const msg = error?.response?.data?.message || 'Error al actualizar la habitación';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular estadísticas
  const stats = {
    total: rooms.length,
    disponibles: rooms.filter(r => r.estado === 'Disponible').length,
    ocupadas: rooms.filter(r => r.estado === 'Ocupada').length,
    mantenimiento: rooms.filter(r => r.estado === 'Mantenimiento').length,
  };

  const occupancyData = [
    { name: 'Disponibles', value: stats.disponibles, fill: '#22c55e' },
    { name: 'Ocupadas', value: stats.ocupadas, fill: '#ef4444' },
    { name: 'Mantenimiento', value: stats.mantenimiento, fill: '#eab308' },
  ];

  const stateDistribution = [
    { estado: 'Disponibles', cantidad: stats.disponibles },
    { estado: 'Ocupadas', cantidad: stats.ocupadas },
    { estado: 'Mantenimiento', cantidad: stats.mantenimiento },
  ];

  // Obtener estado disponible según el estado actual
  const getAvailableStates = (current: Room['estado']) => {
    if (current === 'Disponible') {
      return ['Disponible', 'Ocupada', 'Mantenimiento'];
    } else if (current === 'Mantenimiento') {
      return ['Disponible', 'Mantenimiento'];
    } else {
      return ['Ocupada'];
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Resumen de estado de habitaciones</p>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Habitaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <span className="text-3xl font-bold">{stats.total}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disponibles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                  <span className="text-3xl font-bold text-accent">{stats.disponibles}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ocupadas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ocupadas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <span className="text-3xl font-bold text-destructive">{stats.ocupadas}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mantenimiento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mantenimiento</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="flex items-center gap-3">
                  <Wrench className="h-8 w-8 text-yellow-500" />
                  <span className="text-3xl font-bold text-yellow-500">{stats.mantenimiento}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Pastel */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Ocupación</CardTitle>
              <CardDescription>Porcentaje de habitaciones por estado</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Barras */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Habitaciones</CardTitle>
              <CardDescription>Cantidad por estado</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stateDistribution}>
                    <XAxis dataKey="estado" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grid de Habitaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Habitaciones</CardTitle>
            <CardDescription>Estado actual de todas las habitaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id_habitacion}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      room.estado === 'Disponible'
                        ? 'border-accent bg-accent/10 dark:bg-accent/20'
                        : room.estado === 'Ocupada'
                        ? 'border-destructive bg-destructive/10 dark:bg-destructive/20'
                        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-foreground">
                        Hab. {room.numero_habitacion}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRoom(room)}
                        className="h-6 w-6 p-0"
                        title="Editar estado"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className={`text-xs font-medium ${
                      room.estado === 'Disponible'
                        ? 'text-accent dark:text-accent'
                        : room.estado === 'Ocupada'
                        ? 'text-destructive dark:text-destructive'
                        : 'text-yellow-500 dark:text-yellow-400'
                    }`}>
                      {room.estado}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Room Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Estado de Habitación</DialogTitle>
              <DialogDescription>
                Hab. {selectedRoom?.numero_habitacion} - Estado actual: {selectedRoom?.estado}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nuevo estado</Label>
                <div className="space-y-2">
                  {(selectedRoom ? getAvailableStates(selectedRoom.estado) : []).map((state) => (
                    <button
                      key={state}
                      onClick={() => setNewStatus(state as Room['estado'])}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        newStatus === state
                          ? state === 'Disponible'
                            ? 'border-accent bg-accent/20 text-accent'
                            : state === 'Ocupada'
                            ? 'border-destructive bg-destructive/20 text-destructive'
                            : 'border-yellow-500 bg-yellow-100/50 text-yellow-700 dark:text-yellow-400'
                          : state === 'Disponible'
                          ? 'border-accent/30 text-accent hover:border-accent/60'
                          : state === 'Ocupada'
                          ? 'border-destructive/30 text-destructive hover:border-destructive/60'
                          : 'border-yellow-500/30 text-yellow-700 dark:text-yellow-400 hover:border-yellow-500/60'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSaveRoomStatus}
                  disabled={isSubmitting || newStatus === selectedRoom?.estado}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
