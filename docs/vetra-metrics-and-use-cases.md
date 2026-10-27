# VETRA Ω∞ — Métricas cuantitativas, casos de uso de IA y reglas de medición

**Versión:** 1.0 · Complemento de `CANON-VETRA-OMEGA-INFINITY-2026-V1.0`

## 1. Esquema cuantitativo

### 1.1 Escala por dominio

Cada una de las catorce dimensiones recibe un valor de 0 a 4:
- **0 — Crítico/no sustentado:** falta evidencia esencial o existe un fallo que impide seguir.
- **1 — Débil:** brechas importantes, procedimientos incompletos o afirmaciones excesivas.
- **2 — Parcial:** base plausible, pero necesita pruebas o controles adicionales.
- **3 — Adecuado:** evidencia suficiente para el alcance y la fase declarados.
- **4 — Robusto:** evidencia triangulada y reproducible; evaluación externa cuando sea necesaria.

Cada puntuación debe vincularse a:
1. evidencia identificable;
2. criterio exacto de la rúbrica;
3. justificación;
4. nivel de confianza del revisor;
5. incertidumbre o limitación;
6. acción de remediación, si aplica.

El nivel 4 no debe concederse por una lista marcada, por prosa convincente o solo por una salida de IA.

### 1.2 Pesos iniciales

| Dominio | Peso | Ejemplos de indicadores |
|---|---:|---|
| Validez científica | 12 | Hipótesis, estado del arte, fuentes primarias, validez de conclusión |
| Solidez técnica | 10 | Pruebas, cobertura de requisitos, interoperabilidad, defectos bloqueantes |
| Seguridad | 9 | Riesgo residual, controles críticos, exposición, respuesta a incidentes |
| Privacidad | 7 | Minimización, consentimiento, retención y borrado |
| Ética | 8 | Daño, equidad, grupos afectados, supervisión |
| Reproducibilidad | 10 | Repetibilidad de pasos, entorno, datos/código accesibles o restringidos justificadamente |
| Gobernanza | 7 | Roles, auditoría, apelación, cambios, responsable operativo |
| Impacto social | 5 | Beneficio declarado, daños, accesibilidad, evidencia con usuarios |
| Viabilidad económica | 5 | Coste documentado, mantenimiento, fuente de recursos, dependencia |
| Integridad científica | 8 | Autoría, conflictos, duplicación, originalidad y referencias |
| Fiabilidad cognitiva | 5 | Exactitud por tarea, alucinación detectada, robustez, deriva |
| Metaevaluación | 4 | Concordancia entre revisores, omisiones, calidad de motivaciones |
| Evidencia y procedencia | 5 | Metadatos, versiones, hashes verificables, licencias |
| Consecuencias futuras | 5 | Mal uso, dependencia, reversibilidad, efectos de segundo orden |
| **Total** | **100** | |

### 1.3 Cálculo

Para los dominios aplicables:

`Score = Σ (peso_i × nota_i / 4)`

El resultado está entre 0 y 100. Si se declara un dominio no aplicable, el revisor debe explicar por qué y los pesos aplicables se normalizan a 100. No se permite utilizar N/A para evitar revisar seguridad, privacidad, derechos o ética cuando el objeto sí los involucra.

Los cuatro bandas iniciales (85–100, 70–84, 50–69, 0–49) son **umbrales piloto no calibrados**. La puntuación no debe publicarse sin la matriz por dominio, fallos críticos, revisiones, desacuerdos y contexto de la disciplina.

## 2. Tres filtros y métricas de entrada

### Filtro 1 — Integridad y procedencia
Indicadores:
- campos obligatorios completos / campos requeridos;
- porcentaje de referencias con enlace primario consultable;
- porcentaje de artefactos con autoría, versión y licencia clara;
- declaraciones de financiación y conflictos completas;
- discrepancias en metadatos resueltas antes de revisión.

**Puerta mínima:** expediente identificable, afirmaciones acotadas, contribuciones declaradas y ausencia de fraude material identificado. La completitud no compensa una falsificación.

### Filtro 2 — Método y reproducibilidad
Indicadores:
- hipótesis/requisitos con criterios de éxito observables;
- pruebas con entorno y configuración documentados;
- resultados reproducidos por un segundo evaluador;
- benchmarks con conjunto, versión, hardware, semillas y medidas reportadas;
- tasa de incidencias o diferencias entre réplica original e independiente;
- proporción de resultados que se pueden repetir con los recursos permitidos.

**Puerta mínima:** un método evaluable y un plan de prueba adecuado a la fase. Los trabajos conceptuales pueden pasar con plan reproducible sin afirmar resultados inexistentes.

### Filtro 3 — Responsabilidad y viabilidad
Indicadores:
- riesgos altos con control o decisión explícita;
- datos personales con base, minimización, acceso y retención;
- derechos/licencias identificados;
- responsable humano y plan de reversión para sistemas con impacto material;
- dependencias críticas, coste operativo y mantenimiento declarados;
- acceso a mecanismos de reporte, corrección y apelación.

**Puerta mínima:** no hay riesgos críticos sin tratar, falta de derechos fundamental para la divulgación ni ausencia de salvaguardas obligatorias para el contexto.

## 3. Métricas del proceso de revisión

Las métricas del comité son tan importantes como las del objeto evaluado.

| Métrica | Definición operacional | Uso |
|---|---|---|
| Tiempo de primera respuesta | Mediana de días entre recepción y respuesta administrativa | Identificar cuellos de botella |
| Tiempo de revisión | Mediana de días desde expediente completo hasta dictamen | Planificar capacidad; no incentivar revisiones superficiales |
| Tasa de expediente incompleto | Propuestas que necesitan datos mínimos / propuestas recibidas | Mejorar instrucciones y formularios |
| Concordancia interevaluador | Acuerdo exacto y kappa ponderada cuando aplique | Detectar ambigüedad de rúbricas; informar tamaño de muestra |
| Tasa de revisión mayor | Casos con revisión mayor / casos con decisión | Diagnosticar brechas recurrentes, no castigar automáticamente |
| Tasa de apelación | Apelaciones / decisiones comunicadas | Supervisar justicia procesal |
| Tasa de cambios tras apelación | Decisiones modificadas / apelaciones resueltas | Revisar consistencia y errores |
| Conflictos declarados/recusaciones | Número y proporción por ciclo | Comprobar independencia; la ausencia de declaraciones no prueba ausencia de conflicto |
| Hallazgos críticos postpublicación | Incidentes confirmados tras publicación | Evaluar eficacia de filtros |
| Tiempo de corrección | Mediana entre confirmación de incidente y mitigación | Respuesta responsable |
| Reproducibilidad independiente | Resultados replicados / resultados seleccionados para réplica | Mejorar método, no extrapolar a todos los trabajos |
| Cobertura de evidencia | Claims materiales con fuente o prueba / claims auditados | Reducir afirmaciones sin soporte |

En el piloto deben publicarse tamaño de muestra, periodo, disciplinas y datos faltantes. No reportar porcentajes con denominadores pequeños sin declararlo.

## 4. Gates críticos

No se compensan con una media alta:
- evidencia fabricada deliberadamente, plagio fundamentado o autoría engañosa;
- riesgo grave conocido sin mitigación proporcional;
- tratamiento o publicación de datos personales ilegítimo;
- infracción clara de derechos o falta de permiso fundamental;
- vulnerabilidad crítica explotable que deba impedir el lanzamiento;
- ausencia de supervisión humana para decisiones de alto impacto;
- conflicto de interés no gestionado que invalida la revisión;
- intento de manipular a los revisores o alterar evidencia.

Un rechazo o suspensión debe ser motivado, limitado a lo que la evidencia permite afirmar y apelable.

## 5. Casos de uso para sistemas de IA

### A. Asistentes de investigación
Revisar procedencia de fuentes, señalar citas no verificadas, identificar términos ambiguos, registrar versiones de modelo, comparar afirmaciones con documentación primaria y exigir revisión humana de la síntesis.

### B. Modelos generativos y chatbots
Evaluar exactitud por tarea, rechazo apropiado, alucinación, robustez a prompts adversariales, tratamiento de datos, riesgos de contenido, incertidumbre y mecanismos para escalar a una persona.

### C. Agentes con herramientas y ejecución
Revisar permisos mínimos, autorización explícita antes de acciones irreversibles, registros de operaciones, límites presupuestarios, aislamiento, kill switch, recuperación ante errores y pruebas de comportamiento fuera de objetivo.

### D. RAG, memoria y sistemas de conocimiento
Trazar cada respuesta a fuente/documento y versión; detectar documentos obsoletos y conflictos; respetar permisos de acceso, borrado y retención; evitar que una memoria repetida se trate como verdad.

### E. Modelos predictivos o de clasificación
Definir población prevista, ground truth, diseño de evaluación, sensibilidad/especificidad o métricas apropiadas, calibración, intervalos de incertidumbre, análisis por subgrupos y drift. No usar una única cifra agregada para ocultar errores en grupos.

### F. IA en educación
Validar exactitud pedagógica, accesibilidad, protección de menores/datos, transparencia sobre generación automática y límites de evaluación. No inferir capacidades del estudiante desde señales no validadas.

### G. IA territorial, cultural y comunitaria
Comprobar consentimiento comunitario cuando corresponda, contexto cultural, atribución, derechos, posibles daños de divulgación y mecanismos de corrección o retiro. No tratar conocimientos comunitarios como recursos libres por el hecho de estar documentados.

### H. Software abierto e infraestructura
Verificar build reproducible, pruebas, dependencias, SBOM cuando proceda, análisis de vulnerabilidad, licencia, documentación operativa, observabilidad, rollback y soporte de seguridad.

### I. Sistemas de impacto alto
Realizar evaluación reforzada de riesgo, validación con especialistas, revisión jurídica, supervisión humana efectiva, monitorización y mecanismo de suspensión. VETRA no autoriza por sí solo un uso clínico, financiero, laboral, legal o de infraestructura crítica.

## 6. Métricas específicas de IA

Cada sistema debe declarar tareas y conjunto de evaluación; las métricas dependen del caso. Algunos ejemplos:
- precisión y recuperación para tareas de clasificación;
- tasa de alucinación factual verificada mediante muestreo humano;
- tasa de citas que resuelven y apoyan la afirmación;
- tasa de finalización correcta y tasa de acciones no autorizadas en agentes;
- éxito de reproducción sobre un conjunto preregistrado;
- diferencias de error entre grupos cuando sea legítimo, ético y estadísticamente válido;
- latencia p50/p95, disponibilidad y coste por tarea bajo condiciones documentadas;
- tasa de incidentes, tiempo de detección, mitigación y recurrencia;
- drift de datos, concepto o modelo después de despliegue.

No fijar umbrales universales antes de definir dominio, severidad, usuarios afectados y coste de error. Los objetivos y límites se registran antes de observar resultados para reducir selección oportunista de métricas.

## 7. Metaevaluación de revisores

La metaevaluación no clasifica personas con un único número. Analiza:
- si el revisor aportó evidencia y justificación por criterio;
- concordancia o desacuerdo por dominio;
- sesgos sistemáticos, comentarios fuera de alcance y conflictos;
- diferencia entre recomendación inicial y decisión final;
- calidad, tono y accionabilidad de los comentarios;
- correcciones posteriores que revelan omisiones;
- cobertura interdisciplinaria y adecuación del panel.

Las revisiones discordantes no son necesariamente malas: pueden revelar incertidumbre real. No se exige unanimidad artificial; se exige documentar cómo se resolvió la contradicción.

## 8. Uso de resultados en el motor económico de Isabella

Los datos de VETRA pueden alimentar una **matriz de preparación para transferencia**:
- documentación pendiente;
- esfuerzo de reproducibilidad;
- riesgos y mitigaciones;
- derechos y licencia por verificar;
- costo operativo documentado;
- dependencia de infraestructura y mantenimiento;
- preparación para piloto, integración o soporte comercial.

No debe transformar una nota VETRA directamente en precio de mercado, probabilidad de patente, promesa de ROI, reparto de regalías o decisión automática de inversión. Los contratos, titularidad, contabilidad, contribuciones y derechos de miembros deben evaluarse aparte.

## 9. Calibración del piloto

Antes de usar las bandas para decisiones públicas:
1. Seleccionar muestras de distintas disciplinas y fases sin fingir un tamaño de muestra ideal.
2. Evaluar casos en paralelo y de forma ciega cuando sea viable.
3. Calcular acuerdo por dominio, distribución de puntajes y frecuencia de N/A.
4. Examinar diferencias de resultado según disciplina, nivel de recursos, idioma y tipo de artefacto.
5. Registrar falsos positivos, falsos negativos, apelaciones y hallazgos tras la publicación.
6. Ajustar rúbrica y pesos con revisión externa.
7. Publicar versión, cambios, datos agregados y limitaciones.

Los objetivos numéricos de desempeño se fijarán tras una línea base real. No se inventarán porcentajes de fiabilidad, precisión o impacto.
