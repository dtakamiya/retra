package com.retra.domain.repository

import com.retra.domain.model.Card
import org.springframework.data.jpa.repository.JpaRepository

interface CardRepository : JpaRepository<Card, String> {
    fun findByBoardId(boardId: String): List<Card>
    fun findByColumnIdOrderBySortOrderAsc(columnId: String): List<Card>
    fun countByColumnId(columnId: String): Long
}
