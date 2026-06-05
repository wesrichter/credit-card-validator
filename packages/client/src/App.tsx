import { useState } from "react";
import type { ValidateResponse, ErrorResponse } from "@cc-validator/shared";
import { detectNetwork, type CardNetwork } from "@cc-validator/shared";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCardInput(digits: string, network: CardNetwork): string {
  if (network === "amex") {
    const d = digits.slice(0, 15);
    if (d.length <= 4) return d;
    if (d.length <= 10) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 10)} ${d.slice(10)}`;
  }
  const d = digits.slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < d.length; i += 4) parts.push(d.slice(i, i + 4));
  return parts.join(" ");
}

function getDisplaySegments(digits: string, network: CardNetwork): string {
  if (network === "amex") {
    const p = digits.padEnd(15, "•");
    return `${p.slice(0, 4)} ${p.slice(4, 10)} ${p.slice(10, 15)}`;
  }
  const p = digits.padEnd(16, "•");
  return `${p.slice(0, 4)} ${p.slice(4, 8)} ${p.slice(8, 12)} ${p.slice(12, 16)}`;
}

// ─── constants ──────────────────────────────────────────────────────────────

const NETWORK_LABELS: Record<CardNetwork, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  unknown: "",
};

const CARD_GRADIENTS: Record<CardNetwork, string> = {
  visa: "linear-gradient(135deg, #1a237e 0%, #1565c0 100%)",
  mastercard: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
  amex: "linear-gradient(135deg, #004d40 0%, #00796b 100%)",
  discover: "linear-gradient(135deg, #bf360c 0%, #f57c00 100%)",
  unknown: "linear-gradient(135deg, #37474f 0%, #546e7a 100%)",
};

// ─── card visual ─────────────────────────────────────────────────────────────

function CardVisual({
  digits,
  network,
}: {
  digits: string;
  network: CardNetwork;
}) {
  return (
    <div
      className="card-visual"
      style={{ background: CARD_GRADIENTS[network] }}
    >
      <div className="card-visual__header">
        <div className="card-visual__chip">
          <div className="card-visual__chip-line" />
          <div className="card-visual__chip-line" />
        </div>
        {network !== "unknown" && (
          <span
            className={`card-visual__network card-visual__network--${network}`}
          >
            {NETWORK_LABELS[network]}
          </span>
        )}
      </div>
      <div className="card-visual__number" aria-hidden="true">
        {getDisplaySegments(digits, network)}
      </div>
    </div>
  );
}

// ─── app ─────────────────────────────────────────────────────────────────────

type Result = ValidateResponse | null;

export default function App() {
  const [input, setInput] = useState("");
  const [network, setNetwork] = useState<CardNetwork>("unknown");
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = input.replace(/\D/g, "");
  const maxDigits = network === "amex" ? 15 : 16;
  const isComplete = digits.length === maxDigits;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const detected = detectNetwork(raw);
    setNetwork(detected);
    setInput(formatCardInput(raw, detected));
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: input }),
      });

      if (!res.ok) {
        const data: ErrorResponse = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      const data: ValidateResponse = await res.json();
      setResult(data);
    } catch {
      setError("Couldn't reach the server — is it running?");
    } finally {
      setLoading(false);
    }
  };

  function getResultMessage(r: ValidateResponse): string {
    const label = NETWORK_LABELS[r.network];
    if (r.valid) {
      return label
        ? `Looks good! That's a valid ${label} card number.`
        : "Looks good! That's a valid card number.";
    }
    return "That doesn't add up. Double-check the number and try again.";
  }

  return (
    <div className="page">
      <div className="card">
        <CardVisual digits={digits} network={network} />
        <div className="card-body">
          <h1>Check your card</h1>
          <p className="subtitle">
            Enter any card number to verify its checksum
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="card-input">Card number</label>
              <div className="input-wrap">
                <input
                  id="card-input"
                  type="text"
                  inputMode="numeric"
                  placeholder={
                    network === "amex"
                      ? "3782 822463 10005"
                      : "1234 5678 9012 3456"
                  }
                  value={input}
                  onChange={handleChange}
                  autoComplete="cc-number"
                  aria-describedby="digit-count"
                  className={isComplete ? "is-complete" : ""}
                />
                {network !== "unknown" && (
                  <span
                    className={`network-pill network-pill--${network}`}
                    aria-hidden="true"
                  >
                    {NETWORK_LABELS[network]}
                  </span>
                )}
              </div>
              <span id="digit-count" className="digit-hint">
                {digits.length > 0
                  ? `${digits.length} / ${maxDigits} digits`
                  : `${maxDigits} digits expected`}
              </span>
            </div>

            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? "Checking…" : isComplete ? "Validate" : "Validate"}
            </button>
          </form>

          {error && (
            <div className="result result--error" role="alert">
              {error}
            </div>
          )}

          {result && (
            <div
              className={`result ${result.valid ? "result--valid" : "result--invalid"}`}
              role="alert"
            >
              <span className="result__icon">{result.valid ? "✓" : "✗"}</span>
              <span className="result__message">
                {getResultMessage(result)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
