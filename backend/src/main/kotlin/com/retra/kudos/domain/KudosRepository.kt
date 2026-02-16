package com.retra.kudos.domain

interface KudosRepository {
    fun save(kudos: Kudos): Kudos
    fun findById(id: String): Kudos?
    fun findByBoardId(boardId: String): List<Kudos>
    fun delete(kudos: Kudos)
}
