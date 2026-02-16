package com.retra.kudos.gateway.db

import com.retra.kudos.domain.Kudos
import com.retra.kudos.domain.KudosRepository
import org.springframework.stereotype.Repository

@Repository
class JpaKudosRepository(
    private val springDataRepo: SpringDataKudosRepository
) : KudosRepository {
    override fun save(kudos: Kudos): Kudos = springDataRepo.save(kudos)
    override fun findById(id: String): Kudos? = springDataRepo.findById(id).orElse(null)
    override fun findByBoardId(boardId: String): List<Kudos> = springDataRepo.findByBoardId(boardId)
    override fun delete(kudos: Kudos) = springDataRepo.delete(kudos)
}
