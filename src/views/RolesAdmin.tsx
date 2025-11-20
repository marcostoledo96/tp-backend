import React, { useEffect, useState } from 'react';
import { PoliceButton } from './PoliceButton';
import { Plus, Edit2, Trash2, X, Save, Users, Shield, Key, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../config/api';

/**
 * RolesAdmin
 * Componente que permite gestionar roles Y usuarios en una misma vista.
 * Incluye pestañas para cambiar entre ambas secciones.
 */
export function RolesAdmin() {
  // Tab activo ('roles' o 'usuarios')
  const [activeTab, setActiveTab] = useState<'roles' | 'usuarios'>('roles');

  // Estados para ROLES
  const [roles, setRoles] = useState<any[]>([]);
  const [permisosPorCategoria, setPermisosPorCategoria] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', activo: true, permisos: [] as number[] });

  // Estados para USUARIOS
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [changingPassword, setChangingPassword] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', nombre: '', telefono: '', password: '', password_confirm: '', role_id: 0 });

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'roles') {
        const [r1, r2] = await Promise.all([
          fetch(`${API_URL}/api/roles`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/roles/permisos/all`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const rolesRes = await r1.json();
        const permsRes = await r2.json();

        if (rolesRes.success) setRoles(rolesRes.roles || []);
        if (permsRes.success) setPermisosPorCategoria(permsRes.permisos || {});
      } else {
        // Cargar usuarios
        const [r1, r2] = await Promise.all([
          fetch(`${API_URL}/api/usuarios`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/roles`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const usersRes = await r1.json();
        const rolesRes = await r2.json();

        if (usersRes.success) setUsuarios(usersRes.usuarios || []);
        if (rolesRes.success) setRoles(rolesRes.roles || []);
      }
    } catch (error) {
      console.error('Error cargando datos', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  function iniciarCreacion() {
    setEditingRole(null);
    setForm({ nombre: '', descripcion: '', activo: true, permisos: [] });
    setShowForm(true);
  }

  function iniciarEdicion(rol: any) {
    setEditingRole(rol);
    setForm({ nombre: rol.nombre, descripcion: rol.descripcion || '', activo: rol.activo === 1 || rol.activo === true, permisos: rol.permisos ? rol.permisos.map((p: any) => p.id) : [] });
    setShowForm(true);
  }

  function togglePermiso(id: number) {
    console.log('🔘 Toggle permiso ID:', id);
    console.log('   Estado actual form.permisos:', form.permisos);
    
    setForm(prev => {
      const existe = prev.permisos.includes(id);
      const nuevosPermisos = existe 
        ? prev.permisos.filter(p => p !== id) 
        : [...prev.permisos, id];
      
      console.log('   Existe:', existe);
      console.log('   Nuevos permisos:', nuevosPermisos);
      
      return { ...prev, permisos: nuevosPermisos };
    });
  }

  async function guardar() {
    try {
      const url = editingRole ? `${API_URL}/api/roles/${editingRole.id}` : `${API_URL}/api/roles`;
      const method = editingRole ? 'PUT' : 'POST';

      const payload = { 
        nombre: form.nombre, 
        descripcion: form.descripcion, 
        activo: form.activo, 
        permisos: form.permisos 
      };

      console.log('📤 Enviando al backend:', method, url, payload);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log('📥 Respuesta del backend:', data);
      
      if (!data.success) throw new Error(data.mensaje || 'Error al guardar rol');

      alert(data.mensaje || 'Guardado');
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert(error.message || 'Error');
    }
  }

  async function eliminarRol(id: number) {
    if (!confirm('¿Eliminar rol?')) return;
    try {
      const res = await fetch(`${API_URL}/api/roles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) throw new Error(data.mensaje || 'Error al eliminar');
      alert(data.mensaje || 'Eliminado');
      fetchData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error al eliminar rol');
    }
  }

  // ==== FUNCIONES PARA USUARIOS ====
  function iniciarCreacionUsuario() {
    setCreatingUser(true);
    setEditingUser(null);
    setChangingPassword(null);
    setUserForm({ username: '', nombre: '', telefono: '', password: '', password_confirm: '', role_id: roles[0]?.id || 0 });
  }

  function iniciarEdicionUsuario(usuario: any) {
    setEditingUser(usuario);
    setCreatingUser(false);
    setChangingPassword(null);
    setUserForm({ username: usuario.username, nombre: usuario.nombre, telefono: usuario.telefono || '', password: '', password_confirm: '', role_id: usuario.role_id });
  }

  function iniciarCambioPassword(usuarioId: number) {
    setChangingPassword(usuarioId);
    setEditingUser(null);
    setCreatingUser(false);
    setUserForm({ username: '', nombre: '', password: '', password_confirm: '', role_id: 0 });
  }

  function cancelarUsuario() {
    setEditingUser(null);
    setCreatingUser(false);
    setChangingPassword(null);
    setUserForm({ username: '', nombre: '', telefono: '', password: '', password_confirm: '', role_id: 0 });
  }

  async function guardarUsuario() {
    if (creatingUser) {
      if (!userForm.username.trim() || !userForm.nombre.trim() || !userForm.password || !userForm.role_id) {
        alert('Todos los campos son obligatorios');
        return;
      }
      if (userForm.password !== userForm.password_confirm) {
        alert('Las contraseñas no coinciden');
        return;
      }
    }

    if (editingUser && (!userForm.username.trim() || !userForm.nombre.trim() || !userForm.role_id)) {
      alert('Username, nombre y rol son obligatorios');
      return;
    }

    try {
      const url = creatingUser ? `${API_URL}/api/usuarios` : `${API_URL}/api/usuarios/${editingUser.id}`;
      const method = creatingUser ? 'POST' : 'PUT';
      const body = creatingUser ? userForm : { username: userForm.username, nombre: userForm.nombre, telefono: userForm.telefono, role_id: userForm.role_id };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.mensaje || 'Error al guardar');

      alert(data.mensaje || 'Guardado');
      cancelarUsuario();
      fetchData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error al guardar usuario');
    }
  }

  async function cambiarPassword() {
    if (!userForm.password || !userForm.password_confirm) {
      alert('Debe ingresar la contraseña y su confirmación');
      return;
    }
    if (userForm.password !== userForm.password_confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/usuarios/${changingPassword}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: userForm.password, password_confirm: userForm.password_confirm })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.mensaje || 'Error al cambiar contraseña');

      alert(data.mensaje || 'Contraseña cambiada');
      cancelarUsuario();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error al cambiar contraseña');
    }
  }

  async function eliminarUsuario(id: number) {
    if (!confirm('¿Eliminar usuario?')) return;
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) throw new Error(data.mensaje || 'Error al eliminar');
      alert(data.mensaje || 'Eliminado');
      fetchData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error al eliminar usuario');
    }
  }

  if (loading) return <div className="p-6 text-white">Cargando...</div>;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Título principal */}
        <h1 className="text-white text-3xl font-bold mb-6">Panel de Administración</h1>

        {/* Pestañas (Tabs) */}
        <div className="flex gap-2 mb-6 border-b border-[#fbbf24]/20">
          <button
            onClick={() => { setActiveTab('roles'); setShowForm(false); cancelarUsuario(); }}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'roles'
                ? 'text-[#fbbf24] border-b-2 border-[#fbbf24]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="inline-block mr-2 h-5 w-5" />
            Gestión de Roles
          </button>
          <button
            onClick={() => { setActiveTab('usuarios'); setShowForm(false); cancelarUsuario(); }}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'usuarios'
                ? 'text-[#fbbf24] border-b-2 border-[#fbbf24]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="inline-block mr-2 h-5 w-5" />
            Gestión de Usuarios
          </button>
        </div>

        {/* CONTENIDO: ROLES */}
        {activeTab === 'roles' && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-white text-xl sm:text-2xl font-semibold">Roles y Permisos</h2>
              <PoliceButton icon={Plus} onClick={iniciarCreacion}>
                <span className="hidden sm:inline">Nuevo Rol</span>
                <span className="sm:hidden">Nuevo</span>
              </PoliceButton>
            </div>

            {!showForm && (
              <>
                {/* Vista Desktop: Tabla */}
                <div className="hidden lg:block bg-[#0a0a0a] p-6 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-white">
                    <thead>
                      <tr className="border-b border-[#fbbf24]/20">
                        <th className="py-2 px-2">ID</th>
                        <th className="px-2">Nombre</th>
                        <th className="px-2">Descripción</th>
                        <th className="px-2">Permisos</th>
                        <th className="text-right px-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((r) => (
                        <tr key={r.id} className="border-b border-[#fbbf24]/10 hover:bg-[#fbbf24]/5 transition-colors">
                          <td className="py-3 px-2">{r.id}</td>
                          <td className="font-semibold px-2">{r.nombre}</td>
                          <td className="text-gray-300 px-2">{r.descripcion}</td>
                          <td className="text-sm text-gray-300 px-2 max-w-xs truncate">{(r.permisos || []).map((p: any) => p.nombre).join(', ')}</td>
                          <td className="text-right px-2 space-x-2">
                            <button onClick={() => iniciarEdicion(r)} className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-md text-sm transition-colors">
                              Editar
                            </button>
                            <button onClick={() => eliminarRol(r.id)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-md text-sm transition-colors">
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista Mobile/Tablet: Cards */}
                <div className="lg:hidden grid grid-cols-1 gap-4">
                  {roles.map((r) => (
                    <div key={r.id} className="bg-[#0a0a0a] p-4 rounded-xl border border-[#fbbf24]/10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">#{r.id}</span>
                            <h3 className="text-white font-bold text-lg">{r.nombre}</h3>
                          </div>
                          <p className="text-gray-400 text-sm">{r.descripcion}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-xs text-[#fbbf24] font-semibold mb-1">Permisos:</p>
                        <div className="flex flex-wrap gap-1">
                          {(r.permisos || []).map((p: any, idx: number) => (
                            <span key={idx} className="text-xs bg-[#fbbf24]/10 text-gray-300 px-2 py-1 rounded">
                              {p.nombre}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => iniciarEdicion(r)} 
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-md text-sm transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </button>
                        <button 
                          onClick={() => eliminarRol(r.id)} 
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-md text-sm transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {showForm && (
              <div className="bg-[#0a0a0a] p-4 sm:p-6 rounded-xl max-w-4xl mx-auto">
                <h3 className="text-[#fbbf24] font-bold text-lg sm:text-xl mb-4">
                  {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-white block mb-2 text-sm font-medium">Nombre del Rol</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      className="w-full bg-[#1a1a1a] text-white px-4 py-2 rounded-lg border border-[#fbbf24]/20 focus:border-[#fbbf24] focus:outline-none transition-colors"
                      placeholder="Ej: vendedor, cajero..."
                    />
                  </div>

                  <div>
                    <label className="text-white block mb-2 text-sm font-medium">Descripción</label>
                    <textarea
                      value={form.descripcion}
                      onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                      className="w-full bg-[#1a1a1a] text-white px-4 py-2 rounded-lg border border-[#fbbf24]/20 focus:border-[#fbbf24] focus:outline-none transition-colors resize-none"
                      rows={3}
                      placeholder="Describe las responsabilidades de este rol..."
                    />
                  </div>

                  <div>
                    <label className="text-white block mb-3 text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Permisos Asignados
                    </label>
                    
                    <div className="space-y-3">
                      {Object.keys(permisosPorCategoria).map((cat) => (
                        <div key={cat} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#fbbf24]/10">
                          <h4 className="text-[#fbbf24] font-semibold mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            {cat}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {permisosPorCategoria[cat].map((perm: any) => (
                              <label
                                key={perm.id}
                                className="flex items-start gap-3 text-gray-300 hover:text-white cursor-pointer p-2 rounded-md hover:bg-[#fbbf24]/5 transition-all"
                              >
                                <input
                                  type="checkbox"
                                  checked={form.permisos.includes(perm.id)}
                                  onChange={() => togglePermiso(perm.id)}
                                  className="w-4 h-4 mt-0.5 accent-[#fbbf24] cursor-pointer flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{perm.nombre}</p>
                                  <p className="text-xs text-gray-500 break-words">{perm.descripcion}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={guardar}
                      className="flex items-center justify-center gap-2 bg-[#fbbf24] text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-[#f59e0b] transition-all transform hover:scale-105"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingRole ? 'Actualizar Rol' : 'Crear Rol'}</span>
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex items-center justify-center gap-2 bg-gray-600/20 text-white px-6 py-2.5 rounded-lg hover:bg-gray-600/30 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* CONTENIDO: USUARIOS */}
        {activeTab === 'usuarios' && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-white text-xl sm:text-2xl font-semibold">Usuarios del Sistema</h2>
              {!creatingUser && !editingUser && !changingPassword && (
                <PoliceButton icon={Plus} onClick={iniciarCreacionUsuario}>
                  <span className="hidden sm:inline">Nuevo Usuario</span>
                  <span className="sm:hidden">Nuevo</span>
                </PoliceButton>
              )}
            </div>

            {/* Vista Desktop: Tabla */}
            {!creatingUser && !editingUser && !changingPassword && (
              <>
                <div className="hidden lg:block bg-[#0a0a0a] p-6 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-white">
                    <thead>
                      <tr className="border-b border-[#fbbf24]/20">
                        <th className="py-2 px-2">ID</th>
                        <th className="px-2">Username</th>
                        <th className="px-2">Nombre</th>
                        <th className="px-2">Rol</th>
                        <th className="text-right px-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((u) => (
                        <tr key={u.id} className="border-b border-[#fbbf24]/10 hover:bg-[#fbbf24]/5 transition-colors">
                          <td className="py-3 px-2">{u.id}</td>
                          <td className="font-semibold px-2">{u.username}</td>
                          <td className="text-gray-300 px-2">{u.nombre}</td>
                          <td className="text-sm text-gray-300 px-2">{u.role_nombre}</td>
                          <td className="text-right px-2 space-x-2">
                            <button onClick={() => iniciarEdicionUsuario(u)} className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-md text-sm transition-colors">Editar</button>
                            <button onClick={() => iniciarCambioPassword(u.id)} className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-md text-sm transition-colors">Contraseña</button>
                            <button onClick={() => eliminarUsuario(u.id)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-md text-sm transition-colors">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista Mobile/Tablet: Cards */}
                <div className="lg:hidden grid grid-cols-1 gap-4">
                  {usuarios.map((u) => (
                    <div key={u.id} className="bg-[#0a0a0a] p-4 rounded-xl border border-[#fbbf24]/10">
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">#{u.id}</span>
                          <h3 className="text-white font-bold text-lg">{u.username}</h3>
                        </div>
                        <p className="text-gray-400 text-sm">{u.nombre}</p>
                        <span className="inline-block mt-2 text-xs bg-[#fbbf24]/20 text-[#fbbf24] px-2 py-1 rounded">{u.role_nombre}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <button 
                          onClick={() => iniciarEdicionUsuario(u)} 
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-md text-sm transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </button>
                        <button 
                          onClick={() => iniciarCambioPassword(u.id)} 
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-md text-sm transition-colors"
                        >
                          <Key className="h-4 w-4" />
                          Cambiar Contraseña
                        </button>
                        <button 
                          onClick={() => eliminarUsuario(u.id)} 
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-md text-sm transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Formulario de creación/edición */}
            {(creatingUser || editingUser) && (
              <div className="bg-[#0a0a0a] p-4 sm:p-6 rounded-xl max-w-3xl mx-auto">
                <h3 className="text-[#fbbf24] font-bold text-lg sm:text-xl mb-4">
                  {creatingUser ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white block mb-2 text-sm font-medium">Username</label>
                      <input
                        type="text"
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        placeholder="Ej: vendedor1"
                        className="w-full p-3 bg-[#1a1a1a] rounded-lg text-white border border-[#fbbf24]/20 focus:border-[#fbbf24] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-white block mb-2 text-sm font-medium">Nombre Completo</label>
                      <input
                        type="text"
                        value={userForm.nombre}
                        onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                        placeholder="Ej: Juan Pérez"
                        className="w-full p-3 bg-[#1a1a1a] rounded-lg text-white border border-[#fbbf24]/20 focus:border-[#fbbf24] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white block mb-2 text-sm font-medium">Teléfono</label>
                    <input
                      type="tel"
                      value={userForm.telefono}
                      onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value })}
                      placeholder="Ej: +54 9 11 1234-5678"
                      className="w-full p-3 bg-[#1a1a1a] rounded-lg text-white border border-[#fbbf24]/20 focus:border-[#fbbf24] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-white block mb-2 text-sm font-medium">Rol</label>
                    <select
                      value={userForm.role_id}
                      onChange={(e) => setUserForm({ ...userForm, role_id: parseInt(e.target.value) })}
                      className="w-full p-3 bg-[#1a1a1a] rounded-lg text-white border border-[#fbbf24]/20 focus:border-[#fbbf24] focus:outline-none transition-colors"
                    >
                      <option value={0}>Seleccionar rol</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {creatingUser && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-white block mb-2 text-sm font-medium">Contraseña</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full p-3 bg-[#1a1a1a] rounded-lg text-white border border-[#fbbf24]/20 focus:border-[#fbbf24] focus:outline-none transition-colors pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-white block mb-2 text-sm font-medium">Confirmar Contraseña</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={userForm.password_confirm}
                          onChange={(e) => setUserForm({ ...userForm, password_confirm: e.target.value })}
                          placeholder="Repetir contraseña"
                          className="w-full p-3 bg-[#1a1a1a] rounded-lg text-white border border-[#fbbf24]/20 focus:border-[#fbbf24] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={guardarUsuario}
                      className="flex items-center justify-center gap-2 bg-[#fbbf24] text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-[#f59e0b] transition-all transform hover:scale-105"
                    >
                      <Save className="h-4 w-4" />
                      <span>Guardar Usuario</span>
                    </button>
                    <button
                      onClick={cancelarUsuario}
                      className="flex items-center justify-center gap-2 bg-gray-600/20 text-white px-6 py-2.5 rounded-lg hover:bg-gray-600/30 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de cambio de contraseña */}
            {changingPassword && (
              <div className="bg-[#0a0a0a] p-4 sm:p-6 rounded-xl max-w-2xl mx-auto">
                <h3 className="text-[#fbbf24] font-bold text-lg sm:text-xl mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Cambiar Contraseña
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white block mb-2 text-sm font-medium">Nueva Contraseña</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full p-3 bg-[#1a1a1a] rounded-lg text-white border border-[#fbbf24]/20 focus:border-[#fbbf24] focus:outline-none transition-colors pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-white block mb-2 text-sm font-medium">Confirmar Nueva Contraseña</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={userForm.password_confirm}
                        onChange={(e) => setUserForm({ ...userForm, password_confirm: e.target.value })}
                        placeholder="Repetir contraseña"
                        className="w-full p-3 bg-[#1a1a1a] rounded-lg text-white border border-[#fbbf24]/20 focus:border-[#fbbf24] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={cambiarPassword}
                      className="flex items-center justify-center gap-2 bg-green-500/80 hover:bg-green-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-all transform hover:scale-105"
                    >
                      <Key className="h-4 w-4" />
                      <span>Cambiar Contraseña</span>
                    </button>
                    <button
                      onClick={cancelarUsuario}
                      className="flex items-center justify-center gap-2 bg-gray-600/20 text-white px-6 py-2.5 rounded-lg hover:bg-gray-600/30 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RolesAdmin;
