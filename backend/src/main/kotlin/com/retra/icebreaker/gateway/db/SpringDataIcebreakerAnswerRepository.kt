package com.retra.icebreaker.gateway.db

import com.retra.icebreaker.domain.IcebreakerAnswer
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataIcebreakerAnswerRepository : JpaRepository<IcebreakerAnswer, String> {
    fun findByBoardId(boardId: String): List<IcebreakerAnswer>
}
