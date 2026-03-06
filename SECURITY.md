# Security Policy

## Supported Versions

The latest published version is the supported version for security fixes and maintenance updates.

Older deprecated versions may not receive fixes.

## Reporting a Vulnerability

If you discover a security issue, please do not post exploit details in a public issue first.

Instead:

1. Open a private security advisory on GitHub if available.
2. Or contact the maintainer directly through the repository contact links.
3. Include a clear description, impact, and steps to reproduce.

The goal is to triage and address legitimate reports quickly while avoiding unnecessary exposure.

## Maintainer Security Checklist

Use this checklist for day-to-day repo hygiene:

1. Never commit secrets (`.env`, `.npmrc`, private keys, access tokens).
2. Use granular npm tokens and rotate/revoke immediately if exposed.
3. Keep GitHub branch protection on `main` and require CI checks.
4. Review pull requests for accidental credential leaks.
5. Run local scans before releases when possible.

## CI Security Checks

This repository runs automated secret scanning in GitHub Actions:

- `.github/workflows/security.yml`

If a scan fails, treat it as a release blocker until resolved.
