package com.retra.board.domain

import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException

object BoardAuthorizationService {

    fun validateCardMove(
        phase: Phase,
        isAuthor: Boolean,
        isFacilitator: Boolean,
        isCrossColumnMove: Boolean
    ) {
        if (!phase.canMoveCard()) {
            throw BadRequestException(
                "Cards cannot be moved in $phase phase"
            )
        }

        if (phase.requiresAuthorForMove() && !isAuthor) {
            throw ForbiddenException("Only the author can move this card during WRITING phase")
        }

        if (phase.requiresFacilitatorForMove() && !isFacilitator) {
            throw ForbiddenException("Only facilitator can reorder cards during $phase phase")
        }

        if (isCrossColumnMove && !phase.canMoveCardCrossColumn()) {
            throw BadRequestException(
                "Cross-column moves are only allowed during WRITING phase"
            )
        }
    }

    fun validateCardDeletion(isAuthor: Boolean, isFacilitator: Boolean) {
        if (!isAuthor && !isFacilitator) {
            throw ForbiddenException("Only the author or facilitator can delete this card")
        }
    }
}
