package com.retra.board.domain

data class ColumnDefinition(
    val name: String,
    val sortOrder: Int,
    val color: String
)

enum class Framework {
    KPT,
    FUN_DONE_LEARN,
    FOUR_LS,
    START_STOP_CONTINUE;

    fun getColumnDefinitions(): List<ColumnDefinition> {
        return when (this) {
            KPT -> listOf(
                ColumnDefinition("Keep", 0, "#22c55e"),
                ColumnDefinition("Problem", 1, "#ef4444"),
                ColumnDefinition("Try", 2, "#3b82f6")
            )
            FUN_DONE_LEARN -> listOf(
                ColumnDefinition("Fun", 0, "#f59e0b"),
                ColumnDefinition("Done", 1, "#22c55e"),
                ColumnDefinition("Learn", 2, "#8b5cf6")
            )
            FOUR_LS -> listOf(
                ColumnDefinition("Liked", 0, "#22c55e"),
                ColumnDefinition("Learned", 1, "#3b82f6"),
                ColumnDefinition("Lacked", 2, "#ef4444"),
                ColumnDefinition("Longed For", 3, "#f59e0b")
            )
            START_STOP_CONTINUE -> listOf(
                ColumnDefinition("Start", 0, "#22c55e"),
                ColumnDefinition("Stop", 1, "#ef4444"),
                ColumnDefinition("Continue", 2, "#3b82f6")
            )
        }
    }
}
