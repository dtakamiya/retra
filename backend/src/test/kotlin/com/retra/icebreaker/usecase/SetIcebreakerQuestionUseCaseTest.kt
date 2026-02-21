package com.retra.icebreaker.usecase

import com.retra.board.domain.*
import com.retra.icebreaker.domain.IcebreakerQuestions
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

class SetIcebreakerQuestionUseCaseTest {
    private val boardRepository = mockk<BoardRepository>()
    private val eventPublisher = mockk<SpringDomainEventPublisher>(relaxed = true)
    private val useCase = SetIcebreakerQuestionUseCase(boardRepository, eventPublisher)

    private fun createBoard(phase: Phase = Phase.ICEBREAK): Board {
        val board = Board(id = "b1", slug = "test", phase = phase, enableIcebreaker = true)
        board.participants.add(
            Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = true, createdAt = "2026-01-01T00:00:00Z")
        )
        return board
    }

    @Test
    fun `RANDOMタイプでランダム質問を設定`() {
        val board = createBoard()
        every { boardRepository.findBySlug("test") } returns board
        every { boardRepository.save(any()) } answers { firstArg() }

        val result = useCase.execute("test", SetQuestionRequest(participantId = "p1", type = "RANDOM"))

        assertThat(result.question).isNotBlank()
        assertThat(result.question).isIn(IcebreakerQuestions.ALL)
        verify { eventPublisher.publish(any()) }
    }

    @Test
    fun `CUSTOMタイプでカスタム質問を設定`() {
        val board = createBoard()
        every { boardRepository.findBySlug("test") } returns board
        every { boardRepository.save(any()) } answers { firstArg() }

        val result = useCase.execute("test", SetQuestionRequest(participantId = "p1", type = "CUSTOM", questionText = "カスタム質問"))

        assertThat(result.question).isEqualTo("カスタム質問")
    }

    @Test
    fun `ファシリテーター以外は質問設定不可`() {
        val board = createBoard()
        board.participants.add(
            Participant(id = "p2", board = board, nickname = "Bob", isFacilitator = false, createdAt = "2026-01-01T00:00:00Z")
        )
        every { boardRepository.findBySlug("test") } returns board

        assertThrows<ForbiddenException> {
            useCase.execute("test", SetQuestionRequest(participantId = "p2", type = "RANDOM"))
        }
    }

    @Test
    fun `ICEBREAKフェーズ以外では質問設定不可`() {
        val board = createBoard(phase = Phase.WRITING)
        every { boardRepository.findBySlug("test") } returns board

        assertThrows<BadRequestException> {
            useCase.execute("test", SetQuestionRequest(participantId = "p1", type = "RANDOM"))
        }
    }

    @Test
    fun `存在しないボードでNotFoundExceptionがスローされる`() {
        every { boardRepository.findBySlug("nonexistent") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("nonexistent", SetQuestionRequest(participantId = "p1", type = "RANDOM"))
        }
    }

    @Test
    fun `存在しない参加者でNotFoundExceptionがスローされる`() {
        val board = createBoard()
        every { boardRepository.findBySlug("test") } returns board

        assertThrows<NotFoundException> {
            useCase.execute("test", SetQuestionRequest(participantId = "unknown", type = "RANDOM"))
        }
    }

    @Test
    fun `CUSTOMタイプでquestionTextがnullの場合BadRequestException`() {
        val board = createBoard()
        every { boardRepository.findBySlug("test") } returns board

        assertThrows<BadRequestException> {
            useCase.execute("test", SetQuestionRequest(participantId = "p1", type = "CUSTOM", questionText = null))
        }
    }

    @Test
    fun `不正なtypeでBadRequestExceptionがスローされる`() {
        val board = createBoard()
        every { boardRepository.findBySlug("test") } returns board

        assertThrows<BadRequestException> {
            useCase.execute("test", SetQuestionRequest(participantId = "p1", type = "INVALID"))
        }
    }
}
