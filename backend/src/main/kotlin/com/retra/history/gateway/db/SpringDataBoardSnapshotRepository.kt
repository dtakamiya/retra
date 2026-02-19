package com.retra.history.gateway.db

import com.retra.history.domain.BoardSnapshot
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataBoardSnapshotRepository : JpaRepository<BoardSnapshot, String> {
    fun findByTeamNameOrderByClosedAtDesc(teamName: String): List<BoardSnapshot>
    fun findAllByOrderByClosedAtDesc(): List<BoardSnapshot>
    fun findAllByOrderByClosedAtDesc(pageable: Pageable): Page<BoardSnapshot>
    fun findByTeamNameOrderByClosedAtDesc(teamName: String, pageable: Pageable): Page<BoardSnapshot>
    fun countByTeamName(teamName: String): Long
}
