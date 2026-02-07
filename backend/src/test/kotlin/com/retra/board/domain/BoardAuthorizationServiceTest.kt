package com.retra.board.domain

import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import kotlin.test.assertFailsWith

class BoardAuthorizationServiceTest {

    @Nested
    inner class ValidateCardMove {

        @Test
        fun `WRITINGフェーズで著者が同カラム内移動できる`() {
            BoardAuthorizationService.validateCardMove(
                phase = Phase.WRITING,
                isAuthor = true,
                isFacilitator = false,
                isCrossColumnMove = false
            )
        }

        @Test
        fun `WRITINGフェーズで著者がクロスカラム移動できる`() {
            BoardAuthorizationService.validateCardMove(
                phase = Phase.WRITING,
                isAuthor = true,
                isFacilitator = false,
                isCrossColumnMove = true
            )
        }

        @Test
        fun `WRITINGフェーズで非著者が移動するとForbiddenException`() {
            assertFailsWith<ForbiddenException> {
                BoardAuthorizationService.validateCardMove(
                    phase = Phase.WRITING,
                    isAuthor = false,
                    isFacilitator = false,
                    isCrossColumnMove = false
                )
            }
        }

        @Test
        fun `DISCUSSIONフェーズでファシリテーターが同カラム内移動できる`() {
            BoardAuthorizationService.validateCardMove(
                phase = Phase.DISCUSSION,
                isAuthor = false,
                isFacilitator = true,
                isCrossColumnMove = false
            )
        }

        @Test
        fun `DISCUSSIONフェーズで非ファシリテーターが移動するとForbiddenException`() {
            assertFailsWith<ForbiddenException> {
                BoardAuthorizationService.validateCardMove(
                    phase = Phase.DISCUSSION,
                    isAuthor = true,
                    isFacilitator = false,
                    isCrossColumnMove = false
                )
            }
        }

        @Test
        fun `ACTION_ITEMSフェーズでファシリテーターが同カラム内移動できる`() {
            BoardAuthorizationService.validateCardMove(
                phase = Phase.ACTION_ITEMS,
                isAuthor = false,
                isFacilitator = true,
                isCrossColumnMove = false
            )
        }

        @Test
        fun `ACTION_ITEMSフェーズで非ファシリテーターが移動するとForbiddenException`() {
            assertFailsWith<ForbiddenException> {
                BoardAuthorizationService.validateCardMove(
                    phase = Phase.ACTION_ITEMS,
                    isAuthor = true,
                    isFacilitator = false,
                    isCrossColumnMove = false
                )
            }
        }

        @Test
        fun `VOTINGフェーズでカード移動するとBadRequestException`() {
            assertFailsWith<BadRequestException> {
                BoardAuthorizationService.validateCardMove(
                    phase = Phase.VOTING,
                    isAuthor = true,
                    isFacilitator = true,
                    isCrossColumnMove = false
                )
            }
        }

        @Test
        fun `CLOSEDフェーズでカード移動するとBadRequestException`() {
            assertFailsWith<BadRequestException> {
                BoardAuthorizationService.validateCardMove(
                    phase = Phase.CLOSED,
                    isAuthor = true,
                    isFacilitator = true,
                    isCrossColumnMove = false
                )
            }
        }

        @Test
        fun `DISCUSSIONフェーズでクロスカラム移動するとBadRequestException`() {
            assertFailsWith<BadRequestException> {
                BoardAuthorizationService.validateCardMove(
                    phase = Phase.DISCUSSION,
                    isAuthor = false,
                    isFacilitator = true,
                    isCrossColumnMove = true
                )
            }
        }

        @Test
        fun `ACTION_ITEMSフェーズでクロスカラム移動するとBadRequestException`() {
            assertFailsWith<BadRequestException> {
                BoardAuthorizationService.validateCardMove(
                    phase = Phase.ACTION_ITEMS,
                    isAuthor = false,
                    isFacilitator = true,
                    isCrossColumnMove = true
                )
            }
        }
    }

    @Nested
    inner class ValidateCardDeletion {

        @Test
        fun `著者はカードを削除できる`() {
            BoardAuthorizationService.validateCardDeletion(isAuthor = true, isFacilitator = false)
        }

        @Test
        fun `ファシリテーターはカードを削除できる`() {
            BoardAuthorizationService.validateCardDeletion(isAuthor = false, isFacilitator = true)
        }

        @Test
        fun `著者でもファシリテーターでもないユーザーはForbiddenException`() {
            assertFailsWith<ForbiddenException> {
                BoardAuthorizationService.validateCardDeletion(isAuthor = false, isFacilitator = false)
            }
        }
    }
}
