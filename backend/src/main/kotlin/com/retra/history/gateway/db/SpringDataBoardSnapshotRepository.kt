package com.retra.history.gateway.db

import com.retra.history.domain.BoardSnapshot
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataBoardSnapshotRepository : JpaRepository<BoardSnapshot, String> {
    fun findByTeamNameOrderByClosedAtDesc(teamName: String): List<BoardSnapshot>
    fun findAllByOrderByClosedAtDesc(): List<BoardSnapshot>
}
