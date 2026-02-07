package com.retra.card.domain

@JvmInline
value class SortOrder(val value: Int) {

    init {
        require(value >= 0) { "Sort order must be non-negative" }
    }
}
