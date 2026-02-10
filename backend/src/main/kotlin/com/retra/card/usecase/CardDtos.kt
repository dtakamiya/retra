package com.retra.card.usecase

data class CreateCardRequest(
    val columnId: String,
    val content: String,
    val participantId: String
)

data class UpdateCardRequest(
    val content: String,
    val participantId: String
)

data class DeleteCardRequest(
    val participantId: String
)

data class MoveCardRequest(
    val targetColumnId: String,
    val sortOrder: Int,
    val participantId: String
)

data class VoteRequest(
    val cardId: String,
    val participantId: String
)

data class RemoveVoteRequest(
    val cardId: String,
    val participantId: String
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
