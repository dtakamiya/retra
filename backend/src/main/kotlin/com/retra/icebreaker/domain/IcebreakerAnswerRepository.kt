package com.retra.icebreaker.domain

interface IcebreakerAnswerRepository {
    fun save(answer: IcebreakerAnswer): IcebreakerAnswer
    fun findById(id: String): IcebreakerAnswer?
    fun findByBoardId(boardId: String): List<IcebreakerAnswer>
    fun delete(answer: IcebreakerAnswer)
}
