# TAMV Online Network — sitio institucional

Sitio estático para presentar la identidad pública de TAMV Online Network, organizar líneas de trabajo, facilitar el descubrimiento de repositorios y registros, y publicar los criterios editoriales del proyecto.

> La web es una capa de presentación y descubrimiento. Su existencia no demuestra personalidad jurídica, reconocimiento académico, afiliaciones de terceros, revisión por pares ni madurez de los proyectos enlazados.

## Arquitectura del sitio

- `index.html`: portada institucional, líneas de trabajo y directorio navegable de proyectos con búsqueda y filtros.
- `catalogo.html`: índice público de registros con búsqueda por texto y filtros por tipo.
- `data/catalogo.json`: representación JSON del catálogo, con alcance de evidencia y estados de verificación explícitos.
- `recursos.html`: centro curado de recursos para desarrollo, IA, modelos, aprendizaje y ciencia abierta.
- `contribuir.html`: guía de contribuciones mediante los repositorios públicos.
- `politica-editorial.html`: reglas para atribución, evidencia, madurez, métricas, licencias, privacidad y correcciones.
- `favicon.svg` y `site.webmanifest`: identidad visual y metadatos básicos de instalación.
- `404.html`: página de ruta no encontrada.
- `robots.txt` y `sitemap.xml`: directivas y URLs para descubrimiento por buscadores.
- `vercel.json`: cabeceras HTTP de seguridad para el despliegue en Vercel.
- `scripts/validate_site.py`: comprobaciones estáticas sin dependencias externas.
- `.github/workflows/site-quality.yml`: validación automática en push y pull request.

## Tecnología

HTML, CSS y JavaScript nativos; no se declara un paso de compilación ni dependencias de frontend. Búsqueda y filtros del directorio y del catálogo se ejecutan en el navegador. No hay backend de cuentas, comentarios, suscripciones ni formularios; no se deben anunciar como existentes hasta que se implementen y prueben.

## Comprobación local

Requiere Python 3.10 o posterior y no usa paquetes de terceros.

```bash
python scripts/validate_site.py
```

El validador revisa presencia de páginas esenciales, metadatos HTML mínimos, identificadores repetidos, enlaces y recursos locales, enlaces externos abiertos en nueva pestaña sin `noopener noreferrer`, JSON, manifiesto, configuración de Vercel y URLs del sitemap. Es una prueba estática; no sustituye pruebas en navegador, lectores de pantalla, dispositivos reales, auditoría de seguridad ni prueba de despliegue.

## Despliegue en Vercel

1. Importar este repositorio en Vercel.
2. Seleccionar preset **Other**.
3. No configurar comando de build.
4. Establecer el directorio de salida en la raíz del repositorio.
5. Revisar las rutas `/`, `/catalogo.html`, `/recursos.html`, `/contribuir.html` y `/politica-editorial.html`.
6. Confirmar HTTPS, cabeceras, enlaces, accesibilidad, diseño adaptable y carga real.
7. Verificar que el dominio canónico está asociado al deployment correcto antes de anunciarlo.

**Dominio:** la configuración actual utiliza `https://tamv.online/` como dominio canónico y en sitemap/robots. No se afirma que DNS o producción estén verificados. Si se publica bajo otro dominio, actualizar canonical, Open Graph, JSON-LD, sitemap y robots.

## Seguridad y privacidad

Las cabeceras de Vercel incorporan protección contra MIME sniffing, framing, restricciones de permisos, política de referencia y una Content Security Policy compatible con el HTML/CSS/JS inline actual. Si se agregan scripts, fuentes, widgets, imágenes o servicios externos, revisar la CSP en lugar de relajarla sin análisis. La CSP actual permite `unsafe-inline` para scripts y estilos porque el sitio está construido como páginas estáticas con código inline; migrar a archivos externos y nonces/hashes sería más estricto.

No introducir claves de API, secretos, tokens ni datos personales en el repositorio. Al incorporar analítica, cuentas o formularios, definir el propósito, la base jurídica aplicable, la retención y la política de privacidad antes de recopilar datos.

## Política de evidencia y catálogo

- Un enlace indica que se ha registrado una fuente; no confirma por sí solo exactitud, calidad, disponibilidad o validación externa.
- Los metadatos se deben cotejar con las fichas originales antes de una cita formal.
- No se fabrican publicaciones, afiliaciones, colaboradores, certificaciones ni métricas.
- Los estados del catálogo distinguen los metadatos pendientes de cotejo.
- Una licencia solo se menciona cuando exista un archivo o declaración válida.

## Preparación institucional y ROR

La presencia web es un elemento de documentación, no una garantía de elegibilidad para ROR. La guía oficial de ROR indica que las organizaciones individuales/personales están fuera de alcance y que se requiere evidencia de una entidad colectiva, estable e implicada en investigación, además de resultados de investigación identificables que mencionen a la organización. Antes de enviar una solicitud, buscar primero en [ROR Search](https://ror.org/search) y revisar la [guía oficial de solicitudes](https://ror.org/blog/2026-06-24-three-tips-for-requesting-ror-id/). La decisión corresponde a ROR. No crear afiliaciones o colaboradores artificiales para cumplir criterios.

## Fuentes públicas iniciales

- [ORCID del fundador](https://orcid.org/0009-0008-5050-1539)
- [Perfil de repositorios del proyecto](https://github.com/OsoPanda1)
- [Registro Zenodo enlazado](https://doi.org/10.5281/zenodo.19436662)
- [Portal público TAMV](https://tamvonline-oficial.odoo.com/)
- [Artículo AVIXA Xchange de 2025](https://xchange.avixa.org/posts/tamv-e-isabella-villasenor-ai-el-parteaguas-que-redefine-el-metaverso-desde-mexico)

Las fuentes publicadas por el propio proyecto documentan su autodefinición y comunicación pública. Deben distinguirse de la validación independiente.

## Licencia

Este repositorio no declara una licencia de software. No debe asumirse que el código o los contenidos están en dominio público o que permiten cualquier reutilización hasta que el titular de los derechos publique una licencia.
