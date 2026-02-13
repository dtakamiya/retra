package com.retra.actionitem.domain

import com.retra.board.domain.Board
import com.retra.board.domain.Participant
import com.retra.card.domain.Card
import com.retra.shared.domain.DomainEvent
import com.retra.shared.domain.ForbiddenException
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "action_items")
open class ActionItem(
    @Id
    open var id: String = UUID.randomUUID().toString(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    open var board: Board? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id")
    open var card: Card? = null,

    @Column(nullable = false)
    open var content: String = "",

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    open var assignee: Participant? = null,

    @Column(name = "due_date")
    open var dueDate: String? = null,

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    open var status: ActionItemStatus = ActionItemStatus.OPEN,

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    open var priority: ActionItemPriority = ActionItemPriority.MEDIUM,

    @Column(name = "sort_order", nullable = false)
    open var sortOrder: Int = 0,

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = Instant.now().toString(),

    @Column(name = "updated_at", nullable = false)
    open var updatedAt: String = Instant.now().toString()
) {
    @Transient
    private val _domainEvents: MutableList<DomainEvent> = mutableListOf()

    fun getDomainEvents(): List<DomainEvent> = _domainEvents.toList()

    fun clearDomainEvents() {
        _domainEvents.clear()
    }

    fun canBeModifiedBy(participant: Participant): Boolean {
        return participant.isFacilitator || assignee?.id == participant.id
    }

    fun canBeDeletedBy(participant: Participant): Boolean {
        return canBeModifiedBy(participant)
    }

    fun update(content: String, assignee: Participant?, dueDate: String?, executor: Participant, priority: ActionItemPriority? = null) {
        if (!canBeModifiedBy(executor)) {
            throw ForbiddenException("Only the facilitator or assignee can modify this action item")
        }
        this.content = content
        this.assignee = assignee
        this.dueDate = dueDate
        if (priority != null) {
            this.priority = priority
        }
        this.updatedAt = Instant.now().toString()
        _domainEvents.add(
            ActionItemEvent.ActionItemUpdated(
                actionItemId = id,
                boardSlug = board?.slug ?: ""
            )
        )
    }

    fun changeStatus(newStatus: ActionItemStatus, executor: Participant) {
        if (!canBeModifiedBy(executor)) {
            throw ForbiddenException("Only the facilitator or assignee can change the status of this action item")
        }
        this.status = newStatus
        this.updatedAt = Instant.now().toString()
        _domainEvents.add(
            ActionItemEvent.ActionItemStatusChanged(
                actionItemId = id,
                boardSlug = board?.slug ?: "",
                newStatus = newStatus
            )
        )
    }

    companion object {
        fun create(
            board: Board,
            card: Card?,
            content: String,
            assignee: Participant?,
            dueDate: String?,
            sortOrder: Int,
            priority: ActionItemPriority = ActionItemPriority.MEDIUM
        ): ActionItem {
            val now = Instant.now().toString()
            val actionItem = ActionItem(
                id = UUID.randomUUID().toString(),
                board = board,
                card = card,
                content = content,
                assignee = assignee,
                dueDate = dueDate,
                status = ActionItemStatus.OPEN,
                priority = priority,
                sortOrder = sortOrder,
                createdAt = now,
                updatedAt = now
            )
            actionItem._domainEvents.add(
                ActionItemEvent.ActionItemCreated(
                    actionItemId = actionItem.id,
                    boardSlug = board.slug,
                    boardId = board.id
                )
            )
            return actionItem
        }
    }
}
