package com.retra.icebreaker.usecase

import com.retra.board.domain.*
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class SubmitIcebreakerAnswerUseCaseTest {
    private val boardRepository = mockk<BoardRepository>()
    private val answerRepository = mockk<IcebreakerAnswerRepository>()
    private val eventPublisher = mockk<SpringDomainEventPublisher>(relaxed = true)
    private val useCase = SubmitIcebreakerAnswerUseCase(boardRepository, answerRepository, eventPublisher)

    @Test
    fun `ICEBREAKフェーズで回答を投稿`() {
        val board = Board(id = "b1", slug = "test", phase = Phase.ICEBREAK, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        every { boardRepository.findBySlug("test") } returns board
        every { answerRepository.save(any()) } answers { firstArg() }

        val result = useCase.execute("test", SubmitAnswerRequest(participantId = "p1", answerText = "テスト回答"))

        assertThat(result.answerText).isEqualTo("テスト回答")
        assertThat(result.participantNickname).isEqualTo("Alice")
        verify { eventPublisher.publish(any()) }
    }

    @Test
    fun `ICEBREAKフェーズ以外では回答投稿不可`() {
        val board = Board(id = "b1", slug = "test", phase = Phase.WRITING, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        every { boardRepository.findBySlug("test") } returns board

        assertThrows<BadRequestException> {
            useCase.execute("test", SubmitAnswerRequest(participantId = "p1", answerText = "テスト回答"))
        }
    }
}
