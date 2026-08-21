# DrishtiRecruit v1.4 — Seamless Frontend Release

v1.4 does not change the core hiring intelligence model. It makes that model visible and usable.

## Primary UX change

The product now uses one visual grammar across the recruiter experience:

`Requirement → Evidence → Coverage Gap → Verification → DecisionTrace → Human Decision`

The candidate application page is now a **Decision Workspace**, not a stack of generic cards. Decision readiness and the Requirement × Evidence matrix appear before secondary tools.

## Frontend improvements

- role-based sidebar instead of a wrapping horizontal mega-navigation;
- active navigation states, contextual breadcrumbs, mobile drawer, and skip navigation;
- semantic design tokens and distinct Fit / Evidence / Decision visual identity;
- Evidence Matrix showing Resume, Assessment, and Interview provenance above the fold;
- sticky Next Best Action panel driven by unresolved/conflicting criteria;
- accessible Kanban stage selector in addition to drag-and-drop;
- candidate comparison with finalist selection, criterion filters, and sorting;
- recruiter dashboard centered on candidates requiring attention;
- compact RequirementGraph table with a focused details editor;
- recruiter-friendly Assessment Studio without exposing low-level rubric implementation fields;
- candidate-facing language that distinguishes lack of evidence from lack of ability;
- no-flash dark mode and improved responsive behavior;
- admin section navigation to reduce one-page cognitive overload;
- removal of placeholder testimonial, pricing, hackathon, local-email, and development-only marketing copy.

## Frontend QA

The v1.4 source was checked for:

- TypeScript/TSX parse diagnostics;
- unresolved local imports and misplaced `use client` directives through the repository static QA;
- OpenAPI/API route consistency;
- product-facing placeholder/demo strings;
- raw `ENUM_VALUE` rendering patterns that were identified during the UI audit;
- obvious embedded live secrets.

Dependency-backed `next build` remains part of the existing v1.3 runtime-acceptance gate and must still be executed in a networked environment with project dependencies installed.
