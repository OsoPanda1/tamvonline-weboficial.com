'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Copy, ExternalLink, Fingerprint, ShieldCheck } from 'lucide-react';

type Props = {
  authenticated: boolean;
  name: string;
  email: string;
  emailVerified: boolean;
  callbackError?: string;
};

const areas = [
  'IA responsable', 'Software abierto', 'Ciencia abierta', 'Memoria territorial',
  'Seguridad y privacidad', 'Datos e interoperabilidad', 'Diseño y experiencia',
  'Música y creación', 'Educación', 'Infraestructura digital', 'Patrimonio y cultura',
];

const authErrors: Record<string, string> = {
  login_cancelled: 'El proceso de inicio de sesión fue cancelado.',
  invalid_oauth_state: 'No se pudo validar el flujo seguro de autenticación. Vuelve a intentarlo.',
  token_exchange_failed: 'El proveedor de identidad no completó la autenticación.',
  missing_identity_token: 'No se recibió la prueba de identidad esperada.',
  authentication_failed: 'La autenticación no pudo verificarse. Intenta otra vez.',
};

export default function RegistrationForm({ authenticated, name, email, emailVerified, callbackError }: Props) {
  const [displayName, setDisplayName] = useState(name || '');
  const [bio, setBio] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [countryCode, setCountryCode] = useState('MX');
  const [researchAreas, setResearchAreas] = useState<string[]>([]);
  const [orcid, setOrcid] = useState('');
  const [isni, setIsni] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [publicProfileConsent, setPublicProfileConsent] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(callbackError ? authErrors[callbackError] || 'No se completó la autenticación.' : '');
  const [result, setResult] = useState<{tamvId:string;displayName:string;membershipStatus:string;profileVisibility:string;createdAt:string;updatedAt:string}|null>(null);
  const [copied, setCopied] = useState(false);

  function toggleArea(area: string) {
    setResearchAreas((current) => current.includes(area)
      ? current.filter((item) => item !== area)
      : current.length >= 8 ? current : [...current, area]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!adultConfirmed) { setError('Confirma que tienes 18 años o más para continuar.'); return; }
    if (!termsAccepted || !privacyAccepted) {
      setError('Acepta los términos y confirma que has leído el aviso de privacidad para continuar.');
      return;
    }
    if (visibility === 'public' && !publicProfileConsent) {
      setError('Para publicar tu perfil se requiere consentimiento explícito.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/members/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          displayName, bio, affiliation, countryCode, researchAreas, orcid, isni, githubUrl, websiteUrl,
          visibility, publicProfileConsent, adultConfirmed, termsAccepted, privacyAccepted,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No fue posible completar el registro.');
      setResult(payload.member);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible completar el registro.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyId() {
    if (!result?.tamvId || !navigator.clipboard) return;
    await navigator.clipboard.writeText(result.tamvId);
    setCopied(true);
  }

  if (!authenticated) {
    return <div className="form-panel">
      <h2>Identidad segura con Auth0</h2>
      <p className="subtext">TAMV no solicita una contraseña nueva dentro de este sitio. El inicio de sesión se realiza en el proveedor de identidad. Después podrás completar tu perfil y aceptar los términos correspondientes.</p>
      {error && <div className="form-alert error" role="alert">{error}</div>}
      <div className="form-alert"><strong>Privacidad desde el diseño</strong><br />El formulario de perfil no se abre hasta establecer una sesión autenticada. El registro exige correo verificado y consentimiento explícito para cualquier perfil público.</div>
      <div className="form-actions"><a className="button button-primary" href="/api/auth/login?screen_hint=signup&returnTo=%2Fregistro">Crear cuenta / continuar con Auth0 <ArrowRight aria-hidden="true" /></a><a className="button button-ghost" href="/api/auth/login?returnTo=%2Fregistro">Ya tengo cuenta</a></div>
    </div>;
  }

  if (result) {
    const statusLabel = result.membershipStatus === 'approved' ? 'Membresía aprobada' : result.membershipStatus === 'pending_review' ? 'Registro recibido · revisión pendiente' : 'Estado de membresía: ' + result.membershipStatus;
    return <div className="form-panel">
      <div className="success-heading"><CheckCircle2 aria-hidden="true" /><span>REGISTRO GUARDADO</span></div>
      <h2>Tu identidad TAMV está asignada.</h2>
      <p className="subtext">Conserva tu TAMV ID para resolver tu ficha. Este identificador es interno a TAMV y no sustituye ORCID, ISNI ni DOI.</p>
      <div className="member-summary">
        <span className="eyebrow">TAMV IDENTIFIER · PERSISTENT RECORD</span>
        <code>{result.tamvId}</code>
        <div className="member-meta"><span>{statusLabel}</span><span>{result.profileVisibility === 'public' ? 'Visibilidad pública solicitada' : 'Perfil privado'}</span></div>
        <p className="subtext">El registro no acredita un grado académico, empleo, financiación, evaluación científica ni aceptación automática en proyectos.</p>
        <div className="form-actions"><button type="button" className="button button-primary" onClick={copyId}><Copy aria-hidden="true" />{copied ? 'Copiado' : 'Copiar TAMV ID'}</button><a className="button button-ghost" href="/cuenta">Ir a mi cuenta <ArrowRight aria-hidden="true" /></a></div>
      </div>
    </div>;
  }

  return <form className="form-panel" onSubmit={submit}>
    <div className="form-panel-heading"><Fingerprint aria-hidden="true" /><div><h2>Crear tu ficha TAMV</h2><p className="subtext">Identidad declarada, información mínima y opciones de visibilidad transparentes.</p></div></div>
    <div className="identity-chip"><ShieldCheck aria-hidden="true" /><div><strong>{email || 'Sesión autenticada'}</strong><small>{emailVerified ? 'Correo verificado por Auth0' : 'Correo no verificado · se requiere verificarlo antes de registrar'}</small></div></div>
    {!emailVerified && <div className="form-alert error" role="alert">Tu identidad está autenticada, pero el correo no figura como verificado en Auth0. Verifícalo en el proveedor antes de solicitar el TAMV ID.</div>}
    <div className="form-grid">
      <div className="field field-wide"><label htmlFor="displayName">Nombre de perfil *</label><input id="displayName" name="displayName" required minLength={2} maxLength={100} value={displayName} onChange={(e)=>setDisplayName(e.target.value)} autoComplete="name" placeholder="Nombre público o firma de autoría" /><span className="help">Puedes usar una firma profesional; la ficha no sustituye una verificación legal de identidad civil.</span></div>
      <div className="field"><label htmlFor="countryCode">País / territorio (ISO alpha-2)</label><input id="countryCode" name="countryCode" maxLength={2} pattern="[A-Za-z]{2}" value={countryCode} onChange={(e)=>setCountryCode(e.target.value.toUpperCase())} placeholder="MX" /></div>
      <div className="field"><label htmlFor="affiliation">Afiliación declarada</label><input id="affiliation" name="affiliation" maxLength={180} value={affiliation} onChange={(e)=>setAffiliation(e.target.value)} placeholder="Organización o independiente" /><span className="help">Se registra como declaración de la persona, no como aval validado.</span></div>
      <div className="field field-wide"><label htmlFor="bio">Biografía breve</label><textarea id="bio" name="bio" maxLength={600} value={bio} onChange={(e)=>setBio(e.target.value)} placeholder="Áreas de trabajo, intereses y contribuciones (máximo 600 caracteres)." /><span className="help">{bio.length}/600 caracteres.</span></div>
      <div className="field field-wide"><span className="field-label">Áreas de interés (máximo ocho)</span><div className="check-grid">{areas.map((area)=><label className="check-row" key={area}><input type="checkbox" checked={researchAreas.includes(area)} onChange={()=>toggleArea(area)} disabled={!researchAreas.includes(area)&&researchAreas.length>=8} /><span>{area}</span></label>)}</div></div>
      <div className="field"><label htmlFor="orcid">ORCID (opcional)</label><input id="orcid" name="orcid" value={orcid} onChange={(e)=>setOrcid(e.target.value)} maxLength={200} placeholder="0000-0002-1825-0097" /><span className="help">Se valida el formato y checksum; la titularidad no se verifica automáticamente.</span></div>
      <div className="field"><label htmlFor="isni">ISNI (opcional)</label><input id="isni" name="isni" value={isni} onChange={(e)=>setIsni(e.target.value)} maxLength={200} placeholder="0000 0001 2281 955X" /><span className="help">Se registra como declarado hasta realizar una comprobación independiente.</span></div>
      <div className="field"><label htmlFor="githubUrl">Perfil GitHub (opcional)</label><input id="githubUrl" name="githubUrl" type="url" value={githubUrl} onChange={(e)=>setGithubUrl(e.target.value)} maxLength={500} placeholder="https://github.com/usuario" /></div>
      <div className="field"><label htmlFor="websiteUrl">Sitio personal (opcional)</label><input id="websiteUrl" name="websiteUrl" type="url" value={websiteUrl} onChange={(e)=>setWebsiteUrl(e.target.value)} maxLength={500} placeholder="https://ejemplo.org" /></div>
      <div className="field field-wide"><label htmlFor="visibility">Visibilidad del perfil</label><select id="visibility" name="visibility" value={visibility} onChange={(e)=>setVisibility(e.target.value as 'private'|'public')}><option value="private">Privado — solo yo puedo verlo</option><option value="public">Solicitar perfil público</option></select><span className="help">Los perfiles TAMV públicos solo se resuelven tras aprobación manual. Nunca se publica el correo ni el sujeto interno de Auth0.</span></div>
      {visibility === 'public' && <div className="field field-wide"><label className="check-row"><input type="checkbox" checked={publicProfileConsent} onChange={(e)=>setPublicProfileConsent(e.target.checked)} /><span>Consiento expresamente publicar mi nombre de perfil, biografía, afiliación declarada, país, áreas de interés y enlaces externos seleccionados en la página pública TAMV ID.</span></label></div>}
      <div className="field field-wide"><label className="check-row"><input type="checkbox" checked={adultConfirmed} onChange={(e)=>setAdultConfirmed(e.target.checked)} required /><span>Confirmo que tengo 18 años o más y que los datos que introduzco son míos o tengo autorización para compartirlos.</span></label></div>
      <div className="field field-wide"><label className="check-row"><input type="checkbox" checked={termsAccepted} onChange={(e)=>setTermsAccepted(e.target.checked)} required /><span>He leído y acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer">Términos de participación</a>, incluidas las reglas de atribución, contribución y conducta. Entiendo que registrarme no garantiza trabajo, remuneración, becas, financiación ni certificación.</span></label></div>
      <div className="field field-wide"><label className="check-row"><input type="checkbox" checked={privacyAccepted} onChange={(e)=>setPrivacyAccepted(e.target.checked)} required /><span>He leído el <a href="/privacidad" target="_blank" rel="noopener noreferrer">Aviso de privacidad</a> y comprendo qué datos se almacenan y con qué finalidad.</span></label></div>
    </div>
    {error && <div className="form-alert error" role="alert">{error}</div>}
    <div className="form-actions"><button className="button button-primary" type="submit" disabled={submitting || !emailVerified}>{submitting ? 'Guardando ficha…' : 'Solicitar TAMV ID'} <ArrowRight aria-hidden="true" /></button><a className="button button-ghost" href="/cuenta">Ya tengo una ficha</a></div>
    <p className="small-note">La cuenta de identidad la gestiona Auth0. El registro TAMV y los metadatos de perfil se guardan en Supabase. La base de datos asigna el identificador; el navegador no elige ni genera el TAMV ID.</p>
  </form>;
}
