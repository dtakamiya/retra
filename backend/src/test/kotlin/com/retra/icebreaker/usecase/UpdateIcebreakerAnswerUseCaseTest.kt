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
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class UpdateIcebreakerAnswerUseCaseTest {
    private val boardRepository = mockk<BoardRepository>()
    private val answerRepository = mockk<IcebreakerAnswerRepository>()
    private val eventPublisher = mockk<SpringDomainEventPublisher>(relaxed = true)
    private val useCase = UpdateIcebreakerAnswerUseCase(boardRepository, answerRepository, eventPublisher)

    @Test
    fun `本人の回答を更新`() {
        val board = Board(id = "b1", slug = "test", phase = Phase.ICEBREAK, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        val answer = IcebreakerAnswer(id = "a1", boardId = "b1", participantId = "p1", answerText = "元の回答", createdAt = "2026-01-01T00:00:00Z")
        every { boardRepository.findBySlug("test") } returns board
        every { answerRepository.findById("a1") } returns answer
        every { answerRepository.save(any()) } answers { firstArg() }

        val result = useCase.execute("test", "a1", UpdateAnswerRequest(participantId = "p1", answerText = "新しい回答"))

        assertThat(result.answerText).isEqualTo("新しい回答")
        verify { eventPublisher.publish(any()) }
    }

    @Test
    fun `他人の回答は更新不可`() {
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
            useCase.execute("test", "a1", UpdateAnswerRequest(participantId = "p2", answerText = "不正な更新"))
        }
    }

    @Test
    fun `ICEBREAKフェーズ以外では回答を更新できない`() {
        val board = Board(id = "b1", slug = "test", phase = Phase.WRITING, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        every { boardRepository.findBySlug("test") } returns board

        assertThrows<BadRequestException> {
            useCase.execute("test", "a1", UpdateAnswerRequest(participantId = "p1", answerText = "テスト"))
        }
    }

    @Test
    fun `存在しない回答の更新はNotFoundException`() {
        val board = Board(id = "b1", slug = "test", phase = Phase.ICEBREAK, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        every { boardRepository.findBySlug("test") } returns board
        every { answerRepository.findById("bad-id") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("test", "bad-id", UpdateAnswerRequest(participantId = "p1", answerText = "テスト"))
        }
    }
}
