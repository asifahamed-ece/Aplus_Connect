package com.aplusconnect.companion.service

/**
 * When to go looking for a track's artwork again.
 *
 * The player supplies a cover a moment after the track starts, and some players
 * only attach it once the notification is drawn. So "no artwork this time" is
 * not the same as "this track has no artwork" - the phone has to look again
 * later. It just must not look on every one second tick, because decoding a
 * content URI is not free.
 *
 * Pure, so the arithmetic is testable without a phone.
 */
internal object CoverPolicy {

    /**
     * Whether the artwork of [key] is worth looking for now.
     *
     * @param key the track, identified by its title, artist and album
     * @param deliveredKey the track whose cover already reached the computer
     * @param attemptKey the track the last look was for
     * @param lastAttemptAt when that look happened, or 0 for never
     * @param now the current time, in the same units as [lastAttemptAt]
     * @param retryMs how long to wait before looking at the same track again
     */
    fun shouldLook(
        key: String,
        deliveredKey: String?,
        attemptKey: String?,
        lastAttemptAt: Long,
        now: Long,
        retryMs: Long,
    ): Boolean {
        // The computer already has this track's cover; looking again would
        // only find the same bitmap.
        if (key == deliveredKey) return false

        // The wait belongs to the track that was searched for, not to the
        // phone: a song change must look at once rather than inherit the
        // previous song's cooldown.
        if (key != attemptKey) return true

        return now - lastAttemptAt >= retryMs
    }

    /**
     * Whether a look that found nothing is worth telling the computer about.
     *
     * It has to be said once, so the computer can blank a track with no cover
     * rather than keeping the previous song's. Saying it again on every retry
     * is noise, and would blank artwork the computer had already resolved.
     */
    fun shouldAnnounceMiss(key: String, announcedKey: String?): Boolean = key != announcedKey
}
