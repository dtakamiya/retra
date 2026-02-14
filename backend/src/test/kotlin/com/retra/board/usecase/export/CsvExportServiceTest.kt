package com.retra.board.usecase.export

import com.retra.board.domain.Framework
import com.retra.board.domain.Phase
import com.retra.board.usecase.BoardResponse
import com.retra.board.usecase.ColumnResponse
import com.retra.board.usecase.ParticipantResponse
import com.retra.card.usecase.CardResponse
import com.retra.card.usecase.MemoResponse
import com.retra.card.usecase.ReactionResponse
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class CsvExportServiceTest {

    private val service = CsvExportService()

    private fun boardResponse(columns: List<ColumnResponse> = emptyList()) = BoardResponse(
        id = "board-1",
        slug = "test1234",
        title = "Test Retro",
        teamName = null,
        framework = Framework.KPT,
        phase = Phase.DISCUSSION,
        maxVotesPerPerson = 5,
        isAnonymous = false,
        columns = columns,
        participants = listOf(
            ParticipantResponse("p-1", "Alice", true, true, "2024-01-01T00:00:00Z")
        ),
        createdAt = "2024-01-01T00:00:00Z",
        updatedAt = "2024-01-01T00:00:00Z"
    )

    @Test
    fun `空のボードでCSVエクスポート成功`() {
        val board = boardResponse(columns = listOf(
            ColumnResponse("col-1", "Keep", 0, "#22c55e", emptyList())
        ))

        val result = service.export(board)
        val csv = String(result, Charsets.UTF_8)

        assertTrue(csv.contains("Column,Content,Author,Votes,Memos,Reactions"))
        // ヘッダーのみ（カードなし）
        val lines = csv.trim().lines()
        assertEquals(1, lines.size)
    }

    @Test
    fun `カード付きボードでCSVエクスポート成功`() {
        val card = CardResponse(
            id = "card-1", columnId = "col-1", content = "良かったこと",
            authorNickname = "Alice", participantId = "p-1", voteCount = 3,
            sortOrder = 0, createdAt = "2024-01-01T00:00:00Z", updatedAt = "2024-01-01T00:00:00Z",
            memos = listOf(
                MemoResponse("m-1", "card-1", "メモ1", "Bob", "p-2", "2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z")
            ),
            reactions = listOf(
                ReactionResponse("r-1", "card-1", "p-1", "👍", "2024-01-01T00:00:00Z"),
                ReactionResponse("r-2", "card-1", "p-2", "👍", "2024-01-01T00:00:00Z")
            )
        )
        val board = boardResponse(columns = listOf(
            ColumnResponse("col-1", "Keep", 0, "#22c55e", listOf(card))
        ))

        val result = service.export(board)
        val csv = String(result, Charsets.UTF_8)

        assertTrue(csv.contains("Keep"))
        assertTrue(csv.contains("良かったこと"))
        assertTrue(csv.contains("Alice"))
        assertTrue(csv.contains("3"))
        assertTrue(csv.contains("メモ1"))
        assertTrue(csv.contains("👍:2"))
    }

    @Test
    fun `特殊文字を含むカードが正しくエスケープされる`() {
        val card = CardResponse(
            id = "card-1", columnId = "col-1", content = "カンマ,入り\n改行あり",
            authorNickname = "Alice", participantId = "p-1", voteCount = 0,
            sortOrder = 0, createdAt = "2024-01-01T00:00:00Z", updatedAt = "2024-01-01T00:00:00Z"
        )
        val board = boardResponse(columns = listOf(
            ColumnResponse("col-1", "Keep", 0, "#22c55e", listOf(card))
        ))

        val result = service.export(board)
        val csv = String(result, Charsets.UTF_8)

        // RFC4180: カンマや改行を含む場合ダブルクォートで囲まれる
        assertTrue(csv.contains("\"カンマ,入り"))
    }
}
