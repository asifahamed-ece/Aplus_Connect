#!/usr/bin/env node
/**
 * The companion → MPRIS state flow across a reconnect.
 *
 * The phone publishes its current track once when the link comes up. If that
 * frame is lost, malformed, or arrives before the desktop is listening, the
 * shell shows an empty player until the next track change. Two things must
 * hold: a missing state must withdraw the player instead of throwing, and the
 * desktop must be able to ask the phone to republish on reconnect.
 *
 * node scripts/check-mpris-state-flow.js
 */
'use strict';

const assert = require('assert');
const { EventEmitter } = require('events');

const protocol = require('../services/companion-protocol');
const CompanionService = require('../services/companion');
const { MprisService } = require('../services/mpris');

console.log('mpris state flow:');

// A phone that goes away must leave an empty player, not crash the listener.
{
  const mpris = new MprisService();
  mpris.update(null);
  assert.strictEqual(mpris.state, null, 'a null state was not withdrawn');
  console.log('  ok  a null state withdraws the player');
}

// A phone that just (re)connected is asked for its current track instead of
// the shell waiting for the user to change songs.
{
  const written = [];
  const service = new EventEmitter();
  Object.setPrototypeOf(service, CompanionService.prototype);
  service.clients = new Set([
    {
      handshakeDone: true,
      destroyed: false,
      clientIp: '127.0.0.1',
      write: (buf) => {
        written.push(Buffer.from(buf));
        return true;
      },
    },
  ]);

  const sent = service.requestMediaState();
  assert.strictEqual(sent, true, 'no media-state request was sent');
  assert.strictEqual(written.length, 1, 'expected one frame');
  const frame = protocol.decode(written[0]);
  assert.strictEqual(
    frame.type,
    protocol.TYPES.MEDIA_STATE_REQUEST,
    'the request did not use the media-state-request type'
  );
  console.log('  ok  a reconnect asks the phone for the current track');
}

// A name that is queued is still ours in waiting. Treating reply 2 as failure
// left `started` false, so PropertiesChanged was never emitted and a shell that
// enumerated the player once showed the first track forever.
{
  const { canPublish } = require('../services/mpris');
  assert.strictEqual(canPublish(1), true, 'a primary owner must publish');
  assert.strictEqual(canPublish(2), true, 'a queued name must publish once it becomes ours');
  assert.strictEqual(canPublish(4), true, 'an existing owner must publish');
  assert.strictEqual(canPublish(3), false, 'a name owned by someone else must not publish');
  console.log('  ok  a queued bus name still publishes');
}

// An idle phone still has to be able to clear a stale player.
{
  const service = new EventEmitter();
  Object.setPrototypeOf(service, CompanionService.prototype);
  const states = [];
  service.on('media-state', (s) => states.push(s));

  CompanionService.routeMedia(service, {
    type: protocol.TYPES.MEDIA_STATE,
    id: 'idle-1',
    ts: Date.now(),
    payload: protocol.buildMediaState({ idle: true, title: '', playing: false }),
  });

  assert.strictEqual(states.length, 1, 'the idle frame did not arrive');
  assert.strictEqual(states[0].idle, true, 'the idle flag did not survive');
  console.log('  ok  an idle frame still clears the shell');
}
