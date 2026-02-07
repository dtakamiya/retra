package com.retra.board.domain

@JvmInline
value class VoteLimit(val max: Int) {

    init {
        require(max > 0) { "Vote limit must be positive" }
    }

    fun isExceeded(usedVotes: Long): Boolean = usedVotes >= max

    fun remaining(usedVotes: Long): Int = (max - usedVotes).toInt().coerceAtLeast(0)
}
