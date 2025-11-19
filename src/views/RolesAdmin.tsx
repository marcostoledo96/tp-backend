import React, { useEffect, useState } from 'react';
import { PoliceButton } from './PoliceButton';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { API_URL } from '../config/api';

/**
 * RolesAdmin
 * Yo: componente que permite crear, editar y eliminar roles
 *     y asignar permisos haciendo clic en casillas.
 */
export function RolesAdmin() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permisosPorCategoria, setPermisosPorCategoria] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', activo: true, permisos: [] as number[] });

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/api/roles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/roles/permisos/all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const rolesRes = await r1.json();
      const permsRes = await r2.json();

      if (rolesRes.success) setRoles(rolesRes.roles || []);
      if (permsRes.success) setPermisosPorCategoria(permsRes.permisos || {});
    } catch (error) {
      console.error('Error cargando roles/permisos', error);
      alert('Error al cargar roles y permisos');
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
    setForm(prev => {
      const existe = prev.permisos.includes(id);
      return { ...prev, permisos: existe ? prev.permisos.filter(p => p !== id) : [...prev.permisos, id] };
    });
  }

  async function guardar() {
    try {
      const url = editingRole ? `${API_URL}/api/roles/${editingRole.id}` : `${API_URL}/api/roles`;
      const method = editingRole ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: form.nombre, descripcion: form.descripcion, activo: form.activo, permisos: form.permisos })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.mensaje || 'Error al guardar rol');

      alert(data.mensaje || 'Guardado');
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
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

  if (loading) return <div className="p-6 text-white">Cargando...</div>;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-3xl font-bold">Gestión de Roles</h1>
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
      </div>
    </div>
  );
}

export default RolesAdmin;
