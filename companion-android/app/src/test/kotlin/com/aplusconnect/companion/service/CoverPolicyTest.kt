package com.aplusconnect.companion.service

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Looking for a track's artwork, and how often.
 *
 * A cover that is missing at the first tick usually arrives a moment later, so
 * giving up after one look left the shell showing an empty square (or the
 * previous song's cover) for the whole track. Looking on every tick instead
 * would decode the artwork once a second for no benefit.
 */
class CoverPolicyTest {

    private fun look(
        key: String,
        deliveredKey: String? = null,
        attemptKey: String? = null,
        lastAttemptAt: Long = 0,
        now: Long = 5_000,
        retryMs: Long = 10_000,
    ) = CoverPolicy.shouldLook(key, deliveredKey, attemptKey, lastAttemptAt, now, retryMs)

    @Test
    fun `a track whose cover arrived is not looked at again`() {
        assertFalse(
            "the computer already has this cover",
            look("song", deliveredKey = "song", attemptKey = "song", lastAttemptAt = 1_000, now = 50_000),
        )
    }

    @Test
    fun `a track never looked at is looked at immediately`() {
        assertTrue(look("song"))
    }

    @Test
    fun `a miss is retried after the wait, not before`() {
        assertFalse(
            "a retry on every tick would decode the cover once a second",
            look("song", attemptKey = "song", lastAttemptAt = 10_000, now = 15_000),
        )
        assertTrue(
            "a cover that arrives late must still be picked up",
            look("song", attemptKey = "song", lastAttemptAt = 10_000, now = 20_000),
        )
    }

    @Test
    fun `a different track is not held back by the previous track's attempt`() {
        // The wait belongs to the track that was searched for, not to the phone:
        // skipping to a new song must look at once, not ten seconds later.
        assertTrue(
            look("next song", deliveredKey = "song", attemptKey = "song", lastAttemptAt = 9_900, now = 10_000),
        )
    }

    @Test
    fun `a miss is announced once per track`() {
        assertTrue(CoverPolicy.shouldAnnounceMiss("song", announcedKey = null))
        assertFalse(CoverPolicy.shouldAnnounceMiss("song", announcedKey = "song"))
        assertTrue(CoverPolicy.shouldAnnounceMiss("next song", announcedKey = "song"))
    }
}
