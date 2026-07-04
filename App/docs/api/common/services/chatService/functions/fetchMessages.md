[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/services/chatService](../README.md) / fetchMessages

# Function: fetchMessages()

> **fetchMessages**(`bookingId`): `Promise`\<[`ChatMessage`](../interfaces/ChatMessage.md)[]\>

Defined in: common/services/chatService.ts:35

Obtiene los mensajes de una reserva ordenados cronológicamente.
Devuelve [] ante cualquier error para no romper el polling de la UI.

## Parameters

### bookingId

`string`

## Returns

`Promise`\<[`ChatMessage`](../interfaces/ChatMessage.md)[]\>
