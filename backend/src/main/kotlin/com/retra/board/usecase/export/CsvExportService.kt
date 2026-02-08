package com.retra.board.usecase.export

import com.retra.board.usecase.BoardResponse
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVPrinter
import org.springframework.stereotype.Service
import java.io.StringWriter

@Service
class CsvExportService {

    fun export(board: BoardResponse): ByteArray {
        val writer = StringWriter()

        // BOM for Excel UTF-8 compatibility
        writer.write("\uFEFF")

        val csvFormat = CSVFormat.RFC4180.builder()
            .setHeader("Column", "Content", "Author", "Votes", "Memos", "Reactions")
            .build()

        CSVPrinter(writer, csvFormat).use { printer ->
            for (column in board.columns) {
                for (card in column.cards) {
                    val memos = card.memos.joinToString("; ") { it.content }
                    val reactions = card.reactions
                        .groupBy { it.emoji }
                        .map { (emoji, list) -> "$emoji:${list.size}" }
                        .joinToString(", ")

                    printer.printRecord(
                        sanitizeCellValue(column.name),
                        sanitizeCellValue(card.content),
                        sanitizeCellValue(card.authorNickname ?: ""),
                        card.voteCount,
                        sanitizeCellValue(memos),
                        sanitizeCellValue(reactions)
                    )
                }
            }
        }

        return writer.toString().toByteArray(Charsets.UTF_8)
    }

    companion object {
        private val DANGEROUS_PREFIXES = charArrayOf('=', '+', '-', '@', '\t', '\r')

        fun sanitizeCellValue(value: String): String {
            if (value.isEmpty()) return value
            return if (value[0] in DANGEROUS_PREFIXES) {
                "'$value"
            } else {
                value
            }
        }
    }
}
