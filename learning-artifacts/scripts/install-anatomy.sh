#!/usr/bin/env bash
set -euo pipefail
# Exact reviewed upstream; never reset or replace an existing user's checkout.
anatomy_revision=1482e8469b0a9e0d8cc18ea2740a01423d29ae80
anatomy_target="${ANATOMY_SKILL_DIR:-$HOME/.agents/skills/anatomy}"
mkdir -p "$(dirname "$anatomy_target")"
if [ ! -e "$anatomy_target" ]; then
  if [ -d "$HOME/.claude/skills/anatomy/.git" ] && [ "$(git -C "$HOME/.claude/skills/anatomy" rev-parse HEAD)" = "$anatomy_revision" ]; then
    ln -s "$HOME/.claude/skills/anatomy" "$anatomy_target"
  else
    git clone https://github.com/wheresryan22/anatomy.git "$anatomy_target"
    git -C "$anatomy_target" checkout --detach "$anatomy_revision"
  fi
fi
test "$(git -C "$anatomy_target" rev-parse HEAD)" = "$anatomy_revision" || { echo 'Existing Anatomy revision differs; preserved without changes.' >&2; exit 1; }
test -f "$anatomy_target/SKILL.md"
node --input-type=module -e 'import(process.argv[1]).then(k=>{if(!k.fitProjection||!k.solidSvg)throw Error("Anatomy API unavailable")})' "$anatomy_target/kit/iso-kit.mjs"
printf 'Anatomy installed: %s at %s\n' "$anatomy_revision" "$anatomy_target"
