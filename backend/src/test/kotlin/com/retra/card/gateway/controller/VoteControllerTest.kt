package com.retra.card.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.card.usecase.AddVoteUseCase
import com.retra.card.usecase.GetRemainingVotesUseCase
import com.retra.card.usecase.RemainingVotesResponse
import com.retra.card.usecase.RemoveVoteRequest
import com.retra.card.usecase.RemoveVoteUseCase
import com.retra.card.usecase.VoteRequest
import com.retra.card.usecase.VoteResponse
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

@WebMvcTest(VoteController::class)
class VoteControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var addVoteUseCase: AddVoteUseCase

    @MockBean
    private lateinit var removeVoteUseCase: RemoveVoteUseCase

    @MockBean
    private lateinit var getRemainingVotesUseCase: GetRemainingVotesUseCase

    @Test
    fun `POST votes 投票追加 201`() {
        val response = VoteResponse("vote-1", "card-1", "p-1", "2024-01-01T00:00:00Z")
        whenever(addVoteUseCase.execute(any(), any())).thenReturn(response)

        mockMvc.perform(
            post("/api/v1/boards/test1234/votes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(VoteRequest("card-1", "p-1")))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.cardId").value("card-1"))
    }

    @Test
    fun `DELETE votes 投票削除 204`() {
        mockMvc.perform(
            delete("/api/v1/boards/test1234/votes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(RemoveVoteRequest("card-1", "p-1")))
        )
            .andExpect(status().isNoContent)
    }

    @Test
    fun `GET votes remaining 残り投票数取得 200`() {
        val response = RemainingVotesResponse("p-1", 3, 5, 2)
        whenever(getRemainingVotesUseCase.execute("test1234", "p-1")).thenReturn(response)

        mockMvc.perform(
            get("/api/v1/boards/test1234/votes/remaining")
                .param("participantId", "p-1")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.remaining").value(3))
            .andExpect(jsonPath("$.max").value(5))
            .andExpect(jsonPath("$.used").value(2))
    }
}
