# TAMV Ω∞ HCU — Method, evidence model and limits

**Version:** HCU-DEMO-1.0 · 27 October 2026  
**Status:** Interactive conceptual prototype; not a validated forecasting, quantum-computing or operational infrastructure system.

## 1. Purpose and benchmark boundary

HCU is a visual environment for exploring relationships among research, technology, economy, governance, climate/territory, health and security. It makes uncertainty, evidence status, risks and next research questions visible alongside connections. The graph is a navigation and inquiry aid, not a substitute for scientific review or causal inference.

The World Economic Forum describes Transformation Maps as an interactive way to navigate complex topics and interconnections, combining curation and machine-supported content. HCU uses that general interaction pattern as a reference and adds a local schema for multi-entity relationships, evidence states, a VETRA review path and exportable snapshots. **This document does not assert that HCU outperforms WEF**; no independent feature, quality, scale or usability benchmark has been conducted.

Reference: [World Economic Forum — What is a Transformation Map?](https://www.weforum.org/stories/technological-innovation/what-is-a-transformation-map/).

## 2. Model structure

- **Ω Core:** conceptual orchestration anchor.
- **Six domains:** AI; economy and work; governance and rights; climate and territory; health and wellbeing; security and resilience.
- **Eighteen atoms:** initial topics grouped across those domains.
- **Seven hyperedges:** multi-member relation hypotheses connecting three or more topics at once.
- **Local Cognitive Pods:** session-only entities created in the browser; they do not create a container, Kubernetes Pod, model runtime or service.

There are 25 initial nodes: one core, six domain nodes and eighteen atoms. The seven hyperedges are curated propositions/questions, not empirically validated causal relationships.

## 3. Axes and interpretation

Each node carries five bounded illustrative axes: systemic influence, potential risk, evidence coverage, uncertainty and transformation potential. The schema keeps these dimensions separate rather than reducing them to one “trust” score.

The values seeded in lib/hcu-model.ts are **demonstration parameters**, not measurements. They are not fetched from sensors, live datasets, research databases, scientific tests or a VETRA committee. The time slider is an exploration control, not a forecast.

Scenario figures in the UI are deterministic illustrative weights. They are not statistical probabilities, posterior likelihoods, expert-elicitation results or predictions for 2030/2050. The “ψ” label is a visual phase indicator, not a quantum-state measurement; HCU performs no quantum computation.

## 4. Evidence states

A public record, DOI, repository or citation establishes that a record can be inspected; it does not, by itself, validate the claims in that record. HCU should distinguish:

1. **Hypothesis / proposed relation:** a question to investigate; supporting evidence not yet evaluated.
2. **Source located:** a primary or authoritative source is linked and bibliographic metadata checked.
3. **Evidence assessed:** source methods, population, scope, quality and limitations are reviewed.
4. **Replicated or independently reviewed:** independent evidence or an identifiable review process supports the specific claim.
5. **Contested / superseded / withdrawn:** later evidence, correction or limitation changes the interpretation.

In HCU-DEMO-1.0, seeded atoms and hyperedges are at the proposed/evidence-needed stage. The federated search connector calls the existing TAMV metadata API, which queries OpenAlex, Crossref, DataCite, OpenAIRE and PubMed/NCBI. Returned metadata are candidates for inspection, not proof of truth or peer review. Provider unavailability and empty results must remain distinct.

## 5. Turning a relation into a research object

Before promoting a hyperedge beyond hypothesis, require:
- a precise relation type (association, dependency, mechanism, conflict, flow, feedback or shared context);
- source and destination entities, scope, jurisdiction and period;
- a falsifiable claim or explicit research question;
- primary sources and retrieval date;
- method, data, inclusion/exclusion criteria and limitations;
- a qualified reviewer and declared conflicts;
- VETRA's applicable gates: integrity/provenance; method/reproducibility; responsibility/rights/impact;
- a trace of additions, corrections, status changes and withdrawals.

Visual proximity alone must not determine direction or strength. A numeric edge weight needs an operational definition, data lineage and uncertainty analysis. An edge must not imply causation unless the method and evidence justify a causal claim.

## 6. Accessibility and responsible use

Provide a non-canvas route to select/search each node; ensure controls are keyboard reachable and visible, labels have sufficient contrast, reduced-motion preferences are respected, and screen-reader summaries describe the selected entity. Colour must not be the sole indicator of risk or evidence. HCU must not be used alone for health, legal, financial, employment, public-policy or infrastructure decisions.

## 7. Data, privacy and implementation limits

The initial model is shipped as static application data. Local pod/quarantine actions alter only UI state in the visitor's session; they are not production controls or persistent member records. Search queries sent to the TAMV research endpoint should be short, non-sensitive terms.

The current prototype has no persistent graph database or evidence ledger connected. HCU topics/hyperedges do not yet have primary sources attached. Scenario weights are not calibrated, backtested or validated. The canvas is an exploratory visualization, not a scientific simulator or a high-integrity digital twin. VETRA is an internal pilot framework; HCU is not independently certified by it.

Do not claim active BookPI roots, SHA3-512 evidence seals, ISCIR Ω∞ certification, quantum entanglement, Kubernetes runtime status or cryptographic certification unless real implementations and independent tests exist.

## 8. Snapshot export and local integrity verification

HCU can export a JSON snapshot containing the current illustrative nodes, hyperedges, selected entity, year control, view mode and scenario weights. The browser uses Web Crypto SHA-512 to calculate a digest over the UTF-8 bytes of `JSON.stringify(snapshot)` before adding the integrity envelope. The verifier reads a JSON file locally and recomputes the digest against the included value.

Interpretation is deliberately narrow:
- Matching digests mean only that the current snapshot payload matches the digest embedded in that file under the stated serialization rule.
- A mismatch can indicate payload changes, truncation, corruption or a different serialization rule.
- A plain digest is not a digital signature, does not bind an author's identity, does not provide a trusted timestamp, and does not prove that the claims in the graph are true.
- This is SHA-512, not SHA3-512. It does not create a BookPI root, does not call a remote evidence ledger, and does not certify a snapshot under VETRA or ISCIR.
- The snapshot is generated and verified locally; it is not persisted to a TAMV account or remote evidence system in this implementation.

## 9. Recommended milestones

1. Add a federated evidence search for each selected atom/hyperedge.
2. Store claim-source relationships with retrievable versions and hashes.
3. Define reviewed relationship types and a method for any edge-strength value.
4. Add reviewer attribution, conflicts and change history through VETRA.
5. Test accessibility, mobile performance, provider failures and browser interactions.
6. Run a controlled pilot and publish limits and corrections before making comparisons with other systems.

HCU should attract rigorous researchers by making uncertainty visible and turning connections into questions that can be tested—not by dressing unvalidated assumptions as certified knowledge.
