package com.retra.history.domain

interface BoardSnapshotRepository {
    fun save(snapshot: BoardSnapshot): BoardSnapshot
    fun findById(id: String): BoardSnapshot?
    fun findByTeamNameOrderByClosedAtDesc(teamName: String): List<BoardSnapshot>
    fun findAllOrderByClosedAtDesc(): List<BoardSnapshot>
}
