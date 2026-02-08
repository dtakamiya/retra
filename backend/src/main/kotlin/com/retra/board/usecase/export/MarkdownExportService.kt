package com.retra.board.usecase.export

import com.retra.board.usecase.BoardResponse
import org.springframework.stereotype.Service

@Service
class MarkdownExportService {

    fun export(board: BoardResponse): ByteArray {
        val sb = StringBuilder()

        sb.appendLine("# ${escapeMarkdown(board.title)}")
        sb.appendLine()
        sb.appendLine("- **フレームワーク**: ${board.framework}")
        sb.appendLine("- **フェーズ**: ${board.phase}")
        sb.appendLine("- **作成日時**: ${board.createdAt}")
        sb.appendLine()

        for (column in board.columns) {
            sb.appendLine("## ${escapeMarkdown(column.name)}")
            sb.appendLine()

            if (column.cards.isEmpty()) {
                sb.appendLine("_カードなし_")
                sb.appendLine()
                continue
            }

            for (card in column.cards) {
                val author = escapeMarkdown(card.authorNickname ?: "匿名")
                val votes = if (card.voteCount > 0) " (${card.voteCount}票)" else ""
                sb.appendLine("- **${escapeMarkdown(card.content)}**${votes}")
                sb.appendLine()
                sb.appendLine("  - **投稿者**: $author")

                if (card.reactions.isNotEmpty()) {
                    val reactionSummary = card.reactions
                        .groupBy { it.emoji }
                        .map { (emoji, list) -> "$emoji ${list.size}" }
                        .joinToString("  ")
                    sb.appendLine("  - **リアクション**: $reactionSummary")
                }

                if (card.memos.isNotEmpty()) {
                    sb.appendLine("  - **メモ**:")
                    for (memo in card.memos) {
                        val memoAuthor = escapeMarkdown(memo.authorNickname ?: "匿名")
                        sb.appendLine("    - ${escapeMarkdown(memo.content)} (_${memoAuthor}_)")
                    }
                }

                sb.appendLine()
            }
        }

        // Participants section
        sb.appendLine("---")
        sb.appendLine()
        sb.appendLine("## 参加者")
        sb.appendLine()
        for (participant in board.participants) {
            val role = if (participant.isFacilitator) " (ファシリテーター)" else ""
            sb.appendLine("- ${escapeMarkdown(participant.nickname)}${role}")
        }
        sb.appendLine()

        return sb.toString().toByteArray(Charsets.UTF_8)
    }

    companion object {
        fun escapeMarkdown(text: String): String {
            return text
                .replace("\\", "\\\\")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("#", "\\#")
                .replace("*", "\\*")
                .replace("[", "\\[")
                .replace("]", "\\]")
                .replace("`", "\\`")
                .replace("|", "\\|")
        }
    }
}
