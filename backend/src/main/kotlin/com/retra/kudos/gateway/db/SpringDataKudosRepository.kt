package com.retra.kudos.gateway.db

import com.retra.kudos.domain.Kudos
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataKudosRepository : JpaRepository<Kudos, String> {
    fun findByBoardId(boardId: String): List<Kudos>
}
