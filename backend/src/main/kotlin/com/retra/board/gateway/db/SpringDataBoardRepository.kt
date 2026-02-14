package com.retra.board.gateway.db

import com.retra.board.domain.Board
import com.retra.board.domain.Phase
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface SpringDataBoardRepository : JpaRepository<Board, String> {
    fun findBySlug(slug: String): Optional<Board>
    fun findByTeamNameAndPhaseOrderByUpdatedAtDesc(teamName: String, phase: Phase): List<Board>
}
