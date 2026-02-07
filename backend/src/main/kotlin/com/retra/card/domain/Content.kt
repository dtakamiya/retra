package com.retra.card.domain

@JvmInline
value class Content(val value: String) {

    init {
        require(value.isNotBlank()) { "Content must not be blank" }
        require(value.length <= MAX_LENGTH) { "Content must not exceed $MAX_LENGTH characters" }
    }

    companion object {
        const val MAX_LENGTH = 1000
    }
}
