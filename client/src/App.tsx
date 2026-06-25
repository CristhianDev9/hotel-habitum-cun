import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Reservas from "./pages/Reservas";
import Roles from "./pages/Roles";
import NuevaReserva from "./pages/NuevaReserva";
import { initializeAPI } from "./services/api";
import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/clientes">
        {() => (
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/reservas">
        {() => (
          <ProtectedRoute>
            <Reservas />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/nueva-reserva">
        {() => (
          <ProtectedRoute>
            <NuevaReserva />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/roles">
        {() => (
          <ProtectedRoute>
            <Roles />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      initializeAPI(token);
    }
  }, [token]);

  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
