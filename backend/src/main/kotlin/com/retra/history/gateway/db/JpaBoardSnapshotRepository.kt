package com.retra.history.gateway.db

import com.retra.history.domain.BoardSnapshot
import com.retra.history.domain.BoardSnapshotRepository
import org.springframework.data.domain.PageRequest
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

    override fun findAllOrderByClosedAtDesc(page: Int, size: Int): List<BoardSnapshot> =
        springDataRepo.findAllByOrderByClosedAtDesc(PageRequest.of(page, size)).content

    override fun findByTeamNameOrderByClosedAtDesc(teamName: String, page: Int, size: Int): List<BoardSnapshot> =
        springDataRepo.findByTeamNameOrderByClosedAtDesc(teamName, PageRequest.of(page, size)).content

    override fun countAll(): Long = springDataRepo.count()

    override fun countByTeamName(teamName: String): Long = springDataRepo.countByTeamName(teamName)

    override fun deleteById(id: String) = springDataRepo.deleteById(id)

    override fun existsById(id: String): Boolean = springDataRepo.existsById(id)
}
