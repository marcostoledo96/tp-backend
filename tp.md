TRABAJO FINAL INTEGRADOR
Extensión del Sistema de Usuarios, Roles y Permisos
con Carrito de Compras
Objetivo General
Ampliar el sistema existente de gestión de usuarios, roles y permisos, incorporando un
módulo de carrito de compras que permita administrar productos, registrar compras y
visualizar el historial de transacciones de cada usuario.
El propósito de esta ampliación es aplicar los conceptos de relaciones entre tablas,
validaciones, vistas dinámicas y control de acceso mediante permisos, dentro de un flujo
práctico de compra y gestión de inventario.
Objetivos Específicos
● Implementar las tablas necesarias para gestionar productos, compras y detalles de
compra.
● Crear un CRUD de productos con validaciones de stock y precio.
● Desarrollar un flujo de carrito que permita agregar, modificar y eliminar productos
antes de confirmar una compra.
● Registrar las compras realizadas por cada usuario y generar los detalles
correspondientes.
● Integrar el control de acceso mediante permisos para restringir la gestión de
productos y las acciones de compra.
Instituto de Formación Técnica Superior 16
Desarrollo de Software Backend
Consignas de Desarrollo
1. Ampliación de la Base de Datos
Agregar las tablas necesarias acorde a su planteo de arquitectura, al proyecto existente.
Tena en cuenta las siguientes consideraciones:
● Un usuario puede tener muchas compras.
● Una compra tiene muchos detalles_compra.
● Cada detalle_compra pertenece a un producto.
2. Gestión de Productos (ABM)
Crear un módulo de administración de productos que permita:
● Listar productos disponibles (/productos)
● Crear nuevos productos (/productos/new)
● Editar productos existentes (/productos/:id/edit)
● Eliminar productos (/productos/:id/delete)
Validaciones requeridas:
● No permitir precios negativos.
● No permitir stocks negativos.
● Mostrar mensajes de error o confirmación al realizar operaciones.
Restricciones:
Solo los usuarios con el permiso “gestionar_productos” (o similar) podrán acceder a estas
funciones.
3. Carrito de Compras (por Usuario)
Desarrollar un flujo de compra que contemple:
● Agregar productos al carrito.
● Modificar la cantidad de productos seleccionados.
Instituto de Formación Técnica Superior 16
Desarrollo de Software Backend
● Eliminar productos del carrito.
● Finalizar la compra → debe crear un registro en compras y los correspondientes en
detalle_compra (donde se visualiza la descripción de la compra en si).
● Actualizar el stock de los productos al confirmar la compra.
Requerimientos:
● El carrito debe ser propio de cada usuario autenticado.
● Solo usuarios con el permiso “crear_compra” (o similar) podrán realizar una compra.
● Validar que la cantidad solicitada no supere el stock disponible.
4. Permisos Recomendados para el Módulo
A continuación, y a modo de resumen, dejo un cuadro con la relación de permisos
inherentes a este nuevo desarrollo (opcionales):
Permiso Descripción
ver_productos Permite visualizar el listado de productos
gestionar_productos Permite crear, editar y eliminar
productos
crear_compra Permite realizar compras desde el
carrito
ver_compras Permite ver el historial de compras
Estos permisos deben poder asignarse desde la vista ‘/roles/:id/edit’, tal como en el sistema
base.
Instituto de Formación Técnica Superior 16
Desarrollo de Software Backend
Entregables
1. Proyecto funcionando con:
○ Gestión de productos.
○ Carrito de compras.
○ Registro e historial de compras por usuario.
○ Integración de permisos para controlar el acceso a cada módulo.
2. Archivo README.md con:
○ Descripción breve del módulo de carrito.
○ Explicación de las tablas nuevas.
○ Permisos creados y su función.
○ Flujo de uso: cómo se agrega un producto al carrito y cómo se confirma la
compra.
Criterios de Evaluación
Criterio Ponderación
Correcta implementación de las nuevas tablas y relaciones 25%
CRUD de productos funcional y validado 25%
Flujo de carrito y compras correctamente implementado 25%
Integración con sistema de permisos, control de permisos y gestión de
errores
15%
README y presentación final clara y completa 10%