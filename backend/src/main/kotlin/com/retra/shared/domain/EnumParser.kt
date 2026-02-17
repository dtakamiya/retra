package com.retra.shared.domain

object EnumParser {

    inline fun <reified T : Enum<T>> parse(value: String, label: String): T {
        return try {
            enumValueOf<T>(value.uppercase())
        } catch (_: IllegalArgumentException) {
            val validValues = enumValues<T>().joinToString(", ") { it.name }
            throw BadRequestException("Invalid $label: $value. Valid values: $validValues")
        }
    }
}
