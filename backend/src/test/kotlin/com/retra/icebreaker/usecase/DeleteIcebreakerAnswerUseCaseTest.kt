package com.retra.icebreaker.usecase

import com.retra.board.domain.*
import com.retra.icebreaker.domain.IcebreakerAnswer
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class DeleteIcebreakerAnswerUseCaseTest {
    private val boardRepository = mockk<BoardRepository>()
    private val answerRepository = mockk<IcebreakerAnswerRepository>(relaxed = true)
    private val eventPublisher = mockk<SpringDomainEventPublisher>(relaxed = true)
    private val useCase = DeleteIcebreakerAnswerUseCase(boardRepository, answerRepository, eventPublisher)

    @Test
    fun `本人の回答を削除`() {
        val board = Board(id = "b1", slug = "test", phase = Phase.ICEBREAK, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        val answer = IcebreakerAnswer(id = "a1", boardId = "b1", participantId = "p1", answerText = "回答", createdAt = "2026-01-01T00:00:00Z")
        every { boardRepository.findBySlug("test") } returns board
        every { answerRepository.findById("a1") } returns answer

        useCase.execute("test", "a1", "p1")

        verify { answerRepository.delete(answer) }
        verify { eventPublisher.publish(any()) }
    }

    @Test
    fun `ICEBREAKフェーズ以外では回答を削除できない`() {
        val board = Board(id = "b1", slug = "test", phase = Phase.WRITING, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        every { boardRepository.findBySlug("test") } returns board

        assertThrows<BadRequestException> {
            useCase.execute("test", "a1", "p1")
        }
    }

    @Test
    fun `他人の回答は削除不可`() {
        val board = Board(id = "b1", slug = "test", phase = Phase.ICEBREAK, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        board.participants.add(
            Participant(id = "p2", board = board, nickname = "Bob", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        val answer = IcebreakerAnswer(id = "a1", boardId = "b1", participantId = "p1", answerText = "Alice回答", createdAt = "2026-01-01T00:00:00Z")
        every { boardRepository.findBySlug("test") } returns board
        every { answerRepository.findById("a1") } returns answer

        assertThrows<ForbiddenException> {
            useCase.execute("test", "a1", "p2")
        }
    }

    @Test
    fun `存在しないボードでNotFoundExceptionがスローされる`() {
        every { boardRepository.findBySlug("nonexistent") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("nonexistent", "a1", "p1")
        }
    }

    @Test
    fun `存在しない参加者でNotFoundExceptionがスローされる`() {
        val board = Board(id = "b1", slug = "test", phase = Phase.ICEBREAK, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        every { boardRepository.findBySlug("test") } returns board

        assertThrows<NotFoundException> {
            useCase.execute("test", "a1", "unknown")
        }
    }

    @Test
    fun `存在しない回答でNotFoundExceptionがスローされる`() {
        val board = Board(id = "b1", slug = "test", phase = Phase.ICEBREAK, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        every { boardRepository.findBySlug("test") } returns board
        every { answerRepository.findById("nonexistent") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("test", "nonexistent", "p1")
        }
    }
}
