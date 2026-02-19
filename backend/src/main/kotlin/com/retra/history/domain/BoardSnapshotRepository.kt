package com.retra.history.domain

interface BoardSnapshotRepository {
    fun save(snapshot: BoardSnapshot): BoardSnapshot
    fun findById(id: String): BoardSnapshot?
    fun findByTeamNameOrderByClosedAtDesc(teamName: String): List<BoardSnapshot>
    fun findAllOrderByClosedAtDesc(): List<BoardSnapshot>
    fun findAllOrderByClosedAtDesc(page: Int, size: Int): List<BoardSnapshot>
    fun findByTeamNameOrderByClosedAtDesc(teamName: String, page: Int, size: Int): List<BoardSnapshot>
    fun countAll(): Long
    fun countByTeamName(teamName: String): Long
    fun deleteById(id: String)
    fun existsById(id: String): Boolean
}
