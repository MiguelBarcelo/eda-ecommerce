# Real-Time Order Processing System (E-commerce)

This system follows an **Event-Driven Architecture (EDA)** where different microservices communicate **asynchronously** via events.

**Key Features:**

- **Scalability** -> Each service runs independently.
- **Asynchronous Processing** -> If the inventory is out of stock, the payment isn't processed.
- **Event Logs** -> Maintain a history of events for debugging.

## Tech Stack

- **Node.js + Express** -> For building APIs
- **MongoDB** -> To store order & inventory data
- **Kafka** -> Event messaging

## System Architecture

```HL
[Frontend] ---> [Order Service] ---> [Event Bus (Kafka)] |--> [Inventory Service]
                                                         |--> [Payment Service]
                                                         |--> [Notification Service]
```

### Order Service (API-based)

- Receives and creates order from customers `POST /order`
- Publishes `order_placed` event to Kafka

### Inventory Service (Event-driven)

- Consumes `order_placed` events
- Checks stock & updates Inventory and Order status
- Emits `order_updates` event

## Payment Service (Event-driven)

- Listens for `order_updates` events
- Processes payments & updates Order status
- Emits `order_updates` event

## Notification Service (Event-driven)

- Listens to `order_updates` events
- Emits WebSocket events to the FE
