package com.retra.actionitem.usecase

data class CarryOverItemResponse(
    val id: String,
    val content: String,
    val assigneeNickname: String?,
    val dueDate: String?,
    val status: String,
    val priority: String,
    val sourceBoardTitle: String,
    val sourceBoardClosedAt: String,
    val sourceBoardSlug: String
)

data class CarryOverItemsResponse(
    val items: List<CarryOverItemResponse>,
    val teamName: String
)
