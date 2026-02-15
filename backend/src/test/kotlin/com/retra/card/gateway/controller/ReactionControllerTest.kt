package com.retra.card.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.card.usecase.AddReactionRequest
import com.retra.card.usecase.AddReactionUseCase
import com.retra.card.usecase.ReactionResponse
import com.retra.card.usecase.RemoveReactionRequest
import com.retra.card.usecase.RemoveReactionUseCase
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(ReactionController::class)
class ReactionControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var addReactionUseCase: AddReactionUseCase

    @MockBean
    private lateinit var removeReactionUseCase: RemoveReactionUseCase

    @Test
    fun `POST reactions リアクション追加 201`() {
        val response = ReactionResponse("r-1", "card-1", "p-1", "👍", "2024-01-01T00:00:00Z")
        whenever(addReactionUseCase.execute(any(), any())).thenReturn(response)

        mockMvc.perform(
            post("/api/v1/boards/test1234/reactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(AddReactionRequest("card-1", "p-1", "👍")))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.cardId").value("card-1"))
            .andExpect(jsonPath("$.emoji").value("👍"))
            .andExpect(jsonPath("$.participantId").value("p-1"))
    }

    @Test
    fun `DELETE reactions リアクション削除 204`() {
        mockMvc.perform(
            delete("/api/v1/boards/test1234/reactions")
                .param("cardId", "card-1")
                .param("participantId", "p-1")
                .param("emoji", "👍")
        )
            .andExpect(status().isNoContent)
    }
}
