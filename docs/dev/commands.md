# Commands

Day-to-day scripts live in `package.json` and are documented in `AGENTS.md`.
This file covers the one-off tooling that isn't wired to an npm script.

## Generate PWA icons

Config-driven — see `pwa-assets.config.js`. The source `public/icon.svg` has the
skyline safe-zone baked in, and every icon is generated full-bleed (`padding: 0`)
so the gradient fills the icon edge to edge: no white float on iOS, no crop under
Android's round mask.

```bash
node node_modules/@vite-pwa/assets-generator/bin/pwa-assets-generator.mjs --override
```

## Deploy security rules

`firestore.rules` and `storage.rules` are versioned here, not just in the console.

```bash
npx -y firebase-tools deploy --only firestore:rules,storage
```

Storage isn't enabled on the project, so its deploy no-ops — the deny-all file is
a forward-proofing safety net.

## Package the source for an IP deposit

A deposit is a zip of the source plus its SHA-256, kept as dated evidence of
the work. Build the zip with `git archive`, not by zipping the folder: it
contains exactly the tracked files of one commit, so `node_modules`, `dist`,
`.env` and the git history can't leak in.

Bump `version` in `package.json`, commit, tag that commit, then archive the tag:

```bash
V=v1.0.0                      # the tag being deposited
git tag -a $V -m "SUNspot ${V#v}"
OUT=deposit && mkdir -p $OUT
git archive --format=zip -9 --prefix=sunspot/ -o $OUT/sunspot-source-$V.zip $V
(cd $OUT && sha256sum sunspot-source-$V.zip | tee sunspot-source-$V.zip.sha256)
```

- The output goes to `deposit/`, which is gitignored — nothing generated is
  committed, and `git archive` only packs tracked files, so earlier archives
  can't end up inside a new one.
- The zip must stay byte-for-byte. Unzipping and re-compressing it, or
  regenerating it from another commit, changes the hash.
- The source carries no keys: the Firebase config and the Jawg token come from
  environment variables (see `environment.md`). Before archiving, check with
  `git grep -nE 'AIza|access-token=[0-9A-Za-z]{20,}' <tag>` that none crept back.
- Authorship is stated in the deposited tree itself, in `AUTHORS.md`: Alejandro
  González Jovani and Álvaro González Castelló are the authors and rights
  holders; Kevin Jérémy Gautier is the developer.
- The archive includes `public/avatars/**` and `public/ambassadors/**`. The
  avatars are AI-generated and the ambassador photos were supplied by the
  ambassadors with their consent — declare both as such on any registration
  rather than as our own authored work.
- A deposit is identified by its tag. Tagging names the commit without changing
  it, so the zip and its hash stay valid.
- Finish every edit before tagging. A change to any tracked file afterwards —
  even a docs fix — means a new commit, and so a new tag, zip, hash and
  timestamp.
- Handing a release to the fork, in order: the `VITE_*` variables exist in
  Netlify → "Sync fork" on GitHub → check the live app → publish a GitHub
  release on the fork with the zip, `.sha256` and upgraded `.ots` attached.
  "Sync fork" does not copy tags, so the release form creates the tag there,
  targeting the deposited commit.

| Prepared | Version (tag) | Status |
|---|---|---|
| 2026-10-01 | `v1.0.0` | First deposit. Zip, `.sha256` and OpenTimestamps proof kept outside git; the hash is in the `.sha256` file (a commit can't contain the hash of its own archive). Fork synced and live the same day. Proof confirmed that evening in Bitcoin blocks 969456 and 969460, and all three files sent to Alejandro, who published them as the `v1.0.0` release on the fork that night. The assets there carry download-duplicate names (`…v1.0.0.3.zip`, `….zip.1.ots`, `….zip.1.sha256`): the bytes are the deposited ones, but `sha256sum -c` and `ots verify` only work once they are renamed back. Still open: an off-machine backup of the three files, and a signed agreement between the authors and the developer |

Notes on `v1.0.0`:

- The founders chose the free OpenTimestamps route over a paid Safe Creative
  registration (about €45).
- `main` was squashed and force-pushed on 2026-10-01: the work done after the
  11 September commit `a20979e` is the single release commit `4633e7c`, which is
  the commit the `v1.0.0` tag names.
- Re-uploading the fork's release assets under their original names was
  suggested to Alejandro, to make verification work without renaming. Whether
  that happened was not confirmed.
- A founder-facing summary of the deposit (stack, structure, hash, authors) was
  shared as an online document on the day and deleted after the hand-over, so
  its link in the WhatsApp messages to Alejandro is dead. Nothing was lost: the
  facts live in the `.sha256` file, the `v1.0.0` tag, `AUTHORS.md` and
  `README.md`.

### Timestamp the zip (OpenTimestamps)

A free alternative to a paid registration for the *date*: it anchors the zip's
SHA-256 in the Bitcoin blockchain, so anyone can verify the file existed by
then. It proves existence at a date, not authorship or ownership.

```bash
cd deposit
npx -y opentimestamps stamp sunspot-source-<tag>.zip     # writes <zip>.ots
npx -y opentimestamps upgrade sunspot-source-<tag>.zip.ots   # a few hours later
npx -y opentimestamps verify sunspot-source-<tag>.zip.ots
```

- `stamp` only sends the hash to the calendar servers — the code never leaves
  the machine. The proof is *pending* until a Bitcoin block confirms it;
  `upgrade` then makes the `.ots` self-contained. Run it once, hours later.
- The `.ots` proof is worthless without the exact zip, and neither is in git.
  Keep both, plus the `.sha256`, backed up outside this machine.
