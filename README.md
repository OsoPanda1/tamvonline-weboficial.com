# TAMV Online Network — Sitio institucional

Sitio institucional estático para documentar la identidad pública, las líneas de investigación y desarrollo, la trayectoria, la producción pública y los principios editoriales de TAMV Online Network.

## Estructura

- `index.html`: presentación institucional y líneas de trabajo; alternancia de idioma español/inglés.
- `catalogo.html`: catálogo documental inicial y criterios para describir fuentes sin confundir divulgación con revisión por pares.
- `politica-editorial.html`: política de evidencia, autoría, licencias, métricas, privacidad y correcciones.
- `robots.txt` y `sitemap.xml`: descubrimiento e indexación de páginas públicas.
- `vercel.json`: configuración de sitio estático y encabezados HTTP básicos.

## Estado técnico conocido

- HTML, CSS y JavaScript nativos; no se declaran dependencias de compilación.
- Diseño adaptable y navegación por secciones.
- Alternancia de idioma corregida para restaurar el contenido español sin recargar la página.
- Enlaces externos configurados con `rel="noopener noreferrer"` cuando se abren en otra pestaña.
- Configuración inicial para despliegue estático en Vercel.
- Se recuperaron los archivos del repositorio después de los commits para comprobar su presencia.
- **No se ha verificado un despliegue de producción ni se ha completado una auditoría en navegador, accesibilidad o rendimiento.** No presentar el sitio como probado en producción hasta realizar esas verificaciones.

## Despliegue

1. Importar el repositorio en Vercel.
2. Framework preset: **Other**.
3. Build command: vacío.
4. Output directory: `.`.
5. Desplegar y revisar las rutas `/`, `/catalogo.html` y `/politica-editorial.html`.
6. Confirmar que el dominio configurado sirve HTTPS y que el sitemap apunta al dominio de producción correcto.

La configuración de sitemap y la URL canónica actuales utilizan `https://tamv.online/`. Antes de publicar, verificar que ese dominio apunta al despliegue institucional. Si se elige otro dominio, actualizar la URL canónica, el sitemap y la línea Sitemap de `robots.txt`.

## Objetivo institucional y preparación para ROR

La presencia web es útil para documentar una entidad, pero no garantiza un identificador ROR. La guía oficial de ROR recomienda:

1. Buscar primero si la organización ya tiene registro en https://ror.org/search.
2. Confirmar que la entidad sea estable, colectiva e independiente y esté involucrada en investigación.
3. Mantener una denominación institucional coherente entre el sitio, los metadatos y los resultados de investigación.
4. Aportar varias salidas de investigación verificables que mencionen a la organización como afiliación, financiadora o editora.
5. Aportar evidencia real de participación de más de una persona. ROR indica que las organizaciones unipersonales quedan fuera de alcance.
6. No fabricar afiliaciones, colaboradores, avales, personalidad jurídica ni publicaciones para cumplir los criterios.
7. Enviar la solicitud cuando exista evidencia suficiente; la decisión corresponde a los curadores de ROR.

Guía oficial: https://ror.org/blog/2026-06-24-three-tips-for-requesting-ror-id/

## Principios editoriales

- Distinguir visión, prototipo, software operativo, resultado medido y validación independiente.
- Citar fuentes primarias y registrar fechas y versiones.
- No tratar un DOI como prueba automática de revisión por pares.
- No publicar métricas de impacto sin metodología, periodo y evidencia.
- Declarar licencias únicamente cuando hayan sido elegidas y documentadas.
- Corregir errores factuales y mantener atribución precisa de autoría.

## Fuentes públicas iniciales

- Perfil del proyecto: https://github.com/OsoPanda1
- ORCID del fundador: https://orcid.org/0009-0008-5050-1539
- Registro Zenodo citado por el proyecto: https://doi.org/10.5281/zenodo.19436662
- Portal público TAMV: https://tamvonline-oficial.odoo.com/
- Artículo AVIXA Xchange de diciembre de 2025: https://xchange.avixa.org/posts/tamv-e-isabella-villasenor-ai-el-parteaguas-que-redefine-el-metaverso-desde-mexico
- Guía ROR: https://ror.org/blog/2026-06-24-three-tips-for-requesting-ror-id/

Las fuentes publicadas por el propio proyecto documentan su autodefinición y comunicación pública. No deben presentarse como validación externa sin corroboración independiente.

## Licencia

No se declara una licencia de software en este repositorio. No debe asumirse que el código o los contenidos están en dominio público ni que permiten cualquier reutilización hasta que el titular de los derechos defina y publique una licencia.
