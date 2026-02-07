package com.retra.controller

import com.retra.dto.*
import com.retra.exception.BadRequestException
import com.retra.exception.ForbiddenException
import com.retra.service.CardService
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class CardControllerTest {

    private lateinit var cardService: CardService
    private lateinit var controller: CardController

    private val sampleCard = CardResponse(
        id = "card-1",
        columnId = "col-1",
        content = "Test card",
        authorNickname = "Alice",
        participantId = "p-1",
        voteCount = 0,
        sortOrder = 0,
        createdAt = "2024-01-01T00:00:00Z",
        updatedAt = "2024-01-01T00:00:00Z"
    )

    @BeforeEach
    fun setUp() {
        cardService = mockk()
        controller = CardController(cardService)
    }

    @Test
    fun `createCard カード作成成功`() {
        val request = CreateCardRequest("col-1", "Test card", "p-1")
        every { cardService.createCard("test1234", request) } returns sampleCard

        val result = controller.createCard("test1234", request)

        assertEquals("Test card", result.content)
        assertEquals("card-1", result.id)
        verify(exactly = 1) { cardService.createCard("test1234", request) }
    }

    @Test
    fun `createCard 非WRITINGフェーズでBadRequestException`() {
        val request = CreateCardRequest("col-1", "Test", "p-1")
        every { cardService.createCard("test1234", request) } throws
            BadRequestException("Cards can only be created during WRITING phase")

        assertThrows(BadRequestException::class.java) {
            controller.createCard("test1234", request)
        }
    }

    @Test
    fun `updateCard カード更新成功`() {
        val request = UpdateCardRequest("Updated", "p-1")
        val updated = sampleCard.copy(content = "Updated")
        every { cardService.updateCard("test1234", "card-1", request) } returns updated

        val result = controller.updateCard("test1234", "card-1", request)

        assertEquals("Updated", result.content)
        verify(exactly = 1) { cardService.updateCard("test1234", "card-1", request) }
    }

    @Test
    fun `deleteCard カード削除成功`() {
        val request = DeleteCardRequest("p-1")
        justRun { cardService.deleteCard("test1234", "card-1", request) }

        controller.deleteCard("test1234", "card-1", request)

        verify(exactly = 1) { cardService.deleteCard("test1234", "card-1", request) }
    }

    @Test
    fun `moveCard カード移動成功`() {
        val request = MoveCardRequest("col-2", 0, "p-1")
        justRun { cardService.moveCard("test1234", "card-1", request) }

        controller.moveCard("test1234", "card-1", request)

        verify(exactly = 1) { cardService.moveCard("test1234", "card-1", request) }
    }

    @Test
    fun `moveCard VOTINGフェーズでBadRequestException`() {
        val request = MoveCardRequest("col-1", 0, "p-1")
        every { cardService.moveCard("test1234", "card-1", request) } throws
            BadRequestException("Cards cannot be moved in VOTING phase")

        assertThrows(BadRequestException::class.java) {
            controller.moveCard("test1234", "card-1", request)
        }
    }

    @Test
    fun `moveCard 非著者でForbiddenException`() {
        val request = MoveCardRequest("col-1", 0, "p-2")
        every { cardService.moveCard("test1234", "card-1", request) } throws
            ForbiddenException("Only the author can move this card during WRITING phase")

        assertThrows(ForbiddenException::class.java) {
            controller.moveCard("test1234", "card-1", request)
        }
    }
}
