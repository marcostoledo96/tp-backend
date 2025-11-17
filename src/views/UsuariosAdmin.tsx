import { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { PoliceButton } from './PoliceButton';
import { Shield, Plus, Edit2, Trash2, Save, X, Eye, EyeOff, Key, Users } from 'lucide-react';

interface Role {
  id: number;
  nombre: string;
  descripcion: string;
}

interface Permiso {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
}

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  role_id: number;
  role_nombre: string;
  role_descripcion: string;
  creado_en: string;
  permisos?: Permiso[];
}

interface Estadistica {
  role: string;
  descripcion: string;
  cantidad: number;
}

export function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState<number | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [usuarioDetalle, setUsuarioDetalle] = useState<Usuario | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    password: '',
    password_confirm: '',
    role_id: 0
  });
  
  // Obtener token desde localStorage
  const getToken = () => localStorage.getItem('token') || '';

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar usuarios
      const resUsuarios = await fetch(`${API_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const dataUsuarios = await resUsuarios.json();
      
      // Cargar roles
      const resRoles = await fetch(`${API_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const dataRoles = await resRoles.json();
      
      if (dataUsuarios.success) {
        setUsuarios(dataUsuarios.usuarios);
        setEstadisticas(dataUsuarios.estadisticas || []);
      }
      
      if (dataRoles.success) {
        setRoles(dataRoles.roles);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (usuario: Usuario) => {
    try {
      const res = await fetch(`${API_URL}/usuarios/${usuario.id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setUsuarioDetalle(data.usuario);
        setMostrarDetalle(true);
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      alert('Error al cargar el detalle del usuario');
    }
  };

  const iniciarEdicion = (usuario: Usuario) => {
    setEditando(usuario.id);
    setCreando(false);
    setCambiandoPassword(null);
    setFormData({
      username: usuario.username,
      nombre: usuario.nombre,
      role_id: usuario.role_id,
      password: '',
      password_confirm: ''
    });
  };

  const iniciarCreacion = () => {
    setCreando(true);
    setEditando(null);
    setCambiandoPassword(null);
    setFormData({
      username: '',
      nombre: '',
      password: '',
      password_confirm: '',
      role_id: roles[0]?.id || 0
    });
  };

  const iniciarCambioPassword = (usuarioId: number) => {
    setCambiandoPassword(usuarioId);
    setEditando(null);
    setCreando(false);
    setFormData({
      username: '',
      nombre: '',
      password: '',
      password_confirm: '',
      role_id: 0
    });
  };

  const cancelar = () => {
    setEditando(null);
    setCreando(false);
    setCambiandoPassword(null);
    setMostrarDetalle(false);
    setUsuarioDetalle(null);
    setFormData({
      username: '',
      nombre: '',
      password: '',
      password_confirm: '',
      role_id: 0
    });
  };

  const guardarUsuario = async () => {
    // Validaciones
    if (creando) {
      if (!formData.username.trim() || !formData.nombre.trim() || !formData.password || !formData.role_id) {
        alert('Todos los campos son obligatorios');
        return;
      }
      
      if (formData.password !== formData.password_confirm) {
        alert('Las contraseñas no coinciden');
        return;
      }

      if (formData.password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    if (editando && (!formData.username.trim() || !formData.nombre.trim() || !formData.role_id)) {
      alert('Username, nombre y rol son obligatorios');
      return;
    }

    try {
      const url = creando 
        ? `${API_URL}/usuarios`
        : `${API_URL}/usuarios/${editando}`;
      
      const method = creando ? 'POST' : 'PUT';
      
      const body = creando
        ? formData
        : { username: formData.username, nombre: formData.nombre, role_id: formData.role_id };
      
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.mensaje);
        cancelar();
        cargarDatos();
      } else {
        alert(data.mensaje || 'Error al guardar el usuario');
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      alert('Error al guardar el usuario');
    }
  };

  const cambiarPassword = async () => {
    if (!formData.password || !formData.password_confirm) {
      alert('Debe ingresar la contraseña y su confirmación');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/usuarios/${cambiandoPassword}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: formData.password,
          password_confirm: formData.password_confirm
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.mensaje);
        cancelar();
      } else {
        alert(data.mensaje || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      alert('Error al cambiar la contraseña');
    }
  };

  const eliminarUsuario = async (id: number, username: string) => {
    if (id === 1) {
      alert('No se puede eliminar el usuario administrador principal');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el usuario "${username}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.mensaje);
        cargarDatos();
      } else {
        alert(data.mensaje || 'Error al eliminar el usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar el usuario');
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'vendedor':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'visitador':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1f1f1f] to-[#2a2a2a] border-2 border-[#fbbf24] rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] rounded-xl">
                <Users className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-white text-3xl font-bold">Gestión de Usuarios</h1>
                <p className="text-gray-400 mt-1">Administra usuarios, roles y permisos del sistema</p>
              </div>
            </div>
            
            {!creando && !editando && !cambiandoPassword && !mostrarDetalle && (
              <PoliceButton
                variant="primary"
                icon={Plus}
                onClick={iniciarCreacion}
              >
                Nuevo Usuario
              </PoliceButton>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        {!creando && !editando && !cambiandoPassword && !mostrarDetalle && estadisticas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {estadisticas.map((stat) => (
              <div key={stat.role} className="bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] border border-[#fbbf24]/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{stat.descripcion}</p>
                    <p className="text-white text-3xl font-bold">{stat.cantidad}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${getRoleBadgeColor(stat.role)}`}>
                    {stat.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Detalle */}
        {mostrarDetalle && usuarioDetalle && (
          <div className="bg-gradient-to-r from-[#1f1f1f] to-[#2a2a2a] border-2 border-[#fbbf24] rounded-2xl p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-6">Detalle del Usuario</h2>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Username</p>
                  <p className="text-white font-semibold">{usuarioDetalle.username}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Nombre Completo</p>
                  <p className="text-white font-semibold">{usuarioDetalle.nombre}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Rol</p>
                  <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold border ${getRoleBadgeColor(usuarioDetalle.role_nombre)}`}>
                    {usuarioDetalle.role_nombre}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Fecha de Creación</p>
                  <p className="text-white font-semibold">{new Date(usuarioDetalle.creado_en).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Descripción del Rol</p>
                <p className="text-white">{usuarioDetalle.role_descripcion}</p>
              </div>

              {usuarioDetalle.permisos && usuarioDetalle.permisos.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-3">Permisos ({usuarioDetalle.permisos.length})</p>
                  <div className="grid grid-cols-2 gap-3">
                    {usuarioDetalle.permisos.map((permiso) => (
                      <div key={permiso.id} className="bg-[#0a0a0a] border border-[#fbbf24]/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-[#fbbf24]" />
                          <p className="text-white text-sm font-semibold">{permiso.nombre}</p>
                        </div>
                        <p className="text-gray-400 text-xs">{permiso.descripcion}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-[#fbbf24]/10 text-[#fbbf24] text-xs rounded-md">
                          {permiso.categoria}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <PoliceButton
              variant="secondary"
              icon={X}
              onClick={cancelar}
            >
              Cerrar
            </PoliceButton>
          </div>
        )}

        {/* Formulario de Cambio de Contraseña */}
        {cambiandoPassword && (
          <div className="bg-gradient-to-r from-[#1f1f1f] to-[#2a2a2a] border-2 border-[#fbbf24] rounded-2xl p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-6 flex items-center gap-2">
              <Key className="w-6 h-6" />
              Cambiar Contraseña
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2 font-semibold">Nueva Contraseña *</label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#fbbf24]/30 rounded-xl text-white focus:border-[#fbbf24] focus:outline-none pr-12"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">Confirmar Contraseña *</label>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={formData.password_confirm}
                  onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#fbbf24]/30 rounded-xl text-white focus:border-[#fbbf24] focus:outline-none"
                  placeholder="Confirmar contraseña"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <PoliceButton
                  variant="primary"
                  icon={Save}
                  onClick={cambiarPassword}
                >
                  Cambiar Contraseña
                </PoliceButton>
                
                <PoliceButton
                  variant="secondary"
                  icon={X}
                  onClick={cancelar}
                >
                  Cancelar
                </PoliceButton>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de Creación/Edición */}
        {(creando || editando) && (
          <div className="bg-gradient-to-r from-[#1f1f1f] to-[#2a2a2a] border-2 border-[#fbbf24] rounded-2xl p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-6">
              {creando ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#fbbf24]/30 rounded-xl text-white focus:border-[#fbbf24] focus:outline-none"
                    placeholder="ej: juan123"
                  />
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">Nombre Completo *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#fbbf24]/30 rounded-xl text-white focus:border-[#fbbf24] focus:outline-none"
                    placeholder="ej: Juan Pérez"
                  />
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-gray-300 mb-2 font-semibold">Rol *</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#fbbf24]/30 rounded-xl text-white focus:border-[#fbbf24] focus:outline-none"
                >
                  <option value={0}>Seleccionar rol...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nombre} - {role.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contraseñas (solo en creación) */}
              {creando && (
                <>
                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">Contraseña *</label>
                    <div className="relative">
                      <input
                        type={mostrarPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#fbbf24]/30 rounded-xl text-white focus:border-[#fbbf24] focus:outline-none pr-12"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">Confirmar Contraseña *</label>
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      value={formData.password_confirm}
                      onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#fbbf24]/30 rounded-xl text-white focus:border-[#fbbf24] focus:outline-none"
                      placeholder="Confirmar contraseña"
                    />
                  </div>
                </>
              )}

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <PoliceButton
                  variant="primary"
                  icon={Save}
                  onClick={guardarUsuario}
                >
                  {creando ? 'Crear Usuario' : 'Actualizar Usuario'}
                </PoliceButton>
                
                <PoliceButton
                  variant="secondary"
                  icon={X}
                  onClick={cancelar}
                >
                  Cancelar
                </PoliceButton>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Usuarios */}
        {!creando && !editando && !cambiandoPassword && !mostrarDetalle && (
          <div className="bg-gradient-to-r from-[#1f1f1f] to-[#2a2a2a] border-2 border-[#fbbf24]/30 rounded-2xl p-6">
            <h2 className="text-white text-2xl font-bold mb-6">Usuarios del Sistema ({usuarios.length})</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#fbbf24]/30">
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">ID</th>
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">Username</th>
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">Nombre</th>
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">Rol</th>
                    <th className="text-left text-gray-400 font-semibold py-3 px-4">Fecha</th>
                    <th className="text-right text-gray-400 font-semibold py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-[#fbbf24]/10 hover:bg-[#0a0a0a]/50 transition-colors">
                      <td className="py-4 px-4 text-white">{usuario.id}</td>
                      <td className="py-4 px-4 text-white font-semibold">{usuario.username}</td>
                      <td className="py-4 px-4 text-white">{usuario.nombre}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold border ${getRoleBadgeColor(usuario.role_nombre)}`}>
                          {usuario.role_nombre}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {new Date(usuario.creado_en).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => verDetalle(usuario)}
                            className="p-2 bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 text-[#fbbf24] rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => iniciarEdicion(usuario)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => iniciarCambioPassword(usuario.id)}
                            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                            title="Cambiar contraseña"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          {usuario.id !== 1 && (
                            <button
                              onClick={() => eliminarUsuario(usuario.id, usuario.username)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
