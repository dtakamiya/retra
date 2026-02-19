package com.retra.icebreaker.domain

import com.retra.shared.domain.BadRequestException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class IcebreakerAnswerTest {

    @Test
    fun `有効な内容で回答を作成`() {
        val answer = IcebreakerAnswer.create(
            boardId = "board-1",
            participantId = "participant-1",
            answerText = "キャンプにハマっています"
        )
        assertThat(answer.id).isNotBlank()
        assertThat(answer.boardId).isEqualTo("board-1")
        assertThat(answer.participantId).isEqualTo("participant-1")
        assertThat(answer.answerText).isEqualTo("キャンプにハマっています")
        assertThat(answer.createdAt).isNotBlank()
    }

    @Test
    fun `前後の空白をトリムして回答を作成`() {
        val answer = IcebreakerAnswer.create(
            boardId = "board-1",
            participantId = "participant-1",
            answerText = "  テスト回答  "
        )
        assertThat(answer.answerText).isEqualTo("テスト回答")
    }

    @Test
    fun `空白のみの回答は作成失敗`() {
        assertThrows<BadRequestException> {
            IcebreakerAnswer.create(
                boardId = "board-1",
                participantId = "participant-1",
                answerText = "   "
            )
        }
    }

    @Test
    fun `140文字を超える回答は作成失敗`() {
        assertThrows<BadRequestException> {
            IcebreakerAnswer.create(
                boardId = "board-1",
                participantId = "participant-1",
                answerText = "a".repeat(141)
            )
        }
    }

    @Test
    fun `回答テキストを更新`() {
        val answer = IcebreakerAnswer.create(
            boardId = "board-1",
            participantId = "participant-1",
            answerText = "元の回答"
        )
        answer.updateText("新しい回答")
        assertThat(answer.answerText).isEqualTo("新しい回答")
    }
}
