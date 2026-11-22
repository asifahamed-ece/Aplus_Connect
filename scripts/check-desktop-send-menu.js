#!/usr/bin/env node
/**
 * The Dolphin "Send to phone" menu entries must be launchable.
 *
 * KDE's KRun refuses to start a .desktop file that is not executable and shows
 * "You are not authorized to execute this file." The helper script was written
 * 0755 but the two .desktop entries that point at it were written with the
 * default mode (0644), so both the service menu and the "Open With" entry
 * failed the moment they were clicked - while running the helper by hand
 * worked, which is what made the failure look like a permissions problem with
 * the file being sent.
 *
 * The install runs in a child process with HOME redirected to a temp dir, so
 * the real menu entries are not touched.
 *
 * node scripts/check-desktop-send-menu.js
 */
'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'aplus-menu-'));
const script = path.join(__dirname, '..', 'services', 'desktop-send.js');

execFileSync(
  process.execPath,
  [
    '-e',
    `
    const { DesktopSendService } = require(${JSON.stringify(script)});
    const service = new DesktopSendService(null, { launchCommand: 'true' });
    service.installDesktopMenu().then(() => process.exit(0));
    `,
  ],
  { env: { ...process.env, HOME: fakeHome, XDG_DATA_HOME: path.join(fakeHome, '.local/share') } }
);

const installed = [
  path.join(fakeHome, '.local/share/kio/servicemenus/aplus-connect-send.desktop'),
  path.join(fakeHome, '.local/share/kservices5/ServiceMenus/aplus-connect-send.desktop'),
  path.join(fakeHome, '.local/share/applications/aplus-connect-send.desktop'),
  path.join(fakeHome, '.local/share/aplus-connect/send-to-phone'),
];

console.log('desktop send menu:');

for (const file of installed) {
  assert.ok(fs.existsSync(file), `${file} was not installed`);
  const mode = fs.statSync(file).mode & 0o777;
  assert.strictEqual(
    mode,
    0o755,
    `${path.basename(file)} is ${mode.toString(8)}; KDE refuses to launch a non-executable entry`
  );
  console.log(`  ok  ${path.basename(path.dirname(file))}/${path.basename(file)} is 0755`);
}

fs.rmSync(fakeHome, { recursive: true, force: true });
console.log('desktop send menu: ok');
