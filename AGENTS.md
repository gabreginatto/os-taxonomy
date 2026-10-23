# Work in this fork

Read [AI_HANDOFF.md](AI_HANDOFF.md) first. It indexes the learning system, Munger course research, game sources, design reviews, tests, and live sites added in this fork.

Keep the original taxonomy data, schemas, checksums, and validator unchanged unless a data change is requested. Learning-artifact work belongs in `learning-artifacts/`; follow its `AGENTS.md` and `.agents/skills/taxonomy-to-lesson/SKILL.md`.

Generated builds and installed dependencies are intentionally ignored. Restore the three published games from committed sources with `npm --prefix learning-artifacts run restore:published` after installation. This builds and verifies locally; it does not deploy. Firebase credentials belong in private environment settings, never Git. The dedicated education project is separate from commercial projects.
