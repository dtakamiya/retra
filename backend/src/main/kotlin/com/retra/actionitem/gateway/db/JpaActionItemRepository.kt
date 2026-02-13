package com.retra.actionitem.gateway.db

import com.retra.actionitem.domain.ActionItem
import com.retra.actionitem.domain.ActionItemRepository
import org.springframework.stereotype.Repository

@Repository
class JpaActionItemRepository(
    private val springDataRepo: SpringDataActionItemRepository
) : ActionItemRepository {

    override fun save(actionItem: ActionItem): ActionItem = springDataRepo.save(actionItem)

    override fun findById(id: String): ActionItem? =
        springDataRepo.findById(id).orElse(null)

    override fun findByBoardId(boardId: String): List<ActionItem> =
        springDataRepo.findByBoardIdOrderBySortOrder(boardId)

    override fun delete(actionItem: ActionItem) = springDataRepo.delete(actionItem)

    override fun countByBoardId(boardId: String): Int = springDataRepo.countByBoardId(boardId)
}
