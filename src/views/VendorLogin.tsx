import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../controllers/AuthContext';
import { PoliceButton } from './PoliceButton';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Shield, UserCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function VendorLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirigir automáticamente si ya está autenticado
  useEffect(() => {
    if (!loading && user) {
      navigate('/vendor/panel', { replace: true });
    }
  }, [user, loading, navigate]);

  // Cargar credenciales guardadas al montar
  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername');
    const savedPassword = localStorage.getItem('savedPassword');
    const savedRemember = localStorage.getItem('savedRemember');
    
    if (savedUsername) setUsername(savedUsername);
    if (savedPassword) setPassword(savedPassword);
    if (savedRemember !== null) setRememberMe(savedRemember === 'true');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Realizar login (la sesión siempre se guarda automáticamente)
      const success = await login(username, password, true);
      
      if (success) {
        // Guardar o limpiar credenciales según preferencia del usuario
        if (rememberMe) {
          localStorage.setItem('savedUsername', username);
          localStorage.setItem('savedPassword', password);
          localStorage.setItem('savedRemember', 'true');
        } else {
          localStorage.removeItem('savedUsername');
          localStorage.removeItem('savedPassword');
          localStorage.removeItem('savedRemember');
        }
        
        toast.success('Acceso autorizado', {
          description: 'Bienvenido al panel de control',
        });
        
        navigate('/vendor/panel');
      } else {
        toast.error('Acceso denegado', {
          description: 'Usuario o contraseña incorrectos',
        });
      }
    } catch (error) {
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 bg-black">
      
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <div className="inline-block p-5 bg-gradient-to-br from-[#06b6d4] to-[#10b981] rounded-3xl mb-6 shadow-2xl shadow-[#06b6d4]/50">
            <Shield className="w-14 h-14 text-white" />
          </div>
          {/* Yo: cambié el título a genérico para que sea el mismo inicio de sesión para todos los roles */}
          <h1 className="text-white mb-3">Iniciar sesión</h1>
          <div className="inline-block bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-black px-6 py-2 rounded-xl shadow-lg">
            <p className="uppercase tracking-wider font-semibold text-sm">ACCESO RESTRINGIDO</p>
          </div>
        </div>

        {/* Login form */}
        <div className="bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] border-2 border-[#fbbf24]/30 rounded-3xl p-10 paper-texture shadow-2xl shadow-[#fbbf24]/20">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <Label htmlFor="username" className="text-gray-300 flex items-center gap-2 mb-3">
                <UserCircle className="w-5 h-5 text-[#fbbf24]" />
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#0f0f0f] border-[#fbbf24]/30 text-white focus:border-[#fbbf24] rounded-xl h-12"
                placeholder="Ingresá tu usuario"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300 flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-[#fbbf24]" />
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0f0f0f] border-[#fbbf24]/30 text-white focus:border-[#fbbf24] rounded-xl h-12 pr-12"
                  placeholder="Ingresá tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#fbbf24] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-[#fbbf24]/30 bg-[#0f0f0f] text-[#fbbf24] focus:ring-[#fbbf24] focus:ring-offset-0 cursor-pointer"
              />
              <Label htmlFor="remember" className="text-gray-300 text-sm cursor-pointer">
                Recordar usuario y contraseña
              </Label>
            </div>

            <PoliceButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verificando...' : 'Ingresar al Panel'}
            </PoliceButton>
          </form>
          
          {/* Credenciales de demostración */}
          <div className="mt-6 p-4 bg-[#0f0f0f]/50 border border-[#fbbf24]/20 rounded-xl">
            <p className="text-gray-400 text-sm mb-2 text-center">Credenciales de demostración:</p>
            <div className="space-y-1 text-center">
              <p className="text-[#fbbf24] font-mono text-sm"><span className="text-gray-500">Usuario:</span> admin</p>
              <p className="text-[#fbbf24] font-mono text-sm"><span className="text-gray-500">Contraseña:</span> admin123</p>
            </div>
          </div>
        </div>

        {/* Back button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-[#fbbf24] text-sm transition-colors px-4 py-2 hover:bg-[#1f1f1f] rounded-xl"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}