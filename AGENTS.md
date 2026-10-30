# Development rules

- This is a capability lab, not a production secure viewer. Keep that limitation visible.
- Use only synthetic documents. Never commit personal documents, recipient lists, credentials, keys, license responses or capture reports.
- Preserve the distinction between capability acceptance, successful DRM playback and manually observed capture resistance. Never infer one from another.
- Do not add clear-video, plaintext-image or thumbnail fallback to a protected path.
- Keep paid services, real email sending, production credentials and deployments out of tests.
- Use one active implementation agent in this repository. Preserve unrelated changes. Do not force-push or overwrite an existing checkout.
- Windows instructions target PowerShell 5.1. Use npm.cmd; check native command exit codes. Give one command or verification step at a time.
- Run `npm test` and `npm run check` after relevant code changes. Hardware/capture tests require physical devices and must be reported separately.
- Read docs/codex-handoff.md before continuing. Do not implement authentication UI as a substitute for proving DRM playback.
