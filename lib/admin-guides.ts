/**
 * Guías interactivas del panel. Cada paso puede:
 * - señalar una parte de la pantalla (`target` = valor de `data-guide`; con varios, se usa el primero visible),
 * - llevar a otra sección (`page`).
 * Si la parte no está (por ejemplo, todavía no hay pedidos), el paso se saltea: la guía se adapta a lo que hay.
 */
export type GuideStep = { title: string; text: string; target?: string | string[]; page?: string }

export type GuideKey =
  | 'resumen'
  | 'pedidos'
  | 'consultas'
  | 'productos'
  | 'producto'
  | 'promociones'
  | 'categorias'
  | 'busquedas'
  | 'ajustes'
  | 'importar'

export const GUIDES: Record<GuideKey, { title: string; steps: GuideStep[] }> = {
  resumen: {
    title: 'Recorrido del panel',
    steps: [
      { title: 'Bienvenido al panel', text: 'Te muestro dónde está cada cosa. Vamos a recorrer las secciones una por una; podés salir cuando quieras con la X o la tecla Esc.' },
      {
        title: 'Para atender',
        page: '/admin',
        target: 'tareas',
        text: 'Lo primero que mirás al entrar: lo que pide una acción, de lo más urgente a lo menos (pedidos y consultas nuevas, sin stock, promos por vencer, fichas incompletas). Tocá una fila para resolverlo.',
      },
      {
        title: 'Últimos 30 días',
        page: '/admin',
        target: 'mes',
        text: 'Pedidos, lo vendido por la web, clics a WhatsApp y visitas. La flecha compara con los 30 días anteriores.',
      },
      { title: 'Últimos pedidos', page: '/admin', target: 'ultimos-pedidos', text: 'Los 5 pedidos más recientes con su estado.' },
      { title: 'Cargar un producto', page: '/admin', target: 'resumen-acciones', text: 'El atajo más usado: crear un producto nuevo. El botón "Guía" repite este recorrido.' },
      {
        title: 'Pedidos',
        page: '/admin/pedidos',
        target: ['nav-pedidos', 'encabezado'],
        text: 'Cada pedido que un cliente arma en el sitio y manda por WhatsApp queda acá, con productos, códigos y precios. Marcás si lo presupuestaste, vendiste o perdiste.',
      },
      {
        title: 'Consultas',
        page: '/admin/consultas',
        target: ['nav-consultas', 'encabezado'],
        text: 'Lo que llega desde el formulario de contacto. Las respondés por WhatsApp con un toque.',
      },
      {
        title: 'Productos',
        page: '/admin/productos',
        target: ['productos-tabla', 'encabezado'],
        text: 'Todo el catálogo. Cambiás precio y stock desde la tabla, ves la calidad de cada ficha y, marcando varios, los editás todos juntos.',
      },
      {
        title: 'Promociones',
        page: '/admin/promociones',
        target: ['nav-promociones', 'encabezado'],
        text: 'Los productos en oferta: se muestran primero en la portada y en el menú del sitio, con la etiqueta PROMO.',
      },
      {
        title: 'Categorías',
        page: '/admin/categorias',
        target: ['nav-categorias', 'encabezado'],
        text: 'El árbol del catálogo (rubro → subcategoría → tipo) y los filtros de cada categoría. El menú del sitio se arma solo con esto.',
      },
      {
        title: 'Búsquedas',
        page: '/admin/busquedas',
        target: ['nav-busquedas', 'encabezado'],
        text: 'Qué busca la gente en el sitio y qué no encuentra: ideas de productos para sumar.',
      },
      {
        title: 'Ajustes',
        page: '/admin/ajustes',
        target: ['precios', 'encabezado'],
        text: 'Datos del negocio, formas de pago, avisos por email y respaldo. Con este interruptor mostrás u ocultás todos los precios del sitio.',
      },
      {
        title: '¡Listo!',
        page: '/admin',
        text: 'Ya conocés el panel. En cada sección vas a encontrar el botón "Guía" para recorrerla en detalle.',
      },
    ],
  },
  pedidos: {
    title: 'Pedidos',
    steps: [
      { title: 'Estás en Pedidos', target: ['nav-pedidos', 'encabezado'], text: 'La sección marcada en el menú es donde estás. Desde el menú pasás a cualquier otra.' },
      {
        title: '¿Qué es un pedido?',
        text: 'Cuando un cliente arma su lista en el sitio y toca "Pedir presupuesto por WhatsApp", el pedido queda guardado acá con cada producto, variante, código y precio del momento.',
      },
      { title: 'Cómo viene la web', target: 'pedidos-stats', text: 'Cuántos pedidos llegaron en 30 días, cuántos se vendieron, el total vendido y el ticket promedio.' },
      { title: 'Filtrar y buscar', target: 'pedidos-filtros', text: 'Separá por estado o buscá por número, nombre, producto o código.' },
      { title: 'Un pedido', target: 'pedido', text: 'Cada pedido muestra qué pidió el cliente, cuántas unidades y el total estimado. El comentario del cliente aparece abajo.' },
      {
        title: 'El estado',
        target: 'pedido-estado',
        text: 'Nuevo → Presupuestado (ya le pasaste el precio) → Vendido o Perdido. Al marcarlo Vendido se carga el total estimado como monto; corregilo si vendiste otra cosa.',
      },
      { title: 'Notas y copiar', target: 'pedido-acciones', text: 'Anotá lo que necesites recordar (se guarda solo) y copiá el pedido para pegarlo en WhatsApp o en tu sistema.' },
      { title: 'Lo más pedido', target: 'mas-pedido', text: 'Los productos que más unidades suman en pedidos. Sirve para decidir qué reponer o qué poner en promoción.' },
    ],
  },
  consultas: {
    title: 'Consultas',
    steps: [
      { title: 'Estás en Consultas', target: ['nav-consultas', 'encabezado'], text: 'La sección marcada en el menú es donde estás. Desde el menú pasás a cualquier otra.' },
      { title: '¿Qué es una consulta?', text: 'Lo que la gente envía desde el formulario de contacto del sitio: nombre, teléfono, producto y mensaje.' },
      { title: 'Filtrar y buscar', target: 'consultas-filtros', text: 'Nuevas, contactadas o cerradas. El buscador encuentra por nombre, teléfono o producto.' },
      {
        title: 'Responder',
        target: 'consulta',
        text: '"Responder" abre WhatsApp con un mensaje listo y marca la consulta como contactada. Las notas internas se guardan solas.',
      },
      { title: 'Exportar', text: 'Con "Exportar CSV" bajás todas las consultas para abrirlas en Excel.' },
    ],
  },
  productos: {
    title: 'Productos',
    steps: [
      { title: 'Estás en Productos', target: ['nav-productos', 'encabezado'], text: 'La sección marcada en el menú es donde estás. Desde el menú pasás a cualquier otra.' },
      { title: 'Tu catálogo', text: 'Todos los productos, publicados u ocultos. Los cambios se ven en el sitio al instante.' },
      { title: 'Precios en el sitio', target: 'precios', text: 'Con este interruptor mostrás u ocultás todos los montos del sitio (tarjetas, fichas, pedido y WhatsApp).' },
      { title: 'Buscar y filtrar', target: 'productos-filtros', text: 'Buscá por nombre, código o marca y filtrá por categoría o estado: publicados, ocultos, en promo, sin stock o fichas incompletas.' },
      {
        title: 'Editar sin abrir la ficha',
        target: 'productos-tabla',
        text: 'Tocá el precio para cambiarlo, elegí el stock en la lista y usá los interruptores para publicar, poner en promo o destacar. La flecha de cada fila despliega las variantes para editarlas una por una.',
      },
      {
        title: 'Calidad de la ficha',
        target: 'productos-tabla',
        text: 'El porcentaje dice qué tan completa está cada ficha. Verde: completa. Ámbar o rojo: le faltan cosas (foto, precio, descripción…). Tocalo para ver qué falta.',
      },
      {
        title: 'Cambiar muchos a la vez',
        target: 'productos-tabla',
        text: 'Marcá las casillas de varios productos y aparece una barra para publicar, ocultar, cambiar stock, mover de categoría, poner en promo, ajustar precios o eliminar.',
      },
      { title: 'Excel y nuevo producto', target: 'productos-acciones', text: '"Excel" importa o exporta el catálogo completo. "Nuevo producto" abre una ficha vacía.' },
    ],
  },
  producto: {
    title: 'Ficha de producto',
    steps: [
      { title: 'Calidad de la ficha', target: 'calidad', text: 'Qué le falta a la ficha para estar completa. Cada punto suma: las fichas completas aparecen mejor en Google y venden más.' },
      { title: 'Datos básicos', text: 'Nombre, categoría, marca, código y una descripción corta. La categoría define qué filtros aparecen más abajo.' },
      { title: 'Fotos', text: 'La primera es la principal. Podés sumar varias y elegir cuál muestra cada variante.' },
      { title: 'Variantes', text: 'Si el producto viene en medidas o colores, cargá las opciones y generá las combinaciones: cada una tiene su código, precio y stock.' },
      { title: 'Promoción', text: 'Activala para mostrar el precio anterior tachado y el % OFF. Con fechas, se prende y se apaga sola.' },
      { title: 'Guardar', text: 'Los cambios se publican al guardar. Si el producto está oculto, no se ve en el sitio.' },
    ],
  },
  promociones: {
    title: 'Promociones',
    steps: [
      { title: 'Estás en Promociones', target: ['nav-promociones', 'encabezado'], text: 'La sección marcada en el menú es donde estás. Desde el menú pasás a cualquier otra.' },
      {
        title: 'Dónde se ven',
        text: 'Los productos en promoción aparecen en una sección especial de la portada, en el menú "Productos" del sitio y con la etiqueta PROMO en todo el catálogo.',
      },
      { title: 'Tus promociones', target: 'productos-tabla', text: 'Esta lista muestra sólo los productos en promo. Podés cambiar precio y stock igual que en Productos.' },
      {
        title: 'Sumar promociones',
        target: 'productos-filtros',
        text: 'Pasá a "Todos", marcá los productos y tocá "Promoción" en la barra: elegís el % de descuento, la fecha de fin y si es hasta agotar stock.',
      },
      { title: 'Quitar promociones', text: 'Marcá los productos y tocá "Promoción" → "Quitar promo": vuelven solos a su precio de lista.' },
    ],
  },
  categorias: {
    title: 'Categorías',
    steps: [
      { title: 'Estás en Categorías', target: ['nav-categorias', 'encabezado'], text: 'La sección marcada en el menú es donde estás. Desde el menú pasás a cualquier otra.' },
      { title: 'Cómo se ordena el catálogo', text: 'Hasta tres niveles: rubro → subcategoría → tipo (ej: Baño → Sanitarios → Inodoros). El menú del sitio se arma solo con este árbol.' },
      { title: 'Filtros', text: 'Cada categoría puede tener sus filtros (Tipo, Medida, Color…). Las subcategorías heredan los de su categoría madre si no tienen propios.' },
      { title: 'Ordenar', text: 'Usá las flechas para cambiar el orden en que aparecen en el sitio.' },
    ],
  },
  busquedas: {
    title: 'Búsquedas',
    steps: [
      { title: 'Estás en Búsquedas', target: ['nav-busquedas', 'encabezado'], text: 'La sección marcada en el menú es donde estás. Desde el menú pasás a cualquier otra.' },
      { title: 'Qué busca la gente', text: 'Todo lo que escriben en el buscador del sitio y desde qué botones inician consultas por WhatsApp. Datos anónimos de 30 días.' },
      { title: 'Lo más buscado', target: 'mas-buscado', text: 'Los términos más frecuentes. Aparecen como sugerencias en el buscador del sitio.' },
      {
        title: 'Buscan y no encuentran',
        target: 'sin-resultados',
        text: 'Oportunidades: productos que la gente quiere y no encuentra. Sumalos al catálogo o agregá esa palabra como etiqueta a un producto parecido.',
      },
      { title: 'Origen de las consultas', target: 'origen', text: 'Qué botones del sitio generan más clics a WhatsApp.' },
    ],
  },
  ajustes: {
    title: 'Ajustes',
    steps: [
      { title: 'Estás en Ajustes', target: ['nav-ajustes', 'encabezado'], text: 'La sección marcada en el menú es donde estás. Desde el menú pasás a cualquier otra.' },
      { title: 'Precios en el sitio', target: 'precios', text: 'Mostrá u ocultá todos los montos del sitio con un solo interruptor.' },
      { title: 'Datos del negocio', text: 'Nombre, WhatsApp, dirección, horarios y redes. Se usan en todo el sitio y en los mensajes de WhatsApp.' },
      { title: 'Formas de pago', text: 'El % de descuento por transferencia y las cuotas se muestran en cada producto y en el total del pedido.' },
      { title: 'Avisos por email', text: 'El email que recibe un aviso con cada pedido o consulta nueva.' },
      { title: 'Respaldo', text: 'Descargá una copia de todo el catálogo, pedidos y consultas. Guardala de vez en cuando.' },
    ],
  },
  importar: {
    title: 'Importar desde Excel',
    steps: [
      { title: 'Muchos productos de una vez', text: 'Ideal para cargar el catálogo inicial o actualizar la lista de precios. Admite planillas de hasta 20 MB (miles de productos).' },
      { title: 'Descargá la planilla', target: 'importar-pasos', text: 'Bajá los productos actuales (o el modelo vacío), editalos en Excel y guardalos como CSV.' },
      { title: 'Qué actualizar', target: 'importar-modo', text: '"Sólo precios" es lo más seguro: no crea ni borra productos. "Todo" también crea productos nuevos y actualiza los demás datos.' },
      { title: 'Revisar antes de aplicar', target: 'importar-archivo', text: 'Subí el archivo y tocá "Revisar cambios": vas a ver qué se crea y qué se actualiza antes de confirmar.' },
    ],
  },
}
