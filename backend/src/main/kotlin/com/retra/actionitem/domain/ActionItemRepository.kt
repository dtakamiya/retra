package com.retra.actionitem.domain

interface ActionItemRepository {
    fun save(actionItem: ActionItem): ActionItem
    fun findById(id: String): ActionItem?
    fun findByBoardId(boardId: String): List<ActionItem>
    fun delete(actionItem: ActionItem)
    fun countByBoardId(boardId: String): Int
}
