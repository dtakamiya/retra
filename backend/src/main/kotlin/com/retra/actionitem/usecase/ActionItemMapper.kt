package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItem

object ActionItemMapper {

    fun toActionItemResponse(actionItem: ActionItem): ActionItemResponse {
        return ActionItemResponse(
            id = actionItem.id,
            boardId = actionItem.board?.id ?: "",
            cardId = actionItem.card?.id,
            content = actionItem.content,
            assigneeId = actionItem.assignee?.id,
            assigneeNickname = actionItem.assignee?.nickname,
            dueDate = actionItem.dueDate,
            status = actionItem.status.name,
            priority = actionItem.priority.name,
            sortOrder = actionItem.sortOrder,
            createdAt = actionItem.createdAt,
            updatedAt = actionItem.updatedAt
        )
    }
}
