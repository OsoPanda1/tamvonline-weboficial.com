import "server-only";

export type TamvMember = {
  id: string;
  tamv_id: string;
  auth0_sub: string;
  email: string;
  email_verified: boolean;
  display_name: string;
  bio: string | null;
  affiliation: string | null;
  country_code: string | null;
  research_areas: string[];
  profile_visibility: "private" | "public";
  public_profile_consent: boolean;
  membership_status: "pending_review" | "approved" | "suspended" | "rejected";
  terms_version: string;
  terms_accepted_at: string;
  privacy_version: string;
  privacy_accepted_at: string;
  created_at: string;
  updated_at: string;
};

export type TamvMemberIdentifier = {
  scheme: "ORCID" | "ISNI" | "GITHUB" | "WEBSITE";
  value: string;
  normalized_value: string;
  verification_status: "declared" | "pending" | "verified" | "rejected";
  verified_at: string | null;
};

export type RegisterMemberInput = {
  auth0Sub: string;
  email: string;
  emailVerified: boolean;
  adultConfirmed: boolean;
  displayName: string;
  bio: string | null;
  affiliation: string | null;
  countryCode: string | null;
  researchAreas: string[];
  profileVisibility: "private" | "public";
  publicProfileConsent: boolean;
  termsVersion: string;
  privacyVersion: string;
  identifiers: Array<{ scheme: TamvMemberIdentifier["scheme"]; value: string; normalized_value: string }>;
};

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase server configuration is missing.");
    this.name = "SupabaseConfigurationError";
  }
}

function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();
  if (!url || !key) throw new SupabaseConfigurationError();
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") throw new SupabaseConfigurationError();
  return { url: parsed.origin, key };
}

async function supabaseFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      // Opaque sb_secret_* keys are API keys, not JWTs. Send them only as apikey.
      // Legacy service_role keys are JWTs and can also be sent as Bearer credentials.
      ...(!key.startsWith("sb_secret_") ? { authorization: `Bearer ${key}` } : {}),
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(8000),
  });
  const body = await response.text();
  if (!response.ok) {
    const error = new Error(`Supabase request failed with status ${response.status}.`);
    Object.assign(error, { status: response.status, detail: body.slice(0, 1000) });
    throw error;
  }
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}

export async function registerTamvMember(input: RegisterMemberInput) {
  const rows = await supabaseFetch<Array<Pick<TamvMember, "tamv_id" | "display_name" | "membership_status" | "profile_visibility" | "created_at" | "updated_at">>>(
    "rpc/tamv_register_member",
    { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify({
      p_auth0_sub: input.auth0Sub,
      p_email: input.email,
      p_email_verified: input.emailVerified,
      p_adult_confirmed: input.adultConfirmed,
      p_display_name: input.displayName,
      p_bio: input.bio,
      p_affiliation: input.affiliation,
      p_country_code: input.countryCode,
      p_research_areas: input.researchAreas,
      p_profile_visibility: input.profileVisibility,
      p_public_profile_consent: input.publicProfileConsent,
      p_terms_version: input.termsVersion,
      p_privacy_version: input.privacyVersion,
      p_identifiers: input.identifiers,
    }) },
  );
  if (!Array.isArray(rows) || !rows[0]?.tamv_id) throw new Error("Supabase did not return the registered TAMV ID.");
  return rows[0];
}

export async function getMemberByAuth0Sub(sub: string): Promise<TamvMember | null> {
  const rows = await supabaseFetch<TamvMember[]>(
    `tamv_members?select=id,tamv_id,auth0_sub,email,email_verified,display_name,bio,affiliation,country_code,research_areas,profile_visibility,public_profile_consent,membership_status,terms_version,terms_accepted_at,privacy_version,privacy_accepted_at,created_at,updated_at&auth0_sub=eq.${encodeURIComponent(sub)}&limit=1`,
  );
  return rows[0] || null;
}

export async function getPublicMember(tamvId: string) {
  const rows = await supabaseFetch<Array<Pick<TamvMember, "tamv_id" | "display_name" | "bio" | "affiliation" | "country_code" | "research_areas" | "created_at" | "updated_at">>>(
    `tamv_members?select=tamv_id,display_name,bio,affiliation,country_code,research_areas,created_at,updated_at&tamv_id=eq.${encodeURIComponent(tamvId)}&membership_status=eq.approved&profile_visibility=eq.public&public_profile_consent=eq.true&limit=1`,
  );
  if (!rows[0]) return null;
  const identifiers = await supabaseFetch<TamvMemberIdentifier[]>(
    `tamv_member_identifiers?select=scheme,value,normalized_value,verification_status,verified_at&tamv_id=eq.${encodeURIComponent(tamvId)}&scheme=in.(ORCID,ISNI,GITHUB,WEBSITE)&limit=20`,
  );
  return { ...rows[0], identifiers: identifiers || [] };
}

export async function getIdentifiers(tamvId: string): Promise<TamvMemberIdentifier[]> {
  return supabaseFetch<TamvMemberIdentifier[]>(
    `tamv_member_identifiers?select=scheme,value,normalized_value,verification_status,verified_at&tamv_id=eq.${encodeURIComponent(tamvId)}&order=scheme.asc&limit=20`,
  );
}

export async function deleteTamvMember(auth0Sub: string): Promise<string | null> {
  const rows = await supabaseFetch<Array<{ tamv_id: string }>>("rpc/tamv_delete_member", {
    method: "POST",
    body: JSON.stringify({ p_auth0_sub: auth0Sub }),
  });
  return rows[0]?.tamv_id || null;
}


export type ResearchAuditSnapshotInput = {
  tamvId: string;
  auditType: "doi_metadata" | "research_record" | "ip_landscape";
  subject: string;
  auditHash: string;
  engineVersion: string;
  sourceStatus: unknown;
  snapshot: unknown;
};

export async function saveResearchAuditSnapshot(input: ResearchAuditSnapshotInput): Promise<{ id: string; audit_hash: string; created_at: string }> {
  if (!/^TAMV-[0-9A-F]{26}$/.test(input.tamvId)) throw new Error("Invalid member reference.");
  if (!/^[0-9a-f]{64}$/.test(input.auditHash)) throw new Error("Invalid audit hash.");
  if (JSON.stringify(input.snapshot).length > 120_000) throw new Error("Audit snapshot exceeds the configured limit.");
  const rows = await supabaseFetch<Array<{ id: string; audit_hash: string; created_at: string }>>(
    "tamv_research_audits?select=id,audit_hash,created_at",
    {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({
        created_by_tamv_id: input.tamvId,
        audit_type: input.auditType,
        subject: input.subject.slice(0, 255),
        audit_hash: input.auditHash,
        engine_version: input.engineVersion,
        source_status: input.sourceStatus,
        evidence_snapshot: input.snapshot,
      }),
    },
  );
  if (!Array.isArray(rows) || !rows[0]?.id) throw new Error("Supabase did not return the saved audit record.");
  return rows[0];
}


export type VetraProposalSubmission = {
  submittedByTamvId: string;
  submitterDisplayName: string;
  title: string;
  proposalType: "research" | "software" | "ai_system" | "dataset" | "infrastructure" | "education" | "territorial_knowledge" | "other";
  maturityStage: "concept" | "method" | "prototype" | "tested" | "deployed";
  abstract: string;
  problemStatement: string;
  contributionClaim: string;
  methodology: string;
  reproducibilityPlan: string;
  sourcesAndArtifacts: Array<{ label: string; url: string }>;
  ethicsAndHarm: string;
  privacyAndData: string;
  securityPlan: string;
  rightsAndIp: string;
  sustainabilityPlan: string;
  fundingAndConflicts: string;
  filterDeclarations: {
    filter1IntegrityAndProvenance: boolean;
    filter2MethodAndReproducibility: boolean;
    filter3ResponsibleUseAndRights: boolean;
    understandsDeclarationsAreNotApproval: boolean;
  };
};

export async function createVetraProposal(input: VetraProposalSubmission): Promise<{ id: string; proposal_code: string; status: string; created_at: string }> {
  if (!/^TAMV-[0-9A-F]{26}$/.test(input.submittedByTamvId)) throw new Error("Invalid TAMV member identifier.");
  if (!input.filterDeclarations.filter1IntegrityAndProvenance ||
      !input.filterDeclarations.filter2MethodAndReproducibility ||
      !input.filterDeclarations.filter3ResponsibleUseAndRights ||
      !input.filterDeclarations.understandsDeclarationsAreNotApproval) {
    throw new Error("VETRA gate declarations are incomplete.");
  }
  const rows = await supabaseFetch<Array<{ id: string; proposal_code: string; status: string; created_at: string }>>(
    "tamv_vetra_proposals?select=id,proposal_code,status,created_at",
    {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({
        submitted_by_tamv_id: input.submittedByTamvId,
        submitter_display_name: input.submitterDisplayName,
        title: input.title,
        proposal_type: input.proposalType,
        maturity_stage: input.maturityStage,
        abstract: input.abstract,
        problem_statement: input.problemStatement,
        contribution_claim: input.contributionClaim,
        methodology: input.methodology,
        reproducibility_plan: input.reproducibilityPlan,
        sources_and_artifacts: input.sourcesAndArtifacts,
        ethics_and_harm: input.ethicsAndHarm,
        privacy_and_data: input.privacyAndData,
        security_plan: input.securityPlan,
        rights_and_ip: input.rightsAndIp,
        sustainability_plan: input.sustainabilityPlan,
        funding_and_conflicts: input.fundingAndConflicts,
        filter_declarations: input.filterDeclarations,
        submitter_attested: true,
        status: "received",
        risk_screening_status: "pending",
      }),
    },
  );
  if (!Array.isArray(rows) || !rows[0]?.proposal_code) {
    throw new Error("Supabase did not return the VETRA proposal reference.");
  }
  return rows[0];
}


export async function getRecentVetraProposalCount(tamvId: string, hours = 24): Promise<number> {
  if (!/^TAMV-[0-9A-F]{26}$/.test(tamvId)) throw new Error("Invalid TAMV member identifier.");
  const windowHours = Math.min(168, Math.max(1, Math.floor(hours)));
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
  const rows = await supabaseFetch<Array<{ id: string }>>(
    `tamv_vetra_proposals?select=id&submitted_by_tamv_id=eq.${encodeURIComponent(tamvId)}&created_at=gte.${encodeURIComponent(since)}&limit=4`,
  );
  return Array.isArray(rows) ? rows.length : 0;
}


export type VetraProposalListItem = {
  id: string;
  proposal_code: string;
  title: string;
  proposal_type: string;
  maturity_stage: string;
  status: string;
  risk_screening_status: string;
  created_at: string;
  updated_at: string;
};

export async function getVetraProposalsForMember(tamvId: string): Promise<VetraProposalListItem[]> {
  if (!/^TAMV-[0-9A-F]{26}$/.test(tamvId)) throw new Error("Invalid TAMV member identifier.");
  const rows = await supabaseFetch<VetraProposalListItem[]>(
    `tamv_vetra_proposals?select=id,proposal_code,title,proposal_type,maturity_stage,status,risk_screening_status,created_at,updated_at&submitted_by_tamv_id=eq.${encodeURIComponent(tamvId)}&order=created_at.desc&limit=50`,
  );
  return Array.isArray(rows) ? rows : [];
}


export type VetraProposalForReview = {
  id: string;
  proposal_code: string;
  submitter_display_name: string;
  title: string;
  proposal_type: string;
  maturity_stage: string;
  abstract: string;
  problem_statement: string;
  contribution_claim: string;
  methodology: string;
  reproducibility_plan: string;
  sources_and_artifacts: Array<{label:string;url:string}>;
  ethics_and_harm: string;
  privacy_and_data: string;
  security_plan: string;
  rights_and_ip: string;
  sustainability_plan: string;
  funding_and_conflicts: string;
  filter_declarations: Record<string, unknown>;
  status: string;
  risk_screening_status: string;
  created_at: string;
};

export async function getVetraReviewQueue(limit = 30): Promise<VetraProposalForReview[]> {
  const count = Math.min(50, Math.max(1, Math.floor(limit)));
  const statuses = "received,administrative_screening,independent_review,minor_revision,major_revision";
  const rows = await supabaseFetch<VetraProposalForReview[]>(
    `tamv_vetra_proposals?select=id,proposal_code,submitter_display_name,title,proposal_type,maturity_stage,abstract,problem_statement,contribution_claim,methodology,reproducibility_plan,sources_and_artifacts,ethics_and_harm,privacy_and_data,security_plan,rights_and_ip,sustainability_plan,funding_and_conflicts,filter_declarations,status,risk_screening_status,created_at&status=in.(${statuses})&order=created_at.asc&limit=${count}`,
  );
  return Array.isArray(rows) ? rows : [];
}

export type VetraReviewSubmission = {
  proposalId: string;
  reviewerTamvId: string;
  reviewerRole: string;
  independenceDeclaration: Record<string, unknown>;
  domainScores: Record<string, unknown>;
  recommendation: "minor_revision" | "major_revision" | "accept_with_conditions" | "reject" | "recuse";
  rationale: string;
  evidenceReferences: Array<{label:string;url:string}>;
};

export async function saveVetraReview(input: VetraReviewSubmission): Promise<{ id:string; proposal_id:string; recommendation:string; created_at:string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.proposalId)) throw new Error("Invalid VETRA proposal identifier.");
  if (!/^TAMV-[0-9A-F]{26}$/.test(input.reviewerTamvId)) throw new Error("Invalid reviewer TAMV ID.");
  if (JSON.stringify(input.domainScores).length > 8000 || JSON.stringify(input.independenceDeclaration).length > 3000) throw new Error("VETRA review exceeds configured limits.");
  const rows = await supabaseFetch<Array<{id:string;proposal_id:string;recommendation:string;created_at:string}>>(
    "tamv_vetra_reviews?select=id,proposal_id,recommendation,created_at",
    {method:"POST",headers:{prefer:"return=representation"},body:JSON.stringify({
      proposal_id:input.proposalId,
      reviewer_tamv_id:input.reviewerTamvId,
      reviewer_role:input.reviewerRole.slice(0,120),
      independence_declaration:input.independenceDeclaration,
      domain_scores:input.domainScores,
      recommendation:input.recommendation,
      rationale:input.rationale.slice(0,8000),
      evidence_references:input.evidenceReferences,
      review_version:"VETRA-Ω∞-SOVEREIGN-1.0",
    })},
  );
  if (!Array.isArray(rows) || !rows[0]?.id) throw new Error("Supabase did not return the saved VETRA review.");
  return rows[0];
}

export type VetraReviewForDecision = {
  id:string;
  proposal_id:string;
  reviewer_tamv_id:string | null;
  independence_declaration:Record<string,unknown>;
  domain_scores:Record<string,unknown>;
  recommendation:string;
  created_at:string;
};

export async function getVetraReviewsForProposal(proposalId:string):Promise<VetraReviewForDecision[]> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(proposalId)) throw new Error("Invalid VETRA proposal identifier.");
  const rows=await supabaseFetch<VetraReviewForDecision[]>(
    `tamv_vetra_reviews?select=id,proposal_id,reviewer_tamv_id,independence_declaration,domain_scores,recommendation,created_at&proposal_id=eq.${encodeURIComponent(proposalId)}&order=created_at.desc&limit=50`,
  );
  return Array.isArray(rows)?rows:[];
}

export async function createVetraDecision(input:{
  proposalId:string;
  status:"minor_revision"|"major_revision"|"accepted_with_conditions"|"rejected"|"suspended"|"withdrawn";
  quorumSize:number;
  rationale:string;
  conditions:string[];
  appealWindowDays:number;
  decidedByTamvId:string;
}):Promise<{id:string;proposal_id:string;decision_status:string;created_at:string}> {
  if (!/^TAMV-[0-9A-F]{26}$/.test(input.decidedByTamvId)) throw new Error("Invalid decision-maker TAMV ID.");
  if (input.rationale.length<100||input.rationale.length>8000) throw new Error("Decision rationale length is invalid.");
  if (input.conditions.length>40||input.conditions.some(x=>!x.trim()||x.length>500)) throw new Error("Decision conditions are invalid.");
  if (input.quorumSize<3||input.quorumSize>30) throw new Error("VETRA decision requires a quorum of at least three independent reviewers.");
  const rows=await supabaseFetch<Array<{id:string;proposal_id:string;decision_status:string;created_at:string}>>(
    "tamv_vetra_decisions?select=id,proposal_id,decision_status,created_at",
    {method:"POST",headers:{prefer:"return=representation"},body:JSON.stringify({
      proposal_id:input.proposalId,
      decision_status:input.status,
      quorum_size:input.quorumSize,
      conflict_checks_complete:true,
      decision_rationale:input.rationale,
      conditions:input.conditions,
      appeal_window_days:input.appealWindowDays,
      decided_by_tamv_id:input.decidedByTamvId,
      policy_version:"CANON-VETRA-OMEGA-INFINITY-2026-V1.0",
    })},
  );
  if(!Array.isArray(rows)||!rows[0]?.id)throw new Error("Supabase did not return the VETRA decision.");
  const patch=await supabaseFetch<unknown>(
    `tamv_vetra_proposals?id=eq.${encodeURIComponent(input.proposalId)}`,
    {method:"PATCH",headers:{prefer:"return=minimal"},body:JSON.stringify({status:input.status,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()})},
  );
  void patch;
  return rows[0];
}


export async function getVetraProposalStatus(proposalId:string):Promise<{id:string;status:string}|null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(proposalId)) throw new Error("Invalid VETRA proposal identifier.");
  const rows=await supabaseFetch<Array<{id:string;status:string}>>(
    `tamv_vetra_proposals?select=id,status&id=eq.${encodeURIComponent(proposalId)}&limit=1`,
  );
  return Array.isArray(rows)?rows[0]||null:null;
}

export async function getVetraLatestReviewsForDecision(proposalId:string):Promise<VetraReviewForDecision[]> {
  const rows=await getVetraReviewsForProposal(proposalId);
  const latest=new Map<string,VetraReviewForDecision>();
  for (const row of rows) {
    if (!row.reviewer_tamv_id) continue;
    if (!latest.has(row.reviewer_tamv_id)) latest.set(row.reviewer_tamv_id,row);
  }
  return Array.from(latest.values());
}

export async function markVetraProposalInReview(proposalId:string):Promise<void> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(proposalId)) throw new Error("Invalid VETRA proposal identifier.");
  await supabaseFetch<unknown>(
    `tamv_vetra_proposals?id=eq.${encodeURIComponent(proposalId)}&status=in.(received,administrative_screening)`,
    {method:"PATCH",headers:{prefer:"return=minimal"},body:JSON.stringify({status:"independent_review",updated_at:new Date().toISOString()})},
  );
}
