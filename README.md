# Dosificadora interactiva · Modelo 3D

Modelo 3D interactivo de la **moldeadora multiformato T-5 10TPL-D**, construido a partir de la taxonomía
(`NUEVA DOSIFICADORA FORMATO.xlsx`). Alcance de esta fase: **solo modelado y secciones** (sin tareas, fallas ni refacciones).

* 19 secciones (10 mecánicas, 9 eléctricas) y **295 elementos** de la taxonomía, todos modelados y seleccionables.
* Modelo procedural en Three.js (sin archivos de malla externos), geometría de alta resolución y materiales PBR.
* Interacción: árbol de secciones, búsqueda, selección por clic, vistas, Rayos X, Aislar, Explosión, Corte,
  puertas de los armarios, etiquetas, ▶ Operación (cadena, cuchillas, elevación, flujo) y Ultra HD.

## Abrir
Abrir `index.html` en un navegador (no requiere servidor ni red, salvo las tipografías de Google Fonts).

## Estructura
* `data/taxonomia.js` – taxonomía extraída del Excel (secciones, elementos, cantidades, nº de parte).
* `js/core.js` – primitivas geométricas, tubos, instancias y registro de elementos.
* `js/b_*.js` – constructores por sección (estructura, cassette/corte/repartidor, banda/manivela/elevación,
  intercambiador/tuberías, eléctrico 1 y 2).
* `js/model.js` – ensamblado, cajas envolventes y animación. `js/app.js` – interfaz.

Las dimensiones son aproximadas (basadas en la taxonomía y en los renders CAD del Excel); se ajustan en `js/b_structure.js` (`K.L`).
