package com.retra.actionitem.domain

import com.retra.TestFixtures
import com.retra.shared.domain.ForbiddenException
import org.junit.jupiter.api.Test
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class ActionItemTest {

    @Test
    fun `create でアクションアイテム生成とドメインイベント`() {
        val board = TestFixtures.board()
        val column = TestFixtures.boardColumn(board = board)
        val card = TestFixtures.card(board = board, column = column)
        val assignee = TestFixtures.participant(id = "p-1", nickname = "Alice")

        val actionItem = ActionItem.create(board, card, "Fix the bug", assignee, "2025-06-01", 0)

        assertEquals("Fix the bug", actionItem.content)
        assertEquals(ActionItemStatus.OPEN, actionItem.status)
        assertEquals(assignee, actionItem.assignee)
        assertEquals("2025-06-01", actionItem.dueDate)
        assertEquals(0, actionItem.sortOrder)
        assertTrue(actionItem.getDomainEvents().isNotEmpty())
        assertTrue(actionItem.getDomainEvents().first() is ActionItemEvent.ActionItemCreated)

        val event = actionItem.getDomainEvents().first() as ActionItemEvent.ActionItemCreated
        assertEquals(actionItem.id, event.actionItemId)
        assertEquals(board.slug, event.boardSlug)
        assertEquals(board.id, event.boardId)
    }

    @Test
    fun `create でカードなし・担当者なし・期日なしでも生成可能`() {
        val board = TestFixtures.board()

        val actionItem = ActionItem.create(board, null, "General action", null, null, 1)

        assertEquals("General action", actionItem.content)
        assertEquals(null, actionItem.card)
        assertEquals(null, actionItem.assignee)
        assertEquals(null, actionItem.dueDate)
        assertTrue(actionItem.getDomainEvents().isNotEmpty())
    }

    @Test
    fun `update で担当者がコンテンツ更新`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val now = Instant.now().toString()
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Original",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = now,
            updatedAt = now
        )

        val newAssignee = TestFixtures.participant(id = "p-2", nickname = "Bob")
        actionItem.update("Updated content", newAssignee, "2025-07-01", assignee)

        assertEquals("Updated content", actionItem.content)
        assertEquals(newAssignee, actionItem.assignee)
        assertEquals("2025-07-01", actionItem.dueDate)
        assertTrue(actionItem.getDomainEvents().isNotEmpty())
        assertTrue(actionItem.getDomainEvents().first() is ActionItemEvent.ActionItemUpdated)
    }

    @Test
    fun `update でファシリテーターがコンテンツ更新`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val facilitator = TestFixtures.participant(id = "p-2", isFacilitator = true)
        val now = Instant.now().toString()
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Original",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = now,
            updatedAt = now
        )

        actionItem.update("Updated by facilitator", null, null, facilitator)

        assertEquals("Updated by facilitator", actionItem.content)
        assertTrue(actionItem.getDomainEvents().isNotEmpty())
    }

    @Test
    fun `update で非担当者・非ファシリテーターは ForbiddenException`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val other = TestFixtures.participant(id = "p-3", isFacilitator = false)
        val now = Instant.now().toString()
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Original",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = now,
            updatedAt = now
        )

        assertFailsWith<ForbiddenException> {
            actionItem.update("Should fail", null, null, other)
        }
    }

    @Test
    fun `changeStatus でステータスを IN_PROGRESS に変更`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val now = Instant.now().toString()
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = now,
            updatedAt = now
        )

        actionItem.changeStatus(ActionItemStatus.IN_PROGRESS, assignee)

        assertEquals(ActionItemStatus.IN_PROGRESS, actionItem.status)
        assertTrue(actionItem.getDomainEvents().isNotEmpty())
        val event = actionItem.getDomainEvents().first() as ActionItemEvent.ActionItemStatusChanged
        assertEquals(ActionItemStatus.IN_PROGRESS, event.newStatus)
    }

    @Test
    fun `changeStatus でステータスを DONE に変更`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val now = Instant.now().toString()
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = assignee,
            status = ActionItemStatus.IN_PROGRESS,
            sortOrder = 0,
            createdAt = now,
            updatedAt = now
        )

        actionItem.changeStatus(ActionItemStatus.DONE, assignee)

        assertEquals(ActionItemStatus.DONE, actionItem.status)
        val event = actionItem.getDomainEvents().first() as ActionItemEvent.ActionItemStatusChanged
        assertEquals(ActionItemStatus.DONE, event.newStatus)
    }

    @Test
    fun `changeStatus でファシリテーターがステータス変更可能`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val facilitator = TestFixtures.participant(id = "p-2", isFacilitator = true)
        val now = Instant.now().toString()
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = now,
            updatedAt = now
        )

        actionItem.changeStatus(ActionItemStatus.DONE, facilitator)

        assertEquals(ActionItemStatus.DONE, actionItem.status)
    }

    @Test
    fun `changeStatus で非担当者・非ファシリテーターは ForbiddenException`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val other = TestFixtures.participant(id = "p-3", isFacilitator = false)
        val now = Instant.now().toString()
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = now,
            updatedAt = now
        )

        assertFailsWith<ForbiddenException> {
            actionItem.changeStatus(ActionItemStatus.DONE, other)
        }
    }

    @Test
    fun `canBeModifiedBy でファシリテーターは true`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val facilitator = TestFixtures.participant(id = "p-2", isFacilitator = true)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertTrue(actionItem.canBeModifiedBy(facilitator))
    }

    @Test
    fun `canBeModifiedBy で担当者は true`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertTrue(actionItem.canBeModifiedBy(assignee))
    }

    @Test
    fun `canBeModifiedBy で非担当者・非ファシリテーターは false`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val other = TestFixtures.participant(id = "p-3", isFacilitator = false)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertFalse(actionItem.canBeModifiedBy(other))
    }

    @Test
    fun `canBeDeletedBy でファシリテーターは true`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val facilitator = TestFixtures.participant(id = "p-2", isFacilitator = true)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertTrue(actionItem.canBeDeletedBy(facilitator))
    }

    @Test
    fun `canBeDeletedBy で担当者は true`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertTrue(actionItem.canBeDeletedBy(assignee))
    }

    @Test
    fun `canBeDeletedBy で非担当者・非ファシリテーターは false`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val other = TestFixtures.participant(id = "p-3", isFacilitator = false)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertFalse(actionItem.canBeDeletedBy(other))
    }

    @Test
    fun `clearDomainEvents でイベントがクリアされる`() {
        val board = TestFixtures.board()
        val actionItem = ActionItem.create(board, null, "Task", null, null, 0)

        assertTrue(actionItem.getDomainEvents().isNotEmpty())
        actionItem.clearDomainEvents()
        assertTrue(actionItem.getDomainEvents().isEmpty())
    }

    @Test
    fun `update でpriorityがnullの場合は既存のpriorityが維持される`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Original",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            priority = ActionItemPriority.HIGH,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        actionItem.update("Updated", assignee, null, assignee, priority = null)

        assertEquals(ActionItemPriority.HIGH, actionItem.priority)
    }

    @Test
    fun `update でpriorityが指定された場合はpriorityが変更される`() {
        val board = TestFixtures.board()
        val assignee = TestFixtures.participant(id = "p-1")
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Original",
            assignee = assignee,
            status = ActionItemStatus.OPEN,
            priority = ActionItemPriority.MEDIUM,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        actionItem.update("Updated", assignee, null, assignee, priority = ActionItemPriority.LOW)

        assertEquals(ActionItemPriority.LOW, actionItem.priority)
    }

    @Test
    fun `create でpriorityを指定できる`() {
        val board = TestFixtures.board()

        val actionItem = ActionItem.create(board, null, "High priority task", null, null, 0, ActionItemPriority.HIGH)

        assertEquals(ActionItemPriority.HIGH, actionItem.priority)
    }

    @Test
    fun `create でpriorityのデフォルトはMEDIUM`() {
        val board = TestFixtures.board()

        val actionItem = ActionItem.create(board, null, "Default priority task", null, null, 0)

        assertEquals(ActionItemPriority.MEDIUM, actionItem.priority)
    }

    @Test
    fun `canBeModifiedBy でassigneeがnullの場合は非ファシリテーターにfalse`() {
        val board = TestFixtures.board()
        val other = TestFixtures.participant(id = "p-3", isFacilitator = false)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = null,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertFalse(actionItem.canBeModifiedBy(other))
    }

    @Test
    fun `canBeModifiedBy でassigneeがnullの場合でもファシリテーターはtrue`() {
        val board = TestFixtures.board()
        val facilitator = TestFixtures.participant(id = "p-2", isFacilitator = true)
        val actionItem = ActionItem(
            id = "ai-1",
            board = board,
            content = "Task",
            assignee = null,
            status = ActionItemStatus.OPEN,
            sortOrder = 0,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString()
        )

        assertTrue(actionItem.canBeModifiedBy(facilitator))
    }

    @Test
    fun `デフォルトコンストラクタでプロパティが初期化される`() {
        val actionItem = ActionItem()

        assertNotNull(actionItem.id)
        assertEquals("", actionItem.content)
        assertEquals(ActionItemStatus.OPEN, actionItem.status)
        assertEquals(ActionItemPriority.MEDIUM, actionItem.priority)
        assertEquals(0, actionItem.sortOrder)
    }
}
