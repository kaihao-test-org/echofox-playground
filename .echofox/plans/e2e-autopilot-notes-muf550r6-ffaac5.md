<!-- Echofox plan ffaac52e-7e51-445b-b4df-67160e9c237e · revision 1 · sha256 1102f20fbd09c48e. Tick a step's box once its check passes. -->

# e2e autopilot notes muf550r6

## Goal

Two small notes files, one per step.

## Out of scope

Everything else.

## Steps

- [x] s1. Create notes/alpha.md containing the word alpha  (check: `grep -q alpha notes/alpha.md`)
  Create the file notes/alpha.md. It contains the word alpha on one line.
  Files: `notes/alpha.md`
- [x] s2. Create notes/beta.md containing the word beta  (check: `grep -q beta notes/beta.md`)
  Create the file notes/beta.md. It contains the word beta on one line.
  Files: `notes/beta.md`

## How to work

- Follow the steps in order, one step at a time.
- After each step, run its check. When the check passes, tick the step's box in this file (`- [x]`).
- You are the only writer: make every edit yourself, without subagents.
- Keep going until every step is done, then summarize what you did.
- If a step cannot be done as written, stop and say why instead of guessing.
