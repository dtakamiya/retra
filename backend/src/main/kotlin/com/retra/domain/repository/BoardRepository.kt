package com.retra.domain.repository

import com.retra.domain.model.Board
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface BoardRepository : JpaRepository<Board, String> {
    fun findBySlug(slug: String): Optional<Board>
    fun existsBySlug(slug: String): Boolean
}
