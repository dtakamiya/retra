package com.retra.board.gateway.db

import com.retra.board.domain.Board
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import org.springframework.stereotype.Repository

@Repository
class JpaBoardRepository(
    private val springDataRepo: SpringDataBoardRepository
) : BoardRepository {

    override fun save(board: Board): Board = springDataRepo.save(board)

    override fun findBySlug(slug: String): Board? =
        springDataRepo.findBySlug(slug).orElse(null)

    override fun findByTeamNameAndPhaseOrderByUpdatedAtDesc(teamName: String, phase: Phase): List<Board> =
        springDataRepo.findByTeamNameAndPhaseOrderByUpdatedAtDesc(teamName, phase)

    override fun findLatestClosedBoardByTeamName(teamName: String, excludeBoardId: String): Board? =
        springDataRepo.findFirstByTeamNameAndPhaseAndIdNotOrderByUpdatedAtDesc(teamName, Phase.CLOSED, excludeBoardId)
}
