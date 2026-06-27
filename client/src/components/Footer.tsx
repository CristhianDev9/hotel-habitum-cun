import { useState } from 'react';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  const [logoError, setLogoError] = useState(false);

  return (
    <footer className="w-full border-t border-border bg-card/30 backdrop-blur-sm py-6 mt-auto">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row px-4 text-center md:text-left">
        {/* Left Side: CUN Logo & Info */}
        <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card border border-border p-1.5 overflow-hidden shadow-inner shrink-0">
            {!logoError ? (
              <img
                src="/logo-cun.png"
                alt="Logo CUN"
                className="h-full w-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="max-w-xl">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Este sitio fue desarrollado como parte de la actividad <strong>ACA</strong> de la materia{' '}
              <strong>Administración de Bases de Datos</strong>, perteneciente a la carrera de{' '}
              <strong>Ingeniería de Sistemas</strong> de la Corporación Unificada Nacional de Educación Superior (<strong>CUN</strong>).
            </p>
          </div>
        </div>

        {/* Right Side: Copyright / Year */}
        <div className="text-xs text-muted-foreground shrink-0 mt-4 md:mt-0">
          <p>© {new Date().getFullYear()} HabitumCUN. Desarrollado por:Cristhian Camilo Lengua Parra <br />Daniel Andrés Álvarez Hernández 

.</p>
        </div>
      </div>
    </footer>
  );
}
