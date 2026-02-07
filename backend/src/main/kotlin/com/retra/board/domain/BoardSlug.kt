package com.retra.board.domain

import java.security.SecureRandom

@JvmInline
value class BoardSlug(val value: String) {

    init {
        require(value.length == SLUG_LENGTH) { "Slug must be $SLUG_LENGTH characters" }
        require(value.all { it in SLUG_CHARS }) { "Slug contains invalid characters" }
    }

    companion object {
        private const val SLUG_CHARS = "abcdefghijkmnpqrstuvwxyz23456789"
        private const val SLUG_LENGTH = 8
        private val random = SecureRandom()

        fun generate(): BoardSlug {
            val slug = (1..SLUG_LENGTH)
                .map { SLUG_CHARS[random.nextInt(SLUG_CHARS.length)] }
                .joinToString("")
            return BoardSlug(slug)
        }
    }
}
