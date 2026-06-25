import axios, { AxiosInstance } from 'axios';

let apiInstance: AxiosInstance;

export function initializeAPI(token?: string) {
  let apiUrl = import.meta.env.VITE_API_URL || 'https://hotel-backend-625r.onrender.com';
  
  // Normalizar la URL para remover '/api' al final si estuviera presente
  apiUrl = apiUrl.replace(/\/api\/?$/, '');

  apiInstance = axios.create({
    baseURL: apiUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor para inyectar token Bearer
  apiInstance.interceptors.request.use((config) => {
    const authToken = token || localStorage.getItem('auth_token');
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  });

  // Interceptor para manejar errores
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return apiInstance;
}

export function getAPI(): AxiosInstance {
  if (!apiInstance) {
    initializeAPI();
  }
  return apiInstance;
}

// Servicios de Autenticación
export const authService = {
  login: (username: string, password: string) =>
    getAPI().post('/api/auth/login', { username, password }),
  register: (data: {
    id_role: number;
    nombre_completo: string;
    username: string;
    email: string;
    password: string;
  }) => getAPI().post('/api/auth/register', data),
};

// Servicios de Habitaciones
export const roomService = {
  getAll: () => getAPI().get('/api/habitaciones'),
  getById: (id: number) => getAPI().get(`/api/habitaciones/${id}`),
  update: (id: number, data: { estado: string }) =>
    getAPI().put(`/api/habitaciones/${id}`, data),
};

// Servicios de Clientes
export const clientService = {
  getAll: (documentoIdentidad?: string) =>
    getAPI().get('/api/clientes', {
      params: documentoIdentidad ? { documento_identidad: documentoIdentidad } : {},
    }),
  getById: (id: number) => getAPI().get(`/api/clientes/${id}`),
  create: (data: {
    documento_identidad: string;
    nombre_completo: string;
    email: string;
    telefono: string;
  }) => getAPI().post('/api/clientes', data),
  update: (id: number, data: any) => getAPI().put(`/api/clientes/${id}`, data),
  delete: (id: number) => getAPI().delete(`/api/clientes/${id}`),
};

// Servicios de Reservas
export const reservationService = {
  getAll: () => getAPI().get('/api/reservas'),
  getById: (id: number) => getAPI().get(`/api/reservas/${id}`),
  create: (data: {
    id_cliente: number;
    notas_adicionales?: string;
    habitaciones_detalle: Array<{
      id_habitacion: number;
      fecha_checkin: string;
      fecha_checkout: string;
    }>;
  }) => getAPI().post('/api/reservas', data),
  update: (id: number, data: Partial<{
    notas_adicionales?: string;
    estado_reserva?: string;
  }>) => getAPI().patch(`/api/reservas/${id}`, data),
  delete: (id: number) => getAPI().delete(`/api/reservas/${id}`),
  updateStatus: (id: number, estado_reserva: string) =>
    getAPI().patch(`/api/reservas/${id}`, { estado_reserva }),
};

// Servicios de Roles
export const roleService = {
  getAll: async () => {
    const response = await getAPI().get('/api/roles');
    if (response.data) {
      const rawRoles = Array.isArray(response.data)
        ? response.data
        : (response.data.roles || []);
      response.data = rawRoles.map((r: any) => ({
        id_role: r.id_role,
        nombre: r.nombre_rol || r.nombre,
        descripcion: r.descripcion,
      }));
    }
    return response;
  },
  create: (data: { nombre: string; descripcion?: string }) =>
    getAPI().post('/api/roles', {
      nombre: data.nombre,
      nombre_rol: data.nombre,
      descripcion: data.descripcion,
    }),
  update: (id: number, data: { nombre?: string; descripcion?: string }) =>
    getAPI().put(`/api/roles/${id}`, {
      nombre: data.nombre,
      nombre_rol: data.nombre,
      descripcion: data.descripcion,
    }),
  delete: (id: number) => getAPI().delete(`/api/roles/${id}`),
};

// Servicios de Consumos
export const consumptionService = {
  getByReservation: (idReserva: number) =>
    getAPI().get('/api/consumos', { params: { id_reserva: idReserva } }),
  create: (data: {
    id_reserva: number;
    id_servicio: number;
    cantidad: number;
  }) => getAPI().post('/api/consumos', data),
};

// Servicios de Pagos
export const paymentService = {
  getByReservation: (idReserva: number) =>
    getAPI().get('/api/pagos', { params: { id_reserva: idReserva } }),
  create: (data: {
    id_reserva: number;
    monto: number;
    metodo_pago: 'Efectivo' | 'Tarjeta de Credito' | 'Transferencia';
  }) => getAPI().post('/api/pagos', data),
};

// Servicios de Servicios Adicionales
export const serviceService = {
  getAll: () => getAPI().get('/api/servicios'),
};

// Servicios de Tipos de Habitación
export const roomTypeService = {
  getAll: () => getAPI().get('/api/tipos-habitacion'),
};
