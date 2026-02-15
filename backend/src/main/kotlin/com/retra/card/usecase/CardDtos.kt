package com.retra.card.usecase

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateCardRequest(
    @field:NotBlank
    val columnId: String,
    @field:NotBlank
    @field:Size(max = 2000)
    val content: String,
    @field:NotBlank
    val participantId: String
)

data class UpdateCardRequest(
    @field:NotBlank
    @field:Size(max = 2000)
    val content: String,
    @field:NotBlank
    val participantId: String
)

data class DeleteCardRequest(
    @field:NotBlank
    val participantId: String
)

data class MoveCardRequest(
    @field:NotBlank
    val targetColumnId: String,
    val sortOrder: Int,
    @field:NotBlank
    val participantId: String
)

data class VoteRequest(
    @field:NotBlank
    val cardId: String,
    @field:NotBlank
    val participantId: String
)

data class RemoveVoteRequest(
    @field:NotBlank
    val cardId: String,
    @field:NotBlank
    val participantId: String
)

data class MarkCardDiscussedRequest(
    @field:NotBlank
    val participantId: String,
    val isDiscussed: Boolean
)

data class CardResponse(
    val id: String,
    val columnId: String,
    val content: String,
    val authorNickname: String?,
    val participantId: String?,
    val voteCount: Int,
    val votedParticipantIds: List<String> = emptyList(),
    val sortOrder: Int,
    val isDiscussed: Boolean = false,
    val discussionOrder: Int = 0,
    val createdAt: String,
    val updatedAt: String,
    val memos: List<MemoResponse> = emptyList(),
    val reactions: List<ReactionResponse> = emptyList()
)

data class VoteResponse(
    val id: String,
    val cardId: String,
    val participantId: String,
    val createdAt: String
)

data class RemainingVotesResponse(
    val participantId: String,
    val remaining: Int,
    val max: Int,
    val used: Int
)
