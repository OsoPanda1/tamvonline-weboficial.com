import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BookOpenCheck, BrainCircuit, CheckCircle2,
  ClipboardCheck, FileCheck2, Fingerprint, Gavel, Scale, ShieldCheck, Users, Workflow,
} from 'lucide-react';
import { currentServerSession } from '@/lib/auth0-native';
import { getMemberByAuth0Sub } from '@/lib/supabase-rest';
import VetraProposalForm from './propuesta-form';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'VETRA Ω∞ — evaluación de evidencia',
  description: 'Marco de evaluación de tres filtros, revisión humana, reproducibilidad, ética, seguridad y procedencia para propuestas del ecosistema TAMV Online Network.',
};

const filters = [
 {n:'01',icon:Fingerprint,title:'Integridad y procedencia',question:'¿Sabemos qué se propone, quién contribuye y de dónde proviene la evidencia?',items:['Autoría y aportaciones identificadas','Fuentes primarias y estado del arte','Financiación y conflictos declarados','Procedencia, licencias y permisos','Afirmaciones y limitaciones diferenciadas'],block:'Bloquea fraude fundamentado, autoría falsificada, referencias fabricadas o falta material de derechos.'},
 {n:'02',icon:BookOpenCheck,title:'Rigor, método y reproducibilidad',question:'¿Se puede comprender, evaluar y —cuando corresponda— reproducir el trabajo?',items:['Problema, hipótesis o requisitos definidos','Método, arquitectura o procedimiento','Criterios de éxito y condiciones de prueba','Código, datos o instrucciones cuando sea posible','Resultados, fallos conocidos y plan de réplica'],block:'Una idea puede entrar como concepto; no puede venderse como resultado probado si todavía no se ha probado.'},
 {n:'03',icon:ShieldCheck,title:'Responsabilidad, derechos e impacto',question:'¿Los riesgos están identificados, mitigados y bajo responsabilidad humana?',items:['Seguridad y privacidad por diseño','Riesgo ético, daño y sesgos plausibles','Derechos, licencias y permisos de terceros','Impacto, costes y sostenibilidad','Supervisión, incidentes, apelación y reversión'],block:'Un riesgo crítico sin mitigación, una divulgación ilegítima o ausencia de derechos puede detener el proceso.'},
];

const domains = [
 ['I','Validez científica','Pregunta, originalidad declarada, fuentes, estado del arte y límites.'],
 ['II','Validación técnica','Arquitectura, calidad de software, interoperabilidad, pruebas y mantenimiento.'],
 ['III','Seguridad','Amenazas, permisos, criptografía, secretos, dependencias y respuesta a incidentes.'],
 ['IV','Privacidad','Minimización, consentimiento, acceso, retención, borrado y transferencias.'],
 ['V','Ética','Daño, discriminación, equidad, explicación y supervisión humana.'],
 ['VI','Reproducibilidad','Datos, código, versiones, entorno, protocolos y réplica independiente.'],
 ['VII','Gobernanza','Responsables, cambios, auditoría, apelación y retirada.'],
 ['VIII','Impacto social','Utilidad, beneficiarios, comunidades afectadas y consecuencias negativas.'],
 ['IX','Viabilidad','Costes, operación, financiación, mantenimiento y dependencias.'],
 ['X','Integridad','Plagio, fabricación, falsificación, autoría impropia y conflictos.'],
 ['XI','Fiabilidad cognitiva','Errores, alucinaciones, robustez, consistencia y deriva de IA.'],
 ['XII','Metaevaluación','Competencia de revisores, desacuerdos, sesgos y omisiones del proceso.'],
 ['XIII','Evidencia y procedencia','Fuentes, hashes, versiones, permisos y cadena de custodia.'],
 ['XIV','Consecuencias futuras','Mal uso, concentración, dependencia, efectos de segundo orden y reversibilidad.'],
];

const governance = [
 ['Independencia','Revisores declaran conflictos; nadie dicta en solitario sobre su propio trabajo. Se aplica recusación cuando exista conflicto material.'],
 ['Competencia','La asignación responde al tema, método y nivel de riesgo. Una IA puede ayudar a organizar evidencia, pero no sustituye experiencia del dominio.'],
 ['Trazabilidad','Cada dictamen identifica versión evaluada, fuentes, argumentos, hallazgos, limitaciones, responsables y próxima acción.'],
 ['Apelación','El solicitante puede impugnar errores factuales o procesales; la apelación la revisan personas distintas cuando sea viable.'],
 ['Gobierno humano','La decisión final es humana, motivada y registrada. Ninguna puntuación media supera una puerta crítica.'],
 ['Revisión continua','Cambios materiales, incidentes, nuevas evidencias o violación de derechos pueden activar reevaluación, suspensión o retirada.'],
];

export default async function VetraPage() {
 const session = await currentServerSession();
 let member: Awaited<ReturnType<typeof getMemberByAuth0Sub>> = null;
 if(session) { try { member = await getMemberByAuth0Sub(session.sub); } catch { member = null; } }
 const submissionConfiguration = process.env.TAMV_VETRA_SUBMISSIONS_ENABLED === 'true'
   && Boolean(process.env.TAMV_DATA_CONTROLLER_NAME?.trim())
   && Boolean(process.env.TAMV_DATA_CONTROLLER_ADDRESS?.trim())
   && Boolean(process.env.TAMV_PRIVACY_CONTACT_EMAIL?.trim())
   && process.env.TAMV_VETRA_RETENTION_POLICY_APPROVED === "true"
   && Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim())
   && Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)?.trim());
 return <main className="site-shell">
   <div className="utility-strip"><span>VETRA Ω∞ · META-EVALUACIÓN</span><span>TAMV ONLINE NETWORK · PROTOCOLO PILOTO</span><span>EVIDENCIA / RIGOR / RESPONSABILIDAD</span></div>
   <header className="site-header"><Link className="brand-lockup" href="/" aria-label="TAMV Online Network"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><nav className="site-nav" aria-label="Navegación principal"><Link href="/">Institución</Link><Link href="/investigacion">Investigación</Link><Link href="/auditoria">Auditoría e IP</Link><Link href="/roadmap">Roadmap</Link><Link href="/hcu">HCU Ω∞</Link><Link href="/vetra/mis-propuestas">Mis propuestas</Link><Link href="/membresia">Membresía</Link></nav><div className="header-actions"><Link className="button button-small button-primary" href="/registro">TAMV ID <ArrowUpRight aria-hidden="true"/></Link></div></header>
   <section className="vetra-hero"><div className="section-wrap vetra-hero-grid"><div><p className="eyebrow"><span className="eyebrow-line"/>CANON-VETRA-OMEGA-INFINITY-2026-V1.0</p><h1>VETRA <em>Ω∞</em></h1><p className="vetra-fullname">Verificación y Evaluación de Ciencia, Tecnología y Rendimiento Avanzado</p><p className="vetra-hero-lead">Un marco de evaluación por etapas para que la investigación y el desarrollo tecnológico se presenten con evidencia, método, límites y responsabilidad.</p><p className="vetra-hero-copy">VETRA ayuda a filtrar ruido, no a excluir ideas emergentes. Una propuesta conceptual puede entrar como concepto; una afirmación de resultado necesita pruebas proporcionadas a lo que promete.</p><div className="hero-buttons"><a className="button button-primary" href="#presentar">Preparar propuesta <ArrowRight aria-hidden="true"/></a><a className="button button-ghost" href="https://github.com/OsoPanda1/tamvonline-weboficial.com/blob/main/docs/CANON-VETRA-OMEGA-INFINITY-2026-V1.0.md" target="_blank" rel="noopener noreferrer">Leer canon completo <ArrowUpRight aria-hidden="true"/></a></div><div className="vetra-hero-chips"><span><ShieldCheck aria-hidden="true"/> Tres filtros</span><span><Users aria-hidden="true"/> Revisión humana</span><span><FileCheck2 aria-hidden="true"/> Decisiones trazables</span></div></div><aside className="vetra-status-card"><span className="eyebrow">ESTADO DEL PROTOCOLO</span><strong>Diseño piloto</strong><p>Marco documentado para evaluación interna. No se presenta como organismo acreditado ni como certificación externa.</p><div className="vetra-status-line"><span>Estado de recepción</span><b className={submissionConfiguration?'vetra-status-open':'vetra-status-closed'}>{submissionConfiguration?'RECEPCIÓN HABILITADA':'PREPARACIÓN / CERRADA'}</b></div><div className="vetra-status-line"><span>Decisión</span><b>Humana</b></div><div className="vetra-status-line"><span>Autoevaluación</span><b>No es aprobación</b></div></aside></div></section>

   <section className="section-wrap vetra-principles"><div className="section-heading-row"><div><p className="eyebrow">01 — PRINCIPIO FUNDACIONAL</p><h2>La confianza debe <em>resistir preguntas.</em></h2></div><p>La existencia de una publicación, DOI, repositorio, código o respuesta de IA no prueba por sí sola la validez del contenido. VETRA separa la evidencia del razonamiento, la decisión de la autoridad y el estado declarado del resultado probado.</p></div><div className="vetra-axiom"><span>AXIOMA VETRA</span><p>CONOCIMIENTO ≠ MEMORIA ≠ RAZONAMIENTO ≠ DECISIÓN ≠ AUTORIDAD ≠ EJECUCIÓN ≠ EVIDENCIA ≠ IMPACTO</p><small>Si una dimensión crítica falla, la puntuación global no puede compensarla.</small></div></section>

   <section className="vetra-filters-section"><div className="section-wrap"><div className="section-heading-row"><div><p className="eyebrow">02 — TRES FILTROS OBLIGATORIOS</p><h2>Rigor sin arbitrariedad. <em>Exigencia proporcional.</em></h2></div><p>Los filtros se aplican a toda propuesta antes de una eventual revisión independiente. Cada puerta deja evidencias, motivos de bloqueo y acciones correctivas.</p></div><div className="vetra-filter-grid">{filters.map(({n,icon:Icon,title,question,items,block})=><article className="vetra-filter-card" key={n}><div className="vetra-filter-top"><span>{n}</span><Icon aria-hidden="true"/></div><h3>{title}</h3><p className="vetra-filter-question">{question}</p><ul>{items.map(item=><li key={item}><CheckCircle2 aria-hidden="true"/>{item}</li>)}</ul><div className="vetra-filter-block"><strong>Puerta de control</strong><p>{block}</p></div></article>)}</div></div></section>

   <section className="section-wrap vetra-domains"><div className="section-heading-row"><div><p className="eyebrow">03 — CATORCE DOMINIOS</p><h2>Una mirada integral, <em>no una nota aislada.</em></h2></div><p>Los dominios se evalúan según el objeto, el riesgo y la fase del proyecto. Los puntos N/A necesitan justificación del revisor; no sirven para ocultar riesgos.</p></div><div className="vetra-domain-grid">{domains.map(([n,title,description])=><article key={n}><span>{n}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div><div className="vetra-rubric"><div><p className="eyebrow">RÚBRICA PILOTO · 0–4</p><h3>Qué significa cada nivel</h3><p>Los pesos y bandas se proponen como punto de partida y deben calibrarse durante un piloto. No son una norma universal ni una medida absoluta de verdad.</p></div><div className="vetra-rubric-levels">{[['0','Crítico / no sustentado'],['1','Insuficiente'],['2','Parcial'],['3','Adecuado al alcance'],['4','Robusto y triangulado']].map(([n,label])=><div key={n}><b>{n}</b><span>{label}</span></div>)}</div></div></section>

   <section className="vetra-governance-section"><div className="section-wrap"><div className="section-heading-row"><div><p className="eyebrow">04 — GOBERNANZA</p><h2>Un dictamen debe poder <em>explicarse y apelarse.</em></h2></div><p>VETRA no crea autoridad legal por sí mismo. La legitimidad del proceso depende de revisores competentes, independencia, criterios públicos y decisiones humanas documentadas.</p></div><div className="vetra-governance-grid">{governance.map(([title,text])=><article key={title}><BadgeCheck aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>)}</div><div className="vetra-governance-note"><Scale aria-hidden="true"/><p><strong>Consejo de evaluación propuesto.</strong> La meta futura de un consejo ampliado de siete revisores humanos y catorce agentes de apoyo es una arquitectura objetivo, no una afirmación de que ese comité ya esté constituido. Los agentes pueden proponer pruebas y resumir evidencia; la decisión final corresponde a personas responsables.</p></div><div className="vetra-governance-links"><Link className="button button-ghost" href="/roadmap">Ver roadmap institucional <ArrowRight aria-hidden="true"/></Link><a className="button button-ghost" href="https://doi.org/10.24318/cope.2019.1.9" target="_blank" rel="noopener noreferrer">Ética de revisión COPE <ArrowUpRight aria-hidden="true"/></a><a className="button button-ghost" href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener noreferrer">NIST AI RMF <ArrowUpRight aria-hidden="true"/></a></div></div></section>

   <section className="section-wrap vetra-proposal-section" id="presentar"><div className="section-heading-row"><div><p className="eyebrow">05 — PRESENTAR UNA PROPUESTA</p><h2>Que hable el expediente, <em>no la grandilocuencia.</em></h2></div><p>El formulario solicita el contenido mínimo para revisión. No hay publicación automática y no se promete aceptación, financiación, ingreso ni certificación.</p></div><div className="vetra-track-link"><FileCheck2 aria-hidden="true"/><span>¿Ya enviaste una propuesta? <Link href="/vetra/mis-propuestas">Consulta el estado de tus expedientes</Link>.</span></div><VetraProposalForm authenticated={Boolean(session)} memberRegistered={Boolean(member)} emailVerified={Boolean(session?.emailVerified && member?.email_verified)} submissionsEnabled={submissionConfiguration}/></section>

   <section className="section-wrap vetra-resources"><p className="eyebrow">DOCUMENTACIÓN VERSIONADA</p><div className="vetra-resource-grid"><a href="https://github.com/OsoPanda1/tamvonline-weboficial.com/blob/main/docs/vetra-executive-brief.md" target="_blank" rel="noopener noreferrer"><ClipboardCheck aria-hidden="true"/><strong>Resumen ejecutivo</strong><span>Decisiones y riesgos para directivos <ArrowUpRight aria-hidden="true"/></span></a><a href="https://github.com/OsoPanda1/tamvonline-weboficial.com/blob/main/docs/vetra-metrics-and-use-cases.md" target="_blank" rel="noopener noreferrer"><BrainCircuit aria-hidden="true"/><strong>Métricas y casos de IA</strong><span>Rúbrica, gates, métricas y escenarios <ArrowUpRight aria-hidden="true"/></span></a><a href="https://github.com/OsoPanda1/tamvonline-weboficial.com/blob/main/docs/vetra-foundations-en.md" target="_blank" rel="noopener noreferrer"><Workflow aria-hidden="true"/><strong>Technical English</strong><span>Fundamentos filosóficos en inglés técnico <ArrowUpRight aria-hidden="true"/></span></a><a href="https://github.com/OsoPanda1/tamvonline-weboficial.com/blob/main/docs/roadmap-institutional-2026-2028.md" target="_blank" rel="noopener noreferrer"><Gavel aria-hidden="true"/><strong>Roadmap 2026–2028</strong><span>Metas, dependencias y puertas de salida <ArrowUpRight aria-hidden="true"/></span></a></div></section>
   <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>VETRA Ω∞ · Protocolo interno de evaluación propuesto</span><Link href="/politica-editorial">Política editorial</Link><Link href="/privacidad">Privacidad</Link><Link href="/">TAMV Online Network</Link></div></div></footer>
 </main>;
}
