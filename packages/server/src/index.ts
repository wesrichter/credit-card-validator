import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { luhn } from "./luhn";
import { detectNetwork } from "@cc-validator/shared";
import type {
  ValidateRequest,
  ValidateResponse,
  ErrorResponse,
} from "@cc-validator/shared";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// A card number is at most 19 digits (plus spaces/dashes) — cap well below any
// reasonable value to prevent large-payload abuse.
const MAX_CARD_INPUT_LENGTH = 32;

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "4kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post(
  "/api/validate",
  (
    req: Request<object, ValidateResponse | ErrorResponse, ValidateRequest>,
    res: Response,
  ) => {
    const { cardNumber } = req.body;

    if (typeof cardNumber !== "string" || cardNumber.trim() === "") {
      res.status(400).json({ error: "cardNumber is required" });
      return;
    }

    if (cardNumber.length > MAX_CARD_INPUT_LENGTH) {
      res.status(400).json({ error: "cardNumber is too long" });
      return;
    }

    const digits = cardNumber.replace(/\D/g, "");
    const valid = luhn(cardNumber);
    const network = detectNetwork(cardNumber);
    res.json({ valid, cardNumber: digits, network });
  },
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
