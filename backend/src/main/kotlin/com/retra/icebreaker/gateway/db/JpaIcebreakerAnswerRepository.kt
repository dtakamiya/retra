package com.retra.icebreaker.gateway.db

import com.retra.icebreaker.domain.IcebreakerAnswer
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import org.springframework.stereotype.Repository

@Repository
class JpaIcebreakerAnswerRepository(
    private val springDataRepo: SpringDataIcebreakerAnswerRepository
) : IcebreakerAnswerRepository {
    override fun save(answer: IcebreakerAnswer): IcebreakerAnswer = springDataRepo.save(answer)
    override fun findById(id: String): IcebreakerAnswer? = springDataRepo.findById(id).orElse(null)
    override fun findByBoardId(boardId: String): List<IcebreakerAnswer> = springDataRepo.findByBoardId(boardId)
    override fun delete(answer: IcebreakerAnswer) = springDataRepo.delete(answer)
}
