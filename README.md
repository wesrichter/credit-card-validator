# Credit Card Validator

A small full-stack app that validates credit card numbers using the [Luhn algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm). Built with React, Express, and TypeScript in a pnpm monorepo.

---

## What it does

- **Detects the card network** (Visa, Mastercard, Amex, Discover) as you type and updates the card preview instantly
- **Auto-formats the number** — including Amex's 4-6-5 grouping vs the standard 4-4-4-4
- **Server-side validation** — sends the number to a Node.js/Express backend that runs the Luhn checksum
- **Friendly results** — tells you what went wrong in plain English instead of a raw true/false

---

## Tech stack

| Layer    | Tech                         |
| -------- | ---------------------------- |
| Frontend | React 18, TypeScript, Vite   |
| Backend  | Node.js, Express, TypeScript |
| Shared   | TypeScript types + utilities |
| Monorepo | pnpm workspaces              |

---

## Project structure

```
packages/
├── client/   React frontend (Vite dev server on :5173)
├── server/   Express API server (:3001)
└── shared/   Shared types (ValidateRequest/Response) + detectNetwork utility
```

The `shared` package is consumed by both client and server, so the card-network detection logic is written once and works identically in both places.

---

## Getting started

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+ — install with `npm i -g pnpm` if needed

### Install

```bash
pnpm install
```

### Run (development)

The easiest way is to start both servers at once from the repo root:

```bash
pnpm dev
```

Or run them separately if you need independent terminal output:

```bash
# Terminal 1 — API server (http://localhost:3001)
pnpm dev:server

# Terminal 2 — React app (http://localhost:5173)
pnpm dev:client
```

Then open [http://localhost:5173](http://localhost:5173).

### Environment variables

The server reads its config from a `.env` file. Copy the example and adjust as needed:

```bash
cp .env.example .env
```

| Variable      | Default                 | Description                        |
| ------------- | ----------------------- | ---------------------------------- |
| `PORT`        | `3001`                  | Port the Express server listens on |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin for CORS            |

---

## API

### `GET /health`

Returns `200 { "status": "ok" }` — useful for uptime checks and container health probes.

### `POST /api/validate`

Validates a card number and returns the network it belongs to.

**Request body**

```json
{ "cardNumber": "4532 0151 1283 0366" }
```

Spaces and dashes are stripped automatically — you can send either the raw or formatted number.

**Response**

```json
{
  "valid": true,
  "cardNumber": "4532015112830366",
  "network": "visa"
}
```

**Error response** (400)

```json
{ "error": "cardNumber is required" }
```

`network` is one of: `"visa"` | `"mastercard"` | `"amex"` | `"discover"` | `"unknown"`

---

## How the Luhn algorithm works

The Luhn algorithm is a simple checksum formula used to catch typos in card numbers. Starting from the second-to-last digit and moving left, every other digit is doubled. If doubling produces a number greater than 9, subtract 9. Sum all the digits — if the total is divisible by 10, the number is valid.

Real issuers generate card numbers so the last digit (the "check digit") satisfies this formula. It doesn't prove a card is active or belongs to anyone — it just confirms you didn't mistype.

---

## Test numbers

These are publicly documented test numbers safe to use in development:

| Network    | Number              |
| ---------- | ------------------- |
| Visa       | 4532 0151 1283 0366 |
| Mastercard | 5425 2334 3010 9903 |
| Amex       | 3782 822463 10005   |
| Discover   | 6011 0009 9013 9424 |

---

## Scripts

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `pnpm dev`        | Start both server and client concurrently      |
| `pnpm dev:server` | Start the Express server with hot-reload       |
| `pnpm dev:client` | Start the Vite dev server                      |
| `pnpm build`      | Build all packages                             |
| `pnpm typecheck`  | Run TypeScript type checks across all packages |
