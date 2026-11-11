# Updating

```bash
git pull origin main
npm install                 # pick up lockfile changes
npm run build               # confirm 0 type errors
# restart your process manager / `next start`
```

## Notes

- Read `docs/DEPENDENCY_NOTES.md` before force-bumping majors (kepler / maplibre / zod / shadcn).
- After pulling security commits, re-check `.env.local` against `.env.example` for new empty var **names** (never commit values).
- `data/` and `local-data/` are local-only; they are not migrated by git. Back them up separately if you care about engagements / CCTV layouts / IDS history.
- Gitleaks should stay clean: `gitleaks detect --source .` (config: `.gitleaks.toml`).

If `npm run build` fails after a pull, check the OffSec / security changelog in `docs/MODULE_STATUS.md` and open an issue at https://github.com/s3v3nlabs/command-hub/issues.
