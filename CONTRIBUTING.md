# Contributing to TAMV Online Network

Thank you for considering a contribution. This repository is an institutional static website; contributions should improve the accuracy, accessibility, maintainability, and traceability of its public materials.

## Contribution areas

- Correct factual and bibliographic errors using primary sources.
- Improve semantic HTML, keyboard navigation, responsive layout, and accessibility.
- Improve the static validator and the GitHub Actions quality workflow.
- Improve metadata and resource discovery without overstating institutional status.
- Fix small, reproducible bugs in JavaScript, CSS, or the catalogue.

## Before opening a change

1. Search the relevant file and open issue/PR history to avoid duplicates.
2. Keep the change narrow and explain the problem, expected result, and evidence.
3. For external records, preserve source metadata and link to the original record.
4. Do not include access tokens, API keys, passwords, private user information, or unredacted logs.
5. Do not add a license, affiliation, funder, collaborator, peer-review claim, impact statistic, or certification without evidence.

## Local validation

Requires Python 3.10 or later, no third-party packages:

```bash
python scripts/validate_site.py
```

The validator checks required files, page metadata, duplicate IDs, local links, safe handling of links opened in a new tab, JSON, and the sitemap. It does not replace browser, assistive-technology, performance, security, or production tests.

## Review expectations

- Explain any behavior change.
- Keep keyboard and reduced-motion support intact.
- Confirm all local links resolve.
- Do not introduce third-party scripts or collect user data without documenting the purpose, privacy impact, and security controls.
- A passing static check does not mean a feature has been browser-tested or deployed.

## Licensing

No license for the repository is declared by this guide. Do not assume that the contents are public domain or freely reusable. Confirm rights and license terms before contributing third-party material.
