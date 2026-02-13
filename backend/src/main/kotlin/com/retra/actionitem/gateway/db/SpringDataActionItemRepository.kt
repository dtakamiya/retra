package com.retra.actionitem.gateway.db

import com.retra.actionitem.domain.ActionItem
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataActionItemRepository : JpaRepository<ActionItem, String> {
    fun findByBoardIdOrderBySortOrder(boardId: String): List<ActionItem>
    fun countByBoardId(boardId: String): Int
}
