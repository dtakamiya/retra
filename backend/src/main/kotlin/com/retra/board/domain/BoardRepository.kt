package com.retra.board.domain

interface BoardRepository {
    fun save(board: Board): Board
    fun findBySlug(slug: String): Board?
}
