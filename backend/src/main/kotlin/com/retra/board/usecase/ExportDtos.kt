package com.retra.board.usecase

enum class ExportFormat {
    CSV,
    MARKDOWN
}

data class ExportBoardRequest(
    val participantId: String,
    val format: ExportFormat
)
