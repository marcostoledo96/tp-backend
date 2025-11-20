import React, { useState, useEffect } from 'react';
import { useAuth } from '../controllers/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Phone, Lock, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_BASE_URL from '../config/api';

export default function Profile() {
  const { user, token, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nombre_completo: user.name || '',
        telefono: user.phone || ''
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !token) {
      toast.error('Error: No hay sesión activa');
      return;
    }

    // Validar contraseñas si se ingresaron
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      if (formData.password.length < 4) {
        toast.error('La contraseña debe tener al menos 4 caracteres');
        return;
      }
    }

    setLoading(true);

    try {
      const updateData: Record<string, string> = {
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono
      };

      // Solo incluir password si se ingresó
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${API_BASE_URL}/api/usuarios/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar perfil');
      }

      const data = await response.json();
      
      // Actualizar contexto de usuario
      setUser({
        ...user,
        name: formData.nombre_completo,
        phone: formData.telefono
      });

      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

      toast.success('Perfil actualizado correctamente');
    } catch (error: unknown) {
      console.error('Error al actualizar perfil:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* Header con degradado dorado */}
      <div className="bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#fbbf24] py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-black hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al inicio</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-black flex items-center gap-3">
            <UserCircle className="w-10 h-10" />
            Mi Perfil
          </h1>
          <p className="text-black/80 mt-2">Actualiza tu información personal</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-[#1f1f1f] border border-[#fbbf24]/30 rounded-xl p-6 md:p-8">
          {/* Info de usuario */}
          <div className="mb-6 pb-6 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#fbbf24]/20 rounded-full flex items-center justify-center">
                <UserCircle className="w-7 h-7 text-[#fbbf24]" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[#fbbf24]">{user.name}</p>
                <p className="text-sm text-gray-400">Usuario: {user.username}</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-block px-3 py-1 bg-[#fbbf24]/20 text-[#fbbf24] text-xs font-medium rounded-full">
                {user.role}
              </span>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre completo */}
            <div>
              <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-300 mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="nombre_completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0a0a0a] text-gray-100 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-2">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] text-gray-100 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
                  placeholder="Ej: +54 9 11 1234-5678"
                />
              </div>
            </div>

            {/* Cambiar contraseña */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Cambiar contraseña (opcional)</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] text-gray-100 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
                      placeholder="Dejar en blanco para no cambiar"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] text-gray-100 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-black font-semibold px-6 py-3 rounded-lg transition-all ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-[1.02]'
                }`}
              >
                <Save className="w-5 h-5" />
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
