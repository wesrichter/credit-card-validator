export type CardNetwork =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "unknown";

export function detectNetwork(cardNumber: string): CardNetwork {
  const digits = cardNumber.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7]\d{2})/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(6011|622\d{3}|64[4-9]|65)/.test(digits)) return "discover";
  return "unknown";
}

export interface ValidateRequest {
  cardNumber: string;
}

export interface ValidateResponse {
  valid: boolean;
  cardNumber: string;
  network: CardNetwork;
}

export interface ErrorResponse {
  error: string;
}
