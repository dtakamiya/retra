package com.retra.card.domain

interface CardRepository {
    fun save(card: Card): Card
    fun saveAll(cards: List<Card>)
    fun findById(id: String): Card?
    fun delete(card: Card)
    fun findByColumnIdOrderBySortOrderAsc(columnId: String): List<Card>
    fun countByColumnId(columnId: String): Long
}
