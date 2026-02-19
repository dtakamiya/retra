package com.retra.icebreaker.usecase

import com.retra.board.domain.*
import com.retra.icebreaker.domain.IcebreakerAnswer
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import com.retra.shared.domain.NotFoundException
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class GetIcebreakerUseCaseTest {
    private val boardRepository = mockk<BoardRepository>()
    private val answerRepository = mockk<IcebreakerAnswerRepository>()
    private val useCase = GetIcebreakerUseCase(boardRepository, answerRepository)

    @Test
    fun `ボードのアイスブレイカーデータを返す`() {
        val board = Board(id = "b1", slug = "test-slug", title = "Test",
            framework = Framework.KPT, phase = Phase.ICEBREAK,
            enableIcebreaker = true, icebreakerQuestion = "テスト質問")
        val participant = Participant(id = "p1", board = board, nickname = "Alice",
            isFacilitator = true, createdAt = "2026-01-01T00:00:00Z")
        board.participants.add(participant)
        val answers = listOf(
            IcebreakerAnswer(id = "a1", boardId = "b1", participantId = "p1",
                answerText = "回答1", createdAt = "2026-01-01T00:00:00Z")
        )
        every { boardRepository.findBySlug("test-slug") } returns board
        every { answerRepository.findByBoardId("b1") } returns answers

        val result = useCase.execute("test-slug")

        assertThat(result.question).isEqualTo("テスト質問")
        assertThat(result.answers).hasSize(1)
        assertThat(result.answers[0].answerText).isEqualTo("回答1")
        assertThat(result.answers[0].participantNickname).isEqualTo("Alice")
    }

    @Test
    fun `ボードが見つからない場合はNotFoundException`() {
        every { boardRepository.findBySlug("bad-slug") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("bad-slug")
        }
    }
}
