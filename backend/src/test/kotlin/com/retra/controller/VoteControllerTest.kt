package com.retra.controller

import com.retra.dto.*
import com.retra.service.VoteService
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class VoteControllerTest {

    private lateinit var voteService: VoteService
    private lateinit var controller: VoteController

    @BeforeEach
    fun setUp() {
        voteService = mockk()
        controller = VoteController(voteService)
    }

    @Test
    fun `addVote 投票追加成功`() {
        val request = VoteRequest("card-1", "p-1")
        val response = VoteResponse("vote-1", "card-1", "p-1", "2024-01-01T00:00:00Z")
        every { voteService.addVote("test1234", request) } returns response

        val result = controller.addVote("test1234", request)

        assertEquals("card-1", result.cardId)
        assertEquals("vote-1", result.id)
        verify(exactly = 1) { voteService.addVote("test1234", request) }
    }

    @Test
    fun `removeVote 投票削除成功`() {
        val request = RemoveVoteRequest("card-1", "p-1")
        justRun { voteService.removeVote("test1234", request) }

        controller.removeVote("test1234", request)

        verify(exactly = 1) { voteService.removeVote("test1234", request) }
    }

    @Test
    fun `getRemainingVotes 残投票数取得`() {
        val response = RemainingVotesResponse("p-1", 3, 5, 2)
        every { voteService.getRemainingVotes("test1234", "p-1") } returns response

        val result = controller.getRemainingVotes("test1234", "p-1")

        assertEquals(3, result.remaining)
        assertEquals(5, result.max)
        assertEquals(2, result.used)
        verify(exactly = 1) { voteService.getRemainingVotes("test1234", "p-1") }
    }
}
