package com.retra.history.gateway.db

import com.retra.history.domain.BoardSnapshot
import com.retra.history.domain.BoardSnapshotRepository
import org.springframework.stereotype.Repository

@Repository
class JpaBoardSnapshotRepository(
    private val springDataRepo: SpringDataBoardSnapshotRepository
) : BoardSnapshotRepository {

    override fun save(snapshot: BoardSnapshot): BoardSnapshot = springDataRepo.save(snapshot)

    override fun findById(id: String): BoardSnapshot? =
        springDataRepo.findById(id).orElse(null)

    override fun findByTeamNameOrderByClosedAtDesc(teamName: String): List<BoardSnapshot> =
        springDataRepo.findByTeamNameOrderByClosedAtDesc(teamName)

    override fun findAllOrderByClosedAtDesc(): List<BoardSnapshot> =
        springDataRepo.findAllByOrderByClosedAtDesc()
}
