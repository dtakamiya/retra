package com.retra.card.gateway.db

import com.retra.card.domain.Card
import com.retra.card.domain.CardRepository
import org.springframework.stereotype.Repository

@Repository
class JpaCardRepository(
    private val springDataRepo: SpringDataCardRepository
) : CardRepository {

    override fun save(card: Card): Card = springDataRepo.save(card)

    override fun saveAll(cards: List<Card>) {
        springDataRepo.saveAll(cards)
    }

    override fun findById(id: String): Card? =
        springDataRepo.findById(id).orElse(null)

    override fun delete(card: Card) = springDataRepo.delete(card)

    override fun findByColumnIdOrderBySortOrderAsc(columnId: String): List<Card> =
        springDataRepo.findByColumnIdOrderBySortOrderAsc(columnId)

    override fun countByColumnId(columnId: String): Long =
        springDataRepo.countByColumnId(columnId)
}
