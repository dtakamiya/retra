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

class MarkdownExportServiceTest {

    private val service = MarkdownExportService()

    private fun boardResponse(
        columns: List<ColumnResponse> = emptyList(),
        participants: List<ParticipantResponse> = listOf(
            ParticipantResponse("p-1", "Alice", true, true, "2024-01-01T00:00:00Z")
        )
    ) = BoardResponse(
        id = "board-1",
        slug = "test1234",
        title = "Test Retro",
        teamName = null,
        framework = Framework.KPT,
        phase = Phase.DISCUSSION,
        maxVotesPerPerson = 5,
        isAnonymous = false,
        privateWriting = false,
        enableIcebreaker = false,
        icebreakerQuestion = null,
        columns = columns,
        participants = participants,
        createdAt = "2024-01-01T00:00:00Z",
        updatedAt = "2024-01-01T00:00:00Z"
    )

    @Test
    fun `空のボードでMarkdownエクスポート成功`() {
        val board = boardResponse(columns = listOf(
            ColumnResponse("col-1", "Keep", 0, "#22c55e", emptyList())
        ))

        val result = service.export(board)
        val md = String(result, Charsets.UTF_8)

        assertTrue(md.contains("# Test Retro"))
        assertTrue(md.contains("## Keep"))
        assertTrue(md.contains("_カードなし_"))
        assertTrue(md.contains("## 参加者"))
        assertTrue(md.contains("Alice"))
    }

    @Test
    fun `カード付きボードでMarkdownエクスポート成功`() {
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
        val md = String(result, Charsets.UTF_8)

        assertTrue(md.contains("- **良かったこと** (3票)"))
        assertTrue(md.contains("  - **投稿者**: Alice"))
        assertTrue(md.contains("👍 2"))
        assertTrue(md.contains("メモ1"))
        assertTrue(md.contains("_Bob_"))
    }

    @Test
    fun `参加者セクションにファシリテーターラベルが表示される`() {
        val board = boardResponse(
            participants = listOf(
                ParticipantResponse("p-1", "Alice", true, true, "2024-01-01T00:00:00Z"),
                ParticipantResponse("p-2", "Bob", false, true, "2024-01-01T00:00:00Z")
            )
        )

        val result = service.export(board)
        val md = String(result, Charsets.UTF_8)

        assertTrue(md.contains("Alice (ファシリテーター)"))
        assertTrue(md.contains("- Bob"))
        assertFalse(md.contains("Bob (ファシリテーター)"))
    }
}
