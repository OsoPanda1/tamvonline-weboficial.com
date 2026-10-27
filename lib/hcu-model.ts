export type HcuDomainId = 'ai' | 'economy' | 'governance' | 'climate' | 'health' | 'security';
export type HcuNodeType = 'core' | 'domain' | 'atom' | 'pod';

export type HcuAxes = {
  influence: number;
  risk: number;
  evidence: number;
  uncertainty: number;
  futurePotential: number;
};

export type HcuNode = {
  id: string;
  label: string;
  shortLabel: string;
  type: HcuNodeType;
  domainId: HcuDomainId | null;
  description: string;
  axes: HcuAxes;
  status: 'proposed' | 'under-study' | 'evidence-needed' | 'quarantined';
  evidenceStatus: string;
  riskNotes: string;
  version: string;
  sources: string[];
};

export type HcuHyperedge = {
  id: string;
  label: string;
  relation: string;
  nodeIds: string[];
  question: string;
  evidenceStatus: string;
};

export type HcuDomain = {
  id: HcuDomainId;
  label: string;
  subtitle: string;
  color: string;
  description: string;
  outcomes: string[];
};

const sourceStatus = 'Sin fuente primaria asociada en este prototipo. Requiere evidencia antes de afirmaciones factuales.';

export const hcuDomains: HcuDomain[] = [
  { id:'ai', label:'Inteligencia artificial', subtitle:'Modelos · agentes · evaluación', color:'#75d7f0', description:'Capacidades, límites, acceso, evaluación y responsabilidad de sistemas de IA.', outcomes:['Rendimiento por tarea','Trazabilidad de fuentes','Supervisión humana'] },
  { id:'economy', label:'Economía y trabajo', subtitle:'Productividad · acceso · transición', color:'#d4b77b', description:'Distribución del valor, transición laboral, infraestructura económica y capacidad productiva.', outcomes:['Distribución de beneficios','Trabajo digno','Costes sostenibles'] },
  { id:'governance', label:'Gobernanza y derechos', subtitle:'Instituciones · confianza · legitimidad', color:'#bba4f6', description:'Reglas, responsabilidades, derechos, procesos de apelación y cooperación institucional.', outcomes:['Decisiones auditables','Derechos exigibles','Independencia revisora'] },
  { id:'climate', label:'Clima y territorio', subtitle:'Energía · agua · adaptación', color:'#8bd6a8', description:'Riesgo territorial, clima, agua, energía, biodiversidad y adaptación.', outcomes:['Riesgo localizado','Adaptación demostrable','Datos con procedencia'] },
  { id:'health', label:'Salud y bienestar', subtitle:'Acceso · salud digital · comunidad', color:'#f49dba', description:'Acceso, bienestar, atención digital, equidad y protección de datos de salud.', outcomes:['Acceso equitativo','Seguridad clínica','Privacidad reforzada'] },
  { id:'security', label:'Seguridad y resiliencia', subtitle:'Ciberseguridad · información · respuesta', color:'#f4a575', description:'Ciberresiliencia, integridad informativa, continuidad y respuesta coordinada.', outcomes:['Gestión de incidentes','Recuperación verificable','Reducción de daños'] },
];

export const hcuCore: HcuNode = {
  id:'omega-core', label:'Ω Core', shortLabel:'Ω CORE', type:'core', domainId:null,
  description:'Núcleo de orquestación conceptual: organiza preguntas, relaciones, versiones, evidencia y decisiones humanas.',
  axes:{ influence:0.9, risk:0.4, evidence:0.15, uncertainty:0.85, futurePotential:0.9 },
  status:'proposed', evidenceStatus:'Arquitectura conceptual de demostración; sin validación independiente del modelo.',
  riskNotes:'Riesgo de confundir visualización con verdad o de convertir parámetros ilustrativos en pronósticos.',
  version:'HCU-DEMO-1.0', sources:[],
};

type AtomSeed = Omit<HcuNode,'type'|'shortLabel'|'status'|'evidenceStatus'|'version'|'sources'>;
const atomSeeds: AtomSeed[] = [
  {id:'ai-research',label:'Investigación asistida',domainId:'ai',description:'Herramientas de IA para búsqueda, lectura, síntesis y formulación de hipótesis con trazabilidad.',axes:{influence:.72,risk:.48,evidence:.18,uncertainty:.72,futurePotential:.86},riskNotes:'Alucinaciones, sesgo de selección, citas inexistentes y atribución incorrecta.'},
  {id:'ai-open-models',label:'Modelos abiertos',domainId:'ai',description:'Modelos, datos y herramientas con disponibilidad y condiciones de licencia explícitas.',axes:{influence:.68,risk:.57,evidence:.2,uncertainty:.68,futurePotential:.81},riskNotes:'Licencias, seguridad de pesos, documentación y costes reales de inferencia.'},
  {id:'ai-agents',label:'Agentes y evaluación',domainId:'ai',description:'Agentes con permisos limitados, pruebas de tareas, registros y supervisión humana.',axes:{influence:.82,risk:.7,evidence:.16,uncertainty:.82,futurePotential:.9},riskNotes:'Acciones no autorizadas, bucles, escalada de privilegios y evaluación insuficiente.'},

  {id:'eco-work',label:'Trabajo y productividad',domainId:'economy',description:'Cambios de tareas, competencias y productividad vinculados a adopción tecnológica.',axes:{influence:.8,risk:.63,evidence:.22,uncertainty:.73,futurePotential:.84},riskNotes:'Efectos de distribución, desplazamiento laboral y medición causal insuficiente.'},
  {id:'eco-inclusion',label:'Inclusión económica',domainId:'economy',description:'Acceso a habilidades, herramientas, financiación e infraestructuras para grupos subatendidos.',axes:{influence:.66,risk:.42,evidence:.25,uncertainty:.58,futurePotential:.76},riskNotes:'Brechas de acceso, exclusión lingüística y barreras de infraestructura.'},
  {id:'eco-value',label:'Cadenas de valor',domainId:'economy',description:'Relaciones entre producción, conocimiento, datos, propiedad intelectual y reparto del valor.',axes:{influence:.72,risk:.51,evidence:.2,uncertainty:.65,futurePotential:.79},riskNotes:'Concentración, opacidad contractual y atribución de contribuciones.'},

  {id:'gov-ai',label:'Gobernanza de IA',domainId:'governance',description:'Políticas, responsabilidades y controles para desarrollar, adquirir y desplegar IA.',axes:{influence:.78,risk:.6,evidence:.26,uncertainty:.62,futurePotential:.8},riskNotes:'Reglas incompatibles, responsabilidades difusas y declaraciones de cumplimiento sin prueba.'},
  {id:'gov-rights',label:'Confianza y derechos',domainId:'governance',description:'Transparencia, privacidad, mecanismos de reclamación y protección de derechos.',axes:{influence:.74,risk:.58,evidence:.24,uncertainty:.56,futurePotential:.77},riskNotes:'Vigilancia, exclusión, ausencia de reparación y asimetría de poder.'},
  {id:'gov-public',label:'Compras públicas',domainId:'governance',description:'Adquisición y evaluación responsable de sistemas digitales por entidades públicas.',axes:{influence:.7,risk:.62,evidence:.18,uncertainty:.66,futurePotential:.73},riskNotes:'Dependencia de proveedor, criterios poco verificables y conflictos de interés.'},

  {id:'clim-energy',label:'Energía y emisiones',domainId:'climate',description:'Energía requerida por infraestructuras digitales, datos de consumo y límites de medición.',axes:{influence:.75,risk:.55,evidence:.22,uncertainty:.61,futurePotential:.74},riskNotes:'Fronteras de medición incompletas y afirmaciones de sostenibilidad sin inventario.'},
  {id:'clim-risk',label:'Riesgo territorial',domainId:'climate',description:'Vulnerabilidad territorial, exposición, eventos extremos y capacidad de respuesta local.',axes:{influence:.79,risk:.73,evidence:.17,uncertainty:.78,futurePotential:.82},riskNotes:'Resolución espacial insuficiente y falsa precisión de escenarios.'},
  {id:'clim-water',label:'Agua y adaptación',domainId:'climate',description:'Gestión hídrica, adaptación y coordinación de datos comunitarios y públicos.',axes:{influence:.77,risk:.67,evidence:.21,uncertainty:.69,futurePotential:.8},riskNotes:'Datos incompletos, derechos comunitarios y distribución desigual del recurso.'},

  {id:'health-access',label:'Acceso sanitario',domainId:'health',description:'Barreras territoriales y organizacionales a servicios y recursos de salud.',axes:{influence:.83,risk:.76,evidence:.19,uncertainty:.78,futurePotential:.77},riskNotes:'No sustituye criterio clínico; datos de salud exigen protección reforzada.'},
  {id:'health-digital',label:'Salud digital',domainId:'health',description:'Herramientas digitales de apoyo a servicios sanitarios bajo validación y supervisión profesional.',axes:{influence:.77,risk:.84,evidence:.12,uncertainty:.86,futurePotential:.78},riskNotes:'Daño clínico, sesgo en poblaciones, seguridad y responsabilidad regulatoria.'},
  {id:'health-community',label:'Bienestar comunitario',domainId:'health',description:'Determinantes sociales, redes de apoyo y bienestar comunitario con participación responsable.',axes:{influence:.65,risk:.5,evidence:.18,uncertainty:.65,futurePotential:.75},riskNotes:'Estigmatización, inferencias sensibles y representación deficiente de comunidades.'},

  {id:'sec-cyber',label:'Ciberresiliencia',domainId:'security',description:'Capacidad para prevenir, detectar, responder y recuperarse de incidentes digitales.',axes:{influence:.81,risk:.79,evidence:.28,uncertainty:.71,futurePotential:.82},riskNotes:'Vulnerabilidades sin corregir, cadena de suministro y falsas garantías de seguridad.'},
  {id:'sec-info',label:'Integridad informativa',domainId:'security',description:'Procedencia, difusión, correcciones y resistencia a manipulación de información.',axes:{influence:.76,risk:.72,evidence:.18,uncertainty:.8,futurePotential:.75},riskNotes:'Censura excesiva, errores de clasificación y atribución errónea de origen.'},
  {id:'sec-response',label:'Respuesta a incidentes',domainId:'security',description:'Coordinación, registros, ejercicios, aprendizaje y recuperación tras incidentes.',axes:{influence:.7,risk:.6,evidence:.22,uncertainty:.59,futurePotential:.74},riskNotes:'Canales de comunicación, tiempos de escalamiento y pruebas insuficientes.'},
];

export const hcuAtoms: HcuNode[] = atomSeeds.map(seed => ({
  ...seed, type:'atom', shortLabel:seed.label.toUpperCase(),
  status:'evidence-needed', evidenceStatus:sourceStatus, version:'HCU-DEMO-1.0', sources:[],
}));

export const hcuDomainNodes: HcuNode[] = hcuDomains.map(domain => ({
  id:`domain-${domain.id}`, label:domain.label, shortLabel:domain.label.toUpperCase(), type:'domain',
  domainId:domain.id, description:domain.description,
  axes:{influence:.7,risk:.48,evidence:.18,uncertainty:.65,futurePotential:.78},
  status:'proposed', evidenceStatus:sourceStatus, riskNotes:'Síntesis temática inicial; requiere curaduría disciplinaria, fuentes identificables y revisión independiente.',
  version:'HCU-DEMO-1.0',sources:[],
}));

export const hcuInitialNodes = [hcuCore,...hcuDomainNodes,...hcuAtoms];

export const hcuHyperedges: HcuHyperedge[] = [
 {id:'edge-01',label:'IA, aprendizaje y trabajo',relation:'transformación sociotécnica',nodeIds:['ai-research','ai-agents','eco-work','eco-inclusion','gov-ai'],question:'¿Qué condiciones permiten distribuir los beneficios de la IA sin trasladar riesgos a trabajadores y comunidades?',evidenceStatus:'Hipótesis relacional pendiente de revisión bibliográfica y datos comparables.'},
 {id:'edge-02',label:'IA, energía y territorio',relation:'demanda infraestructural',nodeIds:['ai-open-models','ai-agents','clim-energy','clim-risk','clim-water'],question:'¿Cómo se relacionan el coste computacional, la disponibilidad energética y los riesgos territoriales?',evidenceStatus:'Hipótesis relacional; no contiene datos medidos de consumo o emisiones.'},
 {id:'edge-03',label:'Gobernanza, derechos y salud',relation:'impacto sobre derechos',nodeIds:['gov-rights','gov-ai','health-access','health-digital','health-community'],question:'¿Qué controles y reparación se requieren cuando un sistema digital afecta servicios de salud o bienestar?',evidenceStatus:'Marco conceptual; no constituye recomendación clínica o jurídica.'},
 {id:'edge-04',label:'Seguridad e integridad de evidencia',relation:'procedencia y continuidad',nodeIds:['sec-cyber','sec-info','sec-response','ai-agents','gov-public'],question:'¿Cómo se mantiene la procedencia y la continuidad cuando sistemas y actores intercambian información?',evidenceStatus:'Hipótesis de arquitectura; requiere pruebas y threat model.'},
 {id:'edge-05',label:'Economía, clima y resiliencia',relation:'dependencia sistémica',nodeIds:['eco-value','eco-work','clim-energy','clim-risk','sec-cyber'],question:'¿Qué dependencias económicas y digitales pueden amplificar una interrupción energética o climática?',evidenceStatus:'Escenario de investigación, no resultado predictivo.'},
 {id:'edge-06',label:'Infraestructura pública confiable',relation:'gobernanza de ciclo de vida',nodeIds:['gov-public','gov-rights','sec-cyber','sec-response','eco-inclusion'],question:'¿Cómo demostrar seguridad, derechos, continuidad y distribución de valor en compras e infraestructuras públicas?',evidenceStatus:'Pregunta de evaluación pendiente de datos, casos y revisión de especialistas.'},
 {id:'edge-07',label:'Evidencia, salud e incertidumbre',relation:'uso de alto impacto',nodeIds:['health-digital','health-access','ai-research','gov-ai','sec-info'],question:'¿Qué evidencia independiente requiere una IA antes de usarse en un contexto de salud?',evidenceStatus:'Principio de precaución del prototipo; no es una autorización clínica.'},
];

export const hcuSources = [
 {name:'OpenAlex',url:'https://openalex.org/',purpose:'Descubrimiento de metadatos de investigación, autores, trabajos e instituciones.'},
 {name:'Crossref',url:'https://www.crossref.org/',purpose:'Metadatos DOI y referencias depositadas por miembros y editoriales.'},
 {name:'DataCite',url:'https://datacite.org/',purpose:'Metadatos DOI de datasets, software y otros objetos de investigación.'},
 {name:'ROR',url:'https://ror.org/',purpose:'Identificación persistente de organizaciones vinculadas a investigación.'},
 {name:'ORCID',url:'https://orcid.org/',purpose:'Identidad persistente y conexiones autenticadas con contribuciones de investigación.'},
];
