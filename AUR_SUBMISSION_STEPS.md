# A+ Connect — AUR Submission Steps

This document tracks the remaining work to publish **A+ Connect** v1.1.5 to the Arch User Repository. The packaging itself is complete and verified in `aur/`. It is intentionally **not** committed to this repository yet — we will push `aur/` only after an AUR account exists.

## Status (all verified)

| Item | Status |
|---|---|
| `aur/PKGBUILD` — corrected maintainer email, upstream URL, deps, system-electron layout | done |
| `aur/.SRCINFO` — matches PKGBUILD (verified `makepkg --printsrcinfo`) | done |
| `aur/a-plus-connect.desktop` — single main category `Utility;FileTransfer;` | done |
| `aur/a-plus-connect.sh` — uses system `electron44` wrapper, `--disable-vulkan`, no `--no-sandbox` | done |
| `aur/LICENSE` — 0BSD for packaging files | done |
| `aur/README-AUR.md` — packaging rationale + submission guide | done |
| Build (`makepkg -c && makepkg -si`) | green |
| Install (`pacman -U`) | green |
| `desktop-file-validate` | no errors |
| `systemctl --user start aplus-preview-cleanup.service` | exit 0 |
| `a-plus-connect` launches (window + tray + now-playing + MPRIS) | confirmed |

## Upcoming steps

### Phase 2 — AUR account + SSH (requires registration to reopen)

AUR new-account registration is currently **paused** (wave of automated account creation). Watch:

- https://lists.archlinux.org/mailman3/lists/aur-general.lists.archlinux.org/
- https://archlinux.org/feeds/news/ (plain RSS, no bot gate)

When it reopens:

```bash
# 1. Register at https://aur.archlinux.org/register/  (mandatory email verification)
# 2. Generate a dedicated SSH key
ssh-keygen -f ~/.ssh/aur

# 3. ~/.ssh/config
cat >> ~/.ssh/config <<'EOF'
Host aur.archlinux.org
  IdentityFile ~/.ssh/aur
  User aur
EOF

# 4. Paste ~/.ssh/aur.pub into My Account → SSH Public Keys on aur.archlinux.org

# 5. Test
ssh aur@aur.archlinux.org help
```

### Phase 3 — publish

Work **outside** the upstream checkout (e.g. `~/aur/a-plus-connect`) so `aur/` is not nested:

```bash
git -c init.defaultBranch=master clone ssh://aur@aur.archlinux.org/a-plus-connect.git
cd a-plus-connect

# Copy from /home/shadow/Projects/A+ Connect/aur/:
cp .../PKGBUILD .SRCINFO a-plus-connect.desktop a-plus-connect.sh LICENSE README-AUR.md .

makepkg --printsrcinfo > .SRCINFO
git diff .SRCINFO   # must be empty

git add .
git commit -m "Initial import v1.1.5"
git push
```

The AUR only accepts pushes to `master` and requires at least `PKGBUILD` + `.SRCINFO`.

### Phase 4 — verify publication

```bash
# package page live at https://aur.archlinux.org/packages/a-plus-connect
git clone https://aur.archlinux.org/a-plus-connect.git
cd a-plus-connect && makepkg -si
```

## Blocking note

Registration is temporarily closed. Nothing to negotiate — there is no manual queue. Everything else (build, test, README) is done; we just need an account to push.
