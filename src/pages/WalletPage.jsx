import { useCallback, useEffect, useState } from "react";
import { rewardsApi } from "../api/homeops.js";
import { useAuth } from "../context/AuthContext.jsx";

function CoinBig() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#f0fdf4" />
      <circle cx="24" cy="24" r="16" stroke="#2d6a4f" strokeWidth="2.5" fill="none" />
      <path
        d="M24 16v16M19 19.5C19 17.6 21.2 16 24 16s5 1.6 5 3.5S26.8 23 24 23s-5 1.6-5 3.5S21.2 32 24 32s5-1.6 5-3.5"
        stroke="#2d6a4f"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function memberInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function RedemptionAvatar({ name, isMine }) {
  return (
    <div
      className={`redemption-avatar${isMine ? " redemption-avatar--mine" : ""}`}
      aria-hidden="true"
    >
      {isMine ? "★" : memberInitials(name) || "?"}
    </div>
  );
}

export default function WalletPage() {
  const { user, refresh } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const [catalog, redemptions] = await Promise.all([
      rewardsApi.catalog(),
      rewardsApi.myRedemptions(),
    ]);
    setRewards(catalog);
    setHistory(redemptions);
  }, []);

  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  }

  async function handleRedeem(reward) {
    if (redeemingId) return;
    const coins = user?.coins ?? 0;
    if (coins < reward.cost_coins) return;

    const ok = window.confirm(
      `¿Canjear «${reward.name}» por ${reward.cost_coins} monedas?\n\nSe descontarán de tu saldo.`
    );
    if (!ok) return;

    setRedeemingId(reward.id);
    setError("");
    try {
      const res = await rewardsApi.redeem(reward.id);
      await refresh();
      await load();
      showToast(res.message || "¡Canje realizado!");
    } catch (e) {
      setError(e.message || "No se pudo canjear");
    } finally {
      setRedeemingId(null);
    }
  }

  const coins = user?.coins ?? 0;

  return (
    <div className="page-content">
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      <section className="wallet-hero">
        <CoinBig />
        <div>
          <p className="wallet-label">Tu saldo actual</p>
          <p className="wallet-balance">
            {coins} <span>monedas</span>
          </p>
        </div>
      </section>

      <section>
        <h2 className="section-title">Canjear recompensas</h2>
        <p className="section-desc">
          Elige un premio del catálogo del hogar. Al canjear, las monedas se restan de tu saldo al
          instante.
        </p>

        {error && <p className="page-error">{error}</p>}

        {loading ? (
          <p className="page-muted">Cargando…</p>
        ) : rewards.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">Aún no hay recompensas</p>
            <p className="empty-state-desc">
              El administrador puede añadirlas en Administrar casa → Recompensas.
            </p>
          </div>
        ) : (
          <ul className="reward-list">
            {rewards.map((r) => {
              const canAfford = coins >= r.cost_coins;
              const busy = redeemingId === r.id;
              return (
                <li
                  key={r.id}
                  className={`reward-item${canAfford ? " reward-item--affordable" : ""}`}
                >
                  <div className="reward-item-main">
                    <span className="reward-name">{r.name}</span>
                    <span className="reward-price">{r.cost_coins} 🪙</span>
                  </div>
                  <button
                    type="button"
                    className="btn-redeem"
                    disabled={!canAfford || busy || redeemingId !== null}
                    onClick={() => handleRedeem(r)}
                  >
                    {busy ? "Canjeando…" : canAfford ? "Canjear" : "Te faltan monedas"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="section-title">Canjes del hogar</h2>
          <p className="section-desc">
            Canjes de todos los miembros de la familia. Los tuyos aparecen resaltados.
          </p>
          <ul className="redemption-list">
            {history.map((h) => (
              <li
                key={h.id}
                className={`redemption-item${h.isMine ? " redemption-item--mine" : ""}`}
              >
                <RedemptionAvatar name={h.userName} isMine={h.isMine} />
                <div className="redemption-body">
                  <span className={`redemption-who${h.isMine ? " redemption-who--mine" : ""}`}>
                    {h.isMine ? "Tú" : h.userName}
                  </span>
                  <span className="redemption-name">{h.rewardName}</span>
                  <time className="redemption-date" dateTime={h.redeemedAt}>
                    {formatDate(h.redeemedAt)}
                  </time>
                </div>
                <span className="redemption-cost">−{h.coinsSpent} 🪙</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
