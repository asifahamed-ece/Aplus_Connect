# Changelog

All notable changes to A+ Connect are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.5] — 2026-11-22

Both halves ship in this release: the desktop AppImage and the Android
companion APK.

### Fixed

- **"Send to phone" no longer fails with "You are not authorized to execute
  this file."** The Dolphin service menu and the "Open With" entry were written
  with the default `0644` mode, and KDE refuses to launch a `.desktop` file that
  is not executable. Both entries are now installed `0755`, and the mode is set
  explicitly so an in-place upgrade repairs an existing entry. The helper script
  that performs the send was already executable, which is why running it by hand
  worked while clicking the menu did not.
- **The phone's track appears in the desktop media panel after a reconnect.**
  A phone that connected while the desktop already had an empty MPRIS player
  never republished its current track, so Caelestia, Waybar and `playerctl`
  showed an empty player until the next song. The desktop now asks the phone for
  its current track on every pairing, and a `media-state-request` message was
  added to the companion protocol for that purpose.
- **Media publishing recovers when notification access is granted late.** The
  phone's media bridge started once when the service was created; if
  notification access was missing at that moment it never retried. It is now
  retried on connect and on request.
- **A malformed or empty media state withdraws the player instead of crashing
  the publisher.** `MprisService.update(null)` previously threw on the first
  metadata field access.
- **Artwork stays with the track that sent it.** A cover was kept until the
  phone sent a replacement, so a song with no art showed the previous song's
  cover - worse than an empty square, because it was wrong. A state that starts
  a new title with no cover in hand now drops the old one. The artist and album
  are deliberately not part of that test, because they arrive after the title on
  the same track.
- **A cover that arrives late is still picked up.** The phone gave up on a
  track's artwork after one look, so a player that attached its cover a second
  after the track started showed no art for the whole song. The search is now
  retried, while the "this track has no cover" announcement is still sent once.
- **The media panel no longer flickers.** Every one-second position tick
  re-announced the full `Metadata` dictionary, so a shell rebuilt its whole
  media panel - cover decode included - once a second, and play/pause appeared
  to jitter. Only properties whose value actually changed are announced now, so
  a tick carries nothing but `Position`.
- **MPRIS publishing recovers when the bus name is queued.** A `RequestName`
  reply of `2` (queued behind a connection that is going away) was treated as a
  failure, which left the publisher silent forever: the player showed the first
  track it ever received and never updated again.

### Changed

- Media state transitions and idle events are now logged, so a phone that
  publishes nothing is distinguishable from a shell that displays nothing.

## [1.1.4] — 2026-11-19

### Fixed

- Tolerate missed `adb` polls before dropping the device.
- Post file-transfer notifications with progress and a cancel action.
- Keep the Cancel button clickable during transfer progress.
- Await the sycoca rebuild so Dolphin finds the send menu.

### Added

- A "send to phone" entry in the KDE service menu and the Android share target.

## [1.1.2] — 2026-11-16

Desktop-only release. The Android companion app and the keyboard APK are
unchanged from 1.1.1 and are attached for convenience.

### Fixed

- **System tray icon no longer stretched on KDE.** The tray now ships
  purpose-drawn 22 px and 22 px @2x assets instead of downscaling the 1024 px
  application icon, so KDE's status-notifier drawer renders it square.
- **Only one instance runs at a time.** A second launch now focuses the existing
  window instead of opening a rival window, tray icon, `adb` poll loop, and a
  second bind attempt on the companion port.
- **The Android APK reports the real version.** The installer showed "Version
  0.1.0"; the companion app now declares `versionName 1.1.2` (`versionCode
  10102`) and shows the same string in its own settings screen.

## [1.1.1] — 2026-11-15

### Fixed

- Companion connection no longer drops and reconnects in a loop.
- Cancelling an incoming phone→PC transfer no longer crashes the main process
  with `ERR_STREAM_DESTROYED` (and no longer closes screen mirroring).
- Chunks that arrive for an already-cancelled transfer are dropped instead of
  recreating the stream.
- First-install PC→phone transfers no longer fail: temp directories are created
  with `mkdirs()` before the first write.

## [1.1.0] — 2026-11-15

### Added

- Companion path: a phone app that dials out to the desktop over TLS 1.3, with
  QR / code pairing and certificate pinning.
- Companion file browser: browse and search the phone's storage, download single
  or multiple files, and push files to the phone.
- View-only screen mirroring over the companion channel.
- Real notification text on the companion path, with updates replacing existing
  bubbles and dismissal from the desktop.
- MPRIS media control for the phone's current player.
- Bidirectional clipboard sync on the companion path via the patched keyboard.
- Interface showcase in the README and the frosted-glass design pass.

### Changed

- Two transports, one renderer: the Files view follows the selected target, and
  per-transport selection state is kept apart.

## [1.0.0]

Initial Linux desktop release: ADB device discovery, `scrcpy` mirroring, file
transfer both ways, clipboard sync, `adb logcat` notification mirroring, and a
tray-resident window.
