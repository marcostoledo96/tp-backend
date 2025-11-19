import React, { useEffect, useState } from 'react';
import { PoliceButton } from './PoliceButton';
import { Plus, Edit2, Trash2, X, Save, Users, Shield, Key, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../config/api';

/**
 * RolesAdmin
 * Yo: componente que permite gestionar roles Y usuarios en una misma vista.
 *     Incluye pestañas para cambiar entre ambas secciones.
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
  const [userForm, setUserForm] = useState({ username: '', nombre: '', password: '', password_confirm: '', role_id: 0 });

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
      console.error('❌ Error al guardar:', error);
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
    setUserForm({ username: '', nombre: '', password: '', password_confirm: '', role_id: roles[0]?.id || 0 });
  }

  function iniciarEdicionUsuario(usuario: any) {
    setEditingUser(usuario);
    setCreatingUser(false);
    setChangingPassword(null);
    setUserForm({ username: usuario.username, nombre: usuario.nombre, password: '', password_confirm: '', role_id: usuario.role_id });
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
    setUserForm({ username: '', nombre: '', password: '', password_confirm: '', role_id: 0 });
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
      const body = creatingUser ? userForm : { username: userForm.username, nombre: userForm.nombre, role_id: userForm.role_id };

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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-2xl font-semibold">Roles y Permisos</h2>
              <PoliceButton icon={Plus} onClick={iniciarCreacion}>Nuevo Rol</PoliceButton>
            </div>

            {!showForm && (
              <div className="bg-[#0a0a0a] p-6 rounded-xl">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="border-b border-[#fbbf24]/20">
                      <th className="py-2">ID</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Permisos</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((r) => (
                      <tr key={r.id} className="border-b border-[#fbbf24]/10">
                        <td className="py-3">{r.id}</td>
                        <td className="font-semibold">{r.nombre}</td>
                        <td className="text-gray-300">{r.descripcion}</td>
                        <td className="text-sm text-gray-300">{(r.permisos || []).map((p: any) => p.nombre).join(', ')}</td>
                        <td className="text-right">
                          <button onClick={() => iniciarEdicion(r)} className="p-2 bg-blue-500/20 rounded-md mr-2">Editar</button>
                          <button onClick={() => eliminarRol(r.id)} className="p-2 bg-red-500/20 rounded-md">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showForm && (
              <div className="bg-[#0a0a0a] p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del rol" className="p-3 bg-[#070707] rounded-md text-white" />
                  <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción (opcional)" className="p-3 bg-[#070707] rounded-md text-white" />
                </div>

                <div className="mb-4">
                  <p className="text-gray-300 mb-2">Permisos (hacé clic para asignar):</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.keys(permisosPorCategoria).map((cat) => (
                      <div key={cat} className="p-3 bg-[#0f0f0f] rounded-md border border-[#fbbf24]/10">
                        <p className="text-sm text-[#fbbf24] font-semibold mb-2">{cat}</p>
                        {permisosPorCategoria[cat].map((perm: any) => (
                          <label key={perm.id} className="flex items-center gap-2 mb-1">
                            <input type="checkbox" checked={form.permisos.includes(perm.id)} onChange={() => togglePermiso(perm.id)} />
                            <span className="text-white text-sm">{perm.nombre} <span className="text-gray-400 text-xs">{perm.descripcion}</span></span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <PoliceButton icon={Save} onClick={guardar}>Guardar Rol</PoliceButton>
                  <PoliceButton icon={X} variant="secondary" onClick={() => setShowForm(false)}>Cancelar</PoliceButton>
                </div>
              </div>
            )}
          </>
        )}

        {/* CONTENIDO: USUARIOS */}
        {activeTab === 'usuarios' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-2xl font-semibold">Usuarios del Sistema</h2>
              {!creatingUser && !editingUser && !changingPassword && (
                <PoliceButton icon={Plus} onClick={iniciarCreacionUsuario}>Nuevo Usuario</PoliceButton>
              )}
            </div>

            {/* Tabla de usuarios */}
            {!creatingUser && !editingUser && !changingPassword && (
              <div className="bg-[#0a0a0a] p-6 rounded-xl">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="border-b border-[#fbbf24]/20">
                      <th className="py-2">ID</th>
                      <th>Username</th>
                      <th>Nombre</th>
                      <th>Rol</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.id} className="border-b border-[#fbbf24]/10">
                        <td className="py-3">{u.id}</td>
                        <td className="font-semibold">{u.username}</td>
                        <td className="text-gray-300">{u.nombre}</td>
                        <td className="text-sm text-gray-300">{u.role_nombre}</td>
                        <td className="text-right space-x-2">
                          <button onClick={() => iniciarEdicionUsuario(u)} className="p-2 bg-blue-500/20 rounded-md">Editar</button>
                          <button onClick={() => iniciarCambioPassword(u.id)} className="p-2 bg-green-500/20 rounded-md">Cambiar Contraseña</button>
                          <button onClick={() => eliminarUsuario(u.id)} className="p-2 bg-red-500/20 rounded-md">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Formulario de creación/edición */}
            {(creatingUser || editingUser) && (
              <div className="bg-[#0a0a0a] p-6 rounded-xl">
                <h3 className="text-white text-xl font-semibold mb-4">{creatingUser ? 'Crear Usuario' : 'Editar Usuario'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="Username"
                    className="p-3 bg-[#070707] rounded-md text-white"
                  />
                  <input
                    type="text"
                    value={userForm.nombre}
                    onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                    placeholder="Nombre completo"
                    className="p-3 bg-[#070707] rounded-md text-white"
                  />
                  <select
                    value={userForm.role_id}
                    onChange={(e) => setUserForm({ ...userForm, role_id: parseInt(e.target.value) })}
                    className="p-3 bg-[#070707] rounded-md text-white"
                  >
                    <option value={0}>Seleccionar rol</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>

                {creatingUser && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder="Contraseña"
                        className="p-3 bg-[#070707] rounded-md text-white w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password_confirm}
                      onChange={(e) => setUserForm({ ...userForm, password_confirm: e.target.value })}
                      placeholder="Confirmar contraseña"
                      className="p-3 bg-[#070707] rounded-md text-white"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <PoliceButton icon={Save} onClick={guardarUsuario}>Guardar Usuario</PoliceButton>
                  <PoliceButton icon={X} variant="secondary" onClick={cancelarUsuario}>Cancelar</PoliceButton>
                </div>
              </div>
            )}

            {/* Formulario de cambio de contraseña */}
            {changingPassword && (
              <div className="bg-[#0a0a0a] p-6 rounded-xl">
                <h3 className="text-white text-xl font-semibold mb-4">Cambiar Contraseña</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Nueva contraseña"
                      className="p-3 bg-[#070707] rounded-md text-white w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.password_confirm}
                    onChange={(e) => setUserForm({ ...userForm, password_confirm: e.target.value })}
                    placeholder="Confirmar nueva contraseña"
                    className="p-3 bg-[#070707] rounded-md text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <PoliceButton icon={Key} onClick={cambiarPassword}>Cambiar Contraseña</PoliceButton>
                  <PoliceButton icon={X} variant="secondary" onClick={cancelarUsuario}>Cancelar</PoliceButton>
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
