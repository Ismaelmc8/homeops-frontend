export default function RewardBreakdownModal({ result, onClose }) {
  if (!result) return null;

  const b = result.breakdown ?? {};
  const lines = [
    { label: "Base", value: b.base },
    { label: "Tras bonus preventivo", value: b.afterPreventive },
    b.streakBonus > 0 && { label: "Bonus racha", value: `+${b.streakBonus}` },
    b.efficiencyBonus > 0 && { label: "Bonus eficiencia", value: `+${b.efficiencyBonus}` },
    b.fatiguePenalty > 0 && { label: "Fatiga (−20%)", value: `−${b.fatiguePenalty}` },
    { label: "Monedas finales", value: result.coinsEarned, highlight: true },
    { label: "XP ganado", value: result.xpEarned, highlight: true },
  ].filter(Boolean);

  return (
    <div className="reward-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="reward-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="reward-modal-title">¿Cómo se calculó?</h2>

        {result.messages?.length > 0 && (
          <ul className="reward-modal-messages">
            {result.messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}

        <dl className="reward-modal-breakdown">
          {lines.map((line) => (
            <div key={line.label} className={line.highlight ? "highlight" : ""}>
              <dt>{line.label}</dt>
              <dd>{line.value}</dd>
            </div>
          ))}
        </dl>

        {result.streakCount > 0 && (
          <p className="reward-modal-streak">
            Racha actual en esta tarea: <strong>×{result.streakCount}</strong>
          </p>
        )}

        <button type="button" className="btn-secondary reward-modal-close" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}
