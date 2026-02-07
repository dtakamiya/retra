package com.retra.domain.repository

import com.retra.domain.model.BoardColumn
import org.springframework.data.jpa.repository.JpaRepository

interface BoardColumnRepository : JpaRepository<BoardColumn, String> {
    fun findByBoardIdOrderBySortOrder(boardId: String): List<BoardColumn>
}
