package com.retra.icebreaker.domain

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class IcebreakerQuestionsTest {

    @Test
    fun `ランダムでリストから質問を返す`() {
        val question = IcebreakerQuestions.random()
        assertThat(question).isIn(IcebreakerQuestions.ALL)
    }

    @Test
    fun `質問は20個以上`() {
        assertThat(IcebreakerQuestions.ALL).hasSizeGreaterThanOrEqualTo(20)
    }
}
