package com.retra.actionitem.gateway.controller

import com.retra.actionitem.usecase.CarryOverItemsResponse
import com.retra.actionitem.usecase.GetCarryOverItemsUseCase
import com.retra.actionitem.usecase.UpdateActionItemStatusRequest
import com.retra.actionitem.usecase.UpdateCarryOverItemStatusUseCase
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/carry-over-items")
class CarryOverController(
    private val getCarryOverItemsUseCase: GetCarryOverItemsUseCase,
    private val updateCarryOverItemStatusUseCase: UpdateCarryOverItemStatusUseCase
) {

    @GetMapping
    fun getCarryOverItems(@PathVariable slug: String): CarryOverItemsResponse {
        return getCarryOverItemsUseCase.execute(slug)
    }

    @PatchMapping("/{actionItemId}/status")
    fun updateCarryOverItemStatus(
        @PathVariable slug: String,
        @PathVariable actionItemId: String,
        @RequestBody request: UpdateActionItemStatusRequest
    ): ResponseEntity<Void> {
        updateCarryOverItemStatusUseCase.execute(slug, actionItemId, request)
        return ResponseEntity.noContent().build()
    }
}
