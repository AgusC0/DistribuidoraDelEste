/**
 * Guías interactivas del panel. Cada paso:
 * - señala una parte de la pantalla (`target` = valor de `data-guide`; con varios, se usa el primero visible),
 * - puede llevar a otra sección (`page`),
 * - puede necesitar datos (`missing`): si su parte no está, la guía explica qué falta y no sigue
 *   (o deja seguir, con `canSkip`). Los pasos sin `missing` cuya parte no está se saltean solos.
 */
export type GuideStep = {
  title: string
  text: string
  target?: string | string[]
  page?: string
  missing?: string
  canSkip?: boolean
}

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

const here = (nav: string, section: string): GuideStep => ({
  title: `Estás en ${section}`,
  target: [nav, 'encabezado'],
  text: 'La sección marcada en el menú es donde estás. Desde el menú pasás a cualquier otra.',
})

export const GUIDES: Record<GuideKey, { title: string; steps: GuideStep[] }> = {
  resumen: {
    title: 'Recorrido del panel',
    steps: [
      {
        title: 'Bienvenido al panel',
        target: 'encabezado',
        text: 'Te muestro dónde está cada cosa recorriendo las secciones una por una. Podés salir cuando quieras con la X o la tecla Esc.',
      },
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
      {
        title: 'Últimos pedidos',
        page: '/admin',
        target: 'ultimos-pedidos',
        text: 'Los 5 pedidos más recientes con su estado.',
        missing: 'Todavía no llegó ningún pedido. Cuando un cliente mande uno desde el sitio, va a aparecer en esta parte del resumen.',
        canSkip: true,
      },
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
        target: ['cat-arbol', 'encabezado'],
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
        target: 'resumen-acciones',
        text: 'Ya conocés el panel. En cada sección tenés el botón "Guía" para recorrerla en detalle.',
      },
    ],
  },

  pedidos: {
    title: 'Pedidos',
    steps: [
      here('nav-pedidos', 'Pedidos'),
      {
        title: '¿Qué es un pedido?',
        target: 'encabezado',
        text: 'Cuando un cliente arma su lista en el sitio y toca "Pedir presupuesto por WhatsApp", el pedido queda guardado acá con cada producto, variante, código y precio del momento.',
      },
      {
        title: 'Cómo viene la web',
        target: 'pedidos-stats',
        text: 'Cuántos pedidos llegaron en 30 días, cuántos se vendieron, el total vendido y el ticket promedio.',
        missing:
          'Todavía no llegó ningún pedido, así que no hay nada para mostrarte. La guía sigue cuando un cliente mande su primer pedido desde el sitio ("Agregar al pedido" → "Pedir presupuesto por WhatsApp").',
      },
      { title: 'Filtrar y buscar', target: 'pedidos-filtros', text: 'Separá por estado o buscá por número, nombre, producto o código.' },
      { title: 'Un pedido', target: 'pedido', text: 'Qué pidió el cliente, cuántas unidades y el total estimado. Si dejó un comentario, aparece abajo.' },
      {
        title: 'El estado',
        target: 'pedido-estado',
        text: 'Nuevo → Presupuestado (ya le pasaste el precio) → Vendido o Perdido. Al marcarlo Vendido se carga el total estimado como monto; corregilo si vendiste otra cosa.',
      },
      { title: 'Notas y copiar', target: 'pedido-acciones', text: 'Anotá lo que necesites recordar (se guarda solo) y copiá el pedido para pegarlo en WhatsApp o en tu sistema.' },
      { title: 'Lo más pedido', target: 'mas-pedido', text: 'Los productos que más unidades suman en pedidos. Sirve para decidir qué reponer o poner en promoción.' },
    ],
  },

  consultas: {
    title: 'Consultas',
    steps: [
      here('nav-consultas', 'Consultas'),
      { title: '¿Qué es una consulta?', target: 'encabezado', text: 'Lo que la gente envía desde el formulario de contacto del sitio: nombre, teléfono, producto y mensaje.' },
      {
        title: 'Filtrar y buscar',
        target: 'consultas-filtros',
        text: 'Nuevas, contactadas o cerradas. El buscador encuentra por nombre, teléfono o producto.',
        missing: 'Todavía no llegó ninguna consulta. La guía sigue cuando alguien complete el formulario de contacto del sitio.',
      },
      {
        title: 'Responder',
        target: 'consulta',
        text: '"Responder" abre WhatsApp con un mensaje listo y marca la consulta como contactada. Las notas internas se guardan solas.',
      },
      { title: 'Exportar', target: 'consultas-acciones', text: 'Con "Exportar CSV" bajás todas las consultas para abrirlas en Excel.' },
    ],
  },

  productos: {
    title: 'Productos',
    steps: [
      here('nav-productos', 'Productos'),
      { title: 'Tu catálogo', target: 'encabezado', text: 'Todos los productos, publicados u ocultos. Los cambios se ven en el sitio al instante.' },
      { title: 'Precios en el sitio', target: 'precios', text: 'Con este interruptor mostrás u ocultás todos los montos del sitio (tarjetas, fichas, pedido y WhatsApp).' },
      {
        title: 'Buscar y filtrar',
        target: 'productos-filtros',
        text: 'Buscá por nombre, código o marca y filtrá por categoría o estado: publicados, ocultos, en promo, sin stock o fichas incompletas.',
      },
      {
        title: 'Editar sin abrir la ficha',
        target: 'productos-tabla',
        text: 'Tocá el precio para cambiarlo, elegí el stock en la lista y usá los interruptores para publicar, poner en promo o destacar. La flecha de cada fila despliega las variantes.',
        missing: 'Todavía no hay productos. Cargá el primero con "Nuevo producto" o importá una planilla con "Excel", y la guía sigue.',
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
      { title: 'Información', target: 'producto-info', text: 'Nombre, categoría, marca, código y descripciones. La categoría define qué filtros aparecen más abajo.' },
      { title: 'Filtros del catálogo', target: 'producto-filtros', text: 'Los valores con los que el cliente encuentra el producto al filtrar (tipo, medida, color…).' },
      { title: 'Fotos', target: 'producto-fotos', text: 'La primera es la principal. Podés sumar varias, reordenarlas y elegir cuál muestra cada variante.' },
      { title: 'Opciones y variantes', target: 'producto-variantes', text: 'Si viene en medidas o colores, cargá las opciones y generá las combinaciones: cada una tiene su código, precio y stock.' },
      { title: 'Complementos', target: 'producto-complementos', text: 'Lo que se compra junto (ej: la mochila para el inodoro). Se ofrece en "Completá tu compra".' },
      { title: 'Ficha técnica', target: 'producto-ficha', text: 'Medidas, material, garantía… Aparece en la tabla "Detalles del producto".' },
      { title: 'Estado', target: 'producto-estado', text: 'Publicado (visible en el sitio), destacado y stock.' },
      { title: 'Promoción', target: 'producto-promo', text: 'Activala para mostrar el precio anterior tachado y el % OFF. Con fechas, se prende y se apaga sola.' },
      { title: 'Guardar', target: 'producto-guardar', text: 'Los cambios se publican al guardar.' },
    ],
  },

  promociones: {
    title: 'Promociones',
    steps: [
      here('nav-promociones', 'Promociones'),
      {
        title: 'Dónde se ven',
        target: 'encabezado',
        text: 'Los productos en promoción aparecen en una sección especial de la portada, en el menú "Productos" del sitio y con la etiqueta PROMO en todo el catálogo.',
      },
      {
        title: 'Cómo sumar promociones',
        target: ['vacio', 'productos-filtros'],
        text: 'En Productos, marcá los productos y tocá "Promoción" en la barra: elegís el % de descuento, la fecha de fin y si es hasta agotar stock.',
      },
      {
        title: 'Tus promociones',
        target: 'productos-tabla',
        text: 'Esta lista muestra sólo los productos en promo. Podés cambiar precio y stock igual que en Productos.',
        missing: 'Todavía no hay productos en promoción. Poné al menos uno en promo desde Productos y la guía sigue.',
      },
      { title: 'Quitar promociones', target: 'productos-tabla', text: 'Marcá los productos y tocá "Promoción" → "Quitar promo": vuelven solos a su precio de lista.' },
    ],
  },

  categorias: {
    title: 'Categorías',
    steps: [
      here('nav-categorias', 'Categorías'),
      {
        title: 'El árbol del catálogo',
        target: 'cat-arbol',
        text: 'Hasta tres niveles: rubro → subcategoría → tipo (ej: Baño → Sanitarios → Inodoros). El menú "Productos" del sitio se arma solo con este árbol, en este mismo orden.',
        missing: 'Todavía no hay categorías. Creá la primera con el formulario de arriba y la guía sigue.',
      },
      { title: 'Un rubro', target: 'cat-fila', text: 'El primer nivel. Debajo aparecen sus subcategorías, con sangría.' },
      { title: 'Ordenar', target: 'cat-orden', text: 'Con las flechas subís o bajás la categoría. Así se ordena también en el menú del sitio.' },
      { title: 'Cantidad de productos', target: 'cat-cantidad', text: 'Cuántos productos publicados tiene, contando sus subcategorías. Las categorías vacías no se muestran en el sitio.' },
      { title: 'Sumar una subcategoría', target: 'cat-sub', text: 'Crea una categoría adentro de esta (por ejemplo, "Inodoros" dentro de "Sanitarios").' },
      { title: 'Editar', target: 'cat-editar', text: 'Cambiá el nombre, la descripción, dónde está ubicada y sus filtros.' },
      {
        title: 'Filtros',
        target: 'cat-filtros',
        text: 'Los filtros que ve el cliente al entrar a la categoría (Tipo, Medida, Color…). Si una subcategoría no tiene propios, usa los de la categoría de arriba.',
      },
      { title: 'Nueva categoría', target: 'cat-nueva', text: 'Escribí el nombre, elegí dónde va (rubro o adentro de otra) y tocá "Agregar".' },
    ],
  },

  busquedas: {
    title: 'Búsquedas',
    steps: [
      here('nav-busquedas', 'Búsquedas'),
      { title: 'Qué busca la gente', target: 'encabezado', text: 'Todo lo que escriben en el buscador del sitio y desde qué botones te escriben por WhatsApp. Datos anónimos de 30 días.' },
      {
        title: 'Lo más buscado',
        target: 'mas-buscado',
        text: 'Los términos más frecuentes. Aparecen como sugerencias en el buscador del sitio.',
        missing: 'Todavía no hay búsquedas registradas. La guía sigue cuando alguien use el buscador del sitio (podés probarlo vos mismo desde "Ver sitio").',
      },
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
      here('nav-ajustes', 'Ajustes'),
      { title: 'Precios en el sitio', target: 'precios', text: 'Mostrá u ocultá todos los montos del sitio con un solo interruptor.' },
      { title: 'Negocio y contacto', target: 'ajustes-negocio', text: 'Nombre, WhatsApp, dirección y email. Se usan en todo el sitio y en los mensajes de WhatsApp.' },
      { title: 'Horarios', target: 'ajustes-horarios', text: 'El sitio muestra "Abierto" o "Cerrado" según estos horarios.' },
      { title: 'Formas de pago', target: 'ajustes-pagos', text: 'El % de descuento por transferencia y las cuotas se muestran en cada producto y en el total del pedido.' },
      { title: 'Portada', target: 'ajustes-portada', text: 'El título y el texto grandes de la portada.' },
      { title: 'Avisos por email', target: 'ajustes-email', text: 'El email que recibe un aviso con cada pedido o consulta nueva.' },
      { title: 'Barra de anuncio', target: 'ajustes-anuncio', text: 'Un aviso arriba de todo el sitio (ej: "Cerrado por feriado").' },
      { title: 'Guardar', target: 'ajustes-guardar', text: 'Los cambios de esta página se aplican al tocar "Guardar cambios".' },
      { title: 'Respaldo', target: 'ajustes-respaldo', text: 'Descargá una copia de todo (productos, pedidos y consultas) de vez en cuando.' },
    ],
  },

  importar: {
    title: 'Importar desde Excel',
    steps: [
      {
        title: 'Muchos productos de una vez',
        target: 'encabezado',
        text: 'Ideal para cargar el catálogo inicial o actualizar la lista de precios. Admite planillas de hasta 20 MB (miles de productos).',
      },
      { title: 'Descargá la planilla', target: 'importar-pasos', text: 'Bajá los productos actuales (o el modelo vacío), editalos en Excel y guardalos como CSV.' },
      { title: 'Qué actualizar', target: 'importar-modo', text: '"Sólo precios" es lo más seguro: no crea ni borra productos. "Todo" también crea productos nuevos y actualiza los demás datos.' },
      { title: 'Revisar antes de aplicar', target: 'importar-archivo', text: 'Subí el archivo y tocá "Revisar cambios": ves qué se crea y qué se actualiza antes de confirmar.' },
    ],
  },
}
