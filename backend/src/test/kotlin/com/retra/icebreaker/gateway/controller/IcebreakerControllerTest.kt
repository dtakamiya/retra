package com.retra.icebreaker.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.icebreaker.usecase.*
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.runs
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(IcebreakerController::class)
class IcebreakerControllerTest {

    @TestConfiguration
    class Config {
        @Bean fun getIcebreakerUseCase() = mockk<GetIcebreakerUseCase>()
        @Bean fun setIcebreakerQuestionUseCase() = mockk<SetIcebreakerQuestionUseCase>()
        @Bean fun submitAnswerUseCase() = mockk<SubmitIcebreakerAnswerUseCase>()
        @Bean fun updateAnswerUseCase() = mockk<UpdateIcebreakerAnswerUseCase>()
        @Bean fun deleteAnswerUseCase() = mockk<DeleteIcebreakerAnswerUseCase>()
    }

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var getIcebreakerUseCase: GetIcebreakerUseCase
    @Autowired lateinit var setIcebreakerQuestionUseCase: SetIcebreakerQuestionUseCase
    @Autowired lateinit var submitAnswerUseCase: SubmitIcebreakerAnswerUseCase
    @Autowired lateinit var updateAnswerUseCase: UpdateIcebreakerAnswerUseCase
    @Autowired lateinit var deleteAnswerUseCase: DeleteIcebreakerAnswerUseCase
    @Autowired lateinit var objectMapper: ObjectMapper

    @Test
    fun `GET icebreaker 200`() {
        val response = IcebreakerResponse(
            question = "テスト質問",
            answers = listOf(
                IcebreakerAnswerResponse("a1", "p1", "Alice", "回答1", "2026-01-01T00:00:00Z")
            )
        )
        every { getIcebreakerUseCase.execute("test-slug") } returns response

        mockMvc.perform(get("/api/v1/boards/test-slug/icebreaker"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.question").value("テスト質問"))
            .andExpect(jsonPath("$.answers[0].answerText").value("回答1"))
    }

    @Test
    fun `POST question 200`() {
        val response = IcebreakerResponse(question = "ランダム質問", answers = emptyList())
        every { setIcebreakerQuestionUseCase.execute("test-slug", any()) } returns response

        mockMvc.perform(
            post("/api/v1/boards/test-slug/icebreaker/question")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SetQuestionRequest("p1", "RANDOM")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.question").value("ランダム質問"))
    }

    @Test
    fun `POST answers 201`() {
        val response = IcebreakerAnswerResponse("a1", "p1", "Alice", "テスト回答", "2026-01-01T00:00:00Z")
        every { submitAnswerUseCase.execute("test-slug", any()) } returns response

        mockMvc.perform(
            post("/api/v1/boards/test-slug/icebreaker/answers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(SubmitAnswerRequest("p1", "テスト回答")))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.answerText").value("テスト回答"))
    }

    @Test
    fun `PUT answers 200`() {
        val response = IcebreakerAnswerResponse("a1", "p1", "Alice", "更新回答", "2026-01-01T00:00:00Z")
        every { updateAnswerUseCase.execute("test-slug", "a1", any()) } returns response

        mockMvc.perform(
            put("/api/v1/boards/test-slug/icebreaker/answers/a1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(UpdateAnswerRequest("p1", "更新回答")))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.answerText").value("更新回答"))
    }

    @Test
    fun `DELETE answers 204`() {
        every { deleteAnswerUseCase.execute("test-slug", "a1", "p1") } just runs

        mockMvc.perform(
            delete("/api/v1/boards/test-slug/icebreaker/answers/a1")
                .param("participantId", "p1")
        )
            .andExpect(status().isNoContent)
    }
}
