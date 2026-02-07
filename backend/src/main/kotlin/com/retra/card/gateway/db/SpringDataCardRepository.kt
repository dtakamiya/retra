package com.retra.card.gateway.db

import com.retra.card.domain.Card
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataCardRepository : JpaRepository<Card, String> {
    fun findByColumnIdOrderBySortOrderAsc(columnId: String): List<Card>
    fun countByColumnId(columnId: String): Long
}
