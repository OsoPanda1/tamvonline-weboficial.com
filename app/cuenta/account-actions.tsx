'use client';
import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Fingerprint, LogOut, Trash2 } from 'lucide-react';

type Props = { orcidLinkEnabled?: boolean; orcidVerified?: boolean };

export default function AccountActions({ orcidLinkEnabled = false, orcidVerified = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  async function deleteProfile() {
    if (!confirming) { setConfirming(true); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/members/me', { method: 'DELETE', credentials: 'same-origin', cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No fue posible completar la solicitud.');
      window.location.assign('/api/auth/logout');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible completar la solicitud.');
      setBusy(false);
      setConfirming(false);
    }
  }

  return <div className="account-actions">
    <section className="orcid-account-link">
      <h3><Fingerprint aria-hidden="true" /> Identidad de investigación · ORCID</h3>
      <p>Vincula tu ORCID a través del flujo OAuth oficial. Se marcará como verificado únicamente después de que ORCID autentique el identificador; escribirlo manualmente no equivale a verificar su titularidad.</p>
      {orcidVerified ? <div className="orcid-state-success"><CheckCircle2 aria-hidden="true"/> ORCID vinculado y verificado por OAuth.</div> : orcidLinkEnabled ? <a className="button button-primary" href="/api/orcid/connect?returnTo=%2Fcuenta"><Fingerprint aria-hidden="true"/> Vincular / verificar ORCID</a> : <div className="form-alert">La vinculación ORCID está preparada, pero requiere ORCID_CLIENT_ID, ORCID_CLIENT_SECRET y la URI de callback registrada en el portal de ORCID.</div>}
    </section>
    <a className="button button-ghost" href="/api/auth/logout"><LogOut aria-hidden="true" /> Cerrar sesión</a>
    <div className="delete-account">
      <h3><AlertTriangle aria-hidden="true" /> Gestión y eliminación de la ficha</h3>
      <p>La solicitud elimina el perfil y los identificadores guardados en TAMV. El registro conserva únicamente el TAMV ID retirado para impedir su reasignación. La cuenta del proveedor Auth0 es independiente y debe gestionarse por separado.</p>
      {error && <div className="form-alert error" role="alert">{error}</div>}
      {confirming && <div className="form-alert error" role="alert">Confirma la eliminación permanente de la ficha TAMV.</div>}
      <button className="button button-danger" type="button" onClick={deleteProfile} disabled={busy}><Trash2 aria-hidden="true" />{busy ? 'Procesando…' : confirming ? 'Confirmar eliminación' : 'Solicitar eliminación de ficha'}</button>
      {confirming && <button type="button" className="button button-ghost" onClick={()=>setConfirming(false)} disabled={busy}>Cancelar</button>}
    </div>
  </div>;
}
