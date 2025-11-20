import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { VendorUser } from '../types';
import { getApiUrl } from '../config/api';

interface AuthContextType {
  user: VendorUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Normaliza cualquier variante legacy (vendor/readonly) al set oficial de roles del panel.
const normalizeRole = (role?: string | null): VendorUser['role'] => {
  if (!role) {
    return 'vendedor';
  }

  const roleName = role.toLowerCase();

  if (roleName === 'admin') {
    return 'admin';
  }

  if (roleName === 'visitador' || roleName === 'readonly') {
    return 'visitador';
  }

  if (roleName === 'comprador') {
    return 'comprador';
  }

  return 'vendedor';
};

// Convierte la respuesta del backend en el shape mínimo que el frontend necesita.
const buildUserFromPayload = (payload: { username?: string; roles?: string[]; role?: string | null; nombre_completo?: string | null; telefono?: string | null; permisos?: string[] }): VendorUser | null => {
  if (!payload?.username) {
    return null;
  }

  return {
    username: payload.username,
    role: normalizeRole(payload.roles?.[0] ?? payload.role),
    name: payload.nombre_completo ?? undefined,
    phone: payload.telefono ?? undefined,
    permisos: payload.permisos ?? []
  };
};

const parseStoredUser = (rawUser: string | null): VendorUser | null => {
  if (!rawUser) {
    return null;
  }

  try {
    const data = JSON.parse(rawUser);
    // Si tenemos datos completos guardados, los devolvemos directamente para conservar el nombre
    if (data && data.username && data.role) {
      return { username: data.username, role: data.role, name: data.name, phone: data.phone, permisos: data.permisos || [] } as VendorUser;
    }
    return buildUserFromPayload({ username: data.username, role: data.role, nombre_completo: data.name, telefono: data.phone, permisos: data.permisos });
  } catch (error) {
    console.error('Error al parsear usuario almacenado:', error);
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<VendorUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isFirstMount = useRef(true);

  // Restaurar sesión al cargar la aplicación
  useEffect(() => {
    const restaurarSesion = async () => {
      const token = localStorage.getItem('token');
      const storedUser = parseStoredUser(localStorage.getItem('user'));

      if (storedUser && storedUser.username === 'admin' && storedUser.role !== 'admin') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      if (token) {
        try {
          // Validar token con el backend para evitar sesiones zombis
          const response = await fetch(getApiUrl('/api/auth/me'), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const refreshedUser = buildUserFromPayload({
                username: data.usuario?.username,
                roles: data.usuario?.roles,
                role: data.usuario?.role,
                nombre_completo: data.usuario?.nombre_completo,
                telefono: data.usuario?.telefono,
                permisos: data.usuario?.permisos
              });

              if (refreshedUser) {
                setUser(refreshedUser);
                localStorage.setItem('user', JSON.stringify(refreshedUser));
              } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
              }
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
            }
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (error) {
          console.error('Error al restaurar sesión:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };

    // Solo ejecutar en el primer montaje
    if (isFirstMount.current) {
      isFirstMount.current = false;
      restaurarSesion();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Siempre tomo el rol fresco del backend para reflejar cambios recientes
        const userData = buildUserFromPayload({
          username: data.usuario?.username,
          roles: data.usuario?.roles,
          role: data.usuario?.role,
          nombre_completo: data.usuario?.nombre_completo,
          telefono: data.usuario?.telefono,
          permisos: data.usuario?.permisos
        });

        if (!userData) {
          console.error('ERROR AuthContext: Respuesta sin datos de usuario válidos');
          return false;
        }
        
        setUser(userData);
        
        // Guardar sesión en localStorage para persistencia
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return true;
      }
      
      console.log('ERROR AuthContext: Login falló - no success o no token');
      return false;
    } catch (error) {
      console.error('💥 AuthContext: Error al iniciar sesión:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
