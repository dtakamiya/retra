package com.retra.kudos.usecase

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SendKudosRequest(
    @field:NotBlank
    val senderId: String,
    @field:NotBlank
    val receiverId: String,
    @field:NotBlank
    val category: String,
    @field:Size(max = 140)
    val message: String? = null
)

data class KudosResponse(
    val id: String,
    val boardId: String,
    val senderId: String,
    val senderNickname: String,
    val receiverId: String,
    val receiverNickname: String,
    val category: String,
    val message: String?,
    val createdAt: String
)
