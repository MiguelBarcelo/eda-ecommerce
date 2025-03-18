# Real-Time Order Processing System (E-commerce)

**Event-Driven Architecture (EDA)**

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
