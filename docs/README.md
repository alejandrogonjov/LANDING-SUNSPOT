# SUNspot Docs

Architecture, composable APIs, Firestore schemas, routing and coding standards
live in [`../AGENTS.md`](../AGENTS.md). This folder holds everything else.

| Path | What's in it |
|---|---|
| [`dev/commands.md`](dev/commands.md) | One-off tooling: PWA icon generation, deploying security rules, packaging the source for an IP deposit |
| [`dev/environment.md`](dev/environment.md) | Where the services live, and where the secrets *don't* live |
| [`dev/snippets.md`](dev/snippets.md) | Reference code not currently wired into the app |
| [`logic/sun-interval-logic.md`](logic/sun-interval-logic.md) | How a spot's direct-sun window is derived from the building horizon |
| [`product/roadmap.md`](product/roadmap.md) | What's shipped, what's next — check before starting a major task |
| [`product/sun-exposure-engine.md`](product/sun-exposure-engine.md) | The exposure engine pitch and spec (Spanish) |

## Conventions

- Markdown is the source of truth. Binary originals (.docx/.pdf/.pptx) and
  reference screenshots are not kept in the repository.
- **No credentials in this repository.** They belong in the team password
  manager — see [`dev/environment.md`](dev/environment.md).
