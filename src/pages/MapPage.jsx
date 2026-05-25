import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { visualizationApi } from "../api/homeops.js";
import { useAuth } from "../context/AuthContext.jsx";

const DIRT_CLASS = ["dirt-0", "dirt-1", "dirt-2", "dirt-3", "dirt-4", "dirt-5"];

function ChaosGauge({ value }) {
  const level =
    value >= 75 ? "chaos-high" : value >= 45 ? "chaos-mid" : "chaos-low";
  const label =
    value >= 75 ? "Alto riesgo" : value >= 45 ? "Atención" : "Controlado";

  return (
    <div className={`chaos-gauge ${level}`} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="chaos-gauge-ring" style={{ "--chaos": value }}>
        <span className="chaos-gauge-value">{value}</span>
        <span className="chaos-gauge-unit">%</span>
      </div>
      <div className="chaos-gauge-meta">
        <strong>Riesgo de caos</strong>
        <span>{label}</span>
        <p className="chaos-gauge-hint">
          Sube si las zonas están muy sucias o hay tareas muy atrasadas. No afecta tus monedas.
        </p>
      </div>
    </div>
  );
}

function StabilityBars({ zones }) {
  return (
    <ul className="stability-list">
      {zones.map((z) => (
        <li key={z.id} className="stability-row">
          <div className="stability-row-head">
            <span className="stability-zone">
              <span aria-hidden="true">{z.icon}</span> {z.name}
            </span>
            <span className="stability-pct">{z.stabilityPercent}%</span>
          </div>
          <div className="stability-track" aria-hidden="true">
            <div
              className={`stability-fill ${DIRT_CLASS[z.dirtLevel] ?? "dirt-1"}`}
              style={{ width: `${z.stabilityPercent}%` }}
            />
          </div>
          <span className="stability-label">{z.dirtLabel}</span>
        </li>
      ))}
    </ul>
  );
}

function HomeMapGrid({ zones, onSelect }) {
  const maxCol = Math.max(3, ...zones.map((z) => z.gridCol));
  const maxRow = Math.max(2, ...zones.map((z) => z.gridRow));

  return (
    <div
      className="home-map-grid"
      style={{ gridTemplateColumns: `repeat(${maxCol}, 1fr)`, gridTemplateRows: `repeat(${maxRow}, minmax(88px, 1fr))` }}
    >
      {zones.map((z) => (
        <button
          key={z.id}
          type="button"
          className={`map-zone-tile ${DIRT_CLASS[z.dirtLevel] ?? "dirt-1"}${z.criticalCount ? " map-zone-tile--alert" : ""}`}
          style={{ gridColumn: z.gridCol, gridRow: z.gridRow }}
          onClick={() => onSelect(z.id)}
        >
          <span className="map-zone-icon" aria-hidden="true">{z.icon}</span>
          <span className="map-zone-name">{z.name}</span>
          <span className="map-zone-dirt">{z.dirtLabel}</span>
          {z.pendingCount > 0 && (
            <span className="map-zone-badge">{z.pendingCount} pend.</span>
          )}
        </button>
      ))}
    </div>
  );
}

function HeatmapPanel({ data }) {
  const cellMap = useMemo(() => {
    const m = new Map();
    for (const c of data?.cells ?? []) {
      m.set(`${c.day}-${c.zoneId}`, c);
    }
    return m;
  }, [data]);

  if (!data?.zones?.length) {
    return <p className="muted">Sin actividad en el periodo.</p>;
  }

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-legend" aria-hidden="true">
        <span>Menos</span>
        <span className="heatmap-swatch h0" />
        <span className="heatmap-swatch h1" />
        <span className="heatmap-swatch h2" />
        <span className="heatmap-swatch h3" />
        <span className="heatmap-swatch h4" />
        <span className="heatmap-swatch h5" />
        <span>Más suciedad al completar</span>
      </div>
      <div className="heatmap-table-scroll">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th scope="col">Zona</th>
              {(data.days ?? []).slice(-14).map((d) => (
                <th key={d} scope="col">
                  <span className="heatmap-day">{d.slice(5)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.zones.map((z) => (
              <tr key={z.id}>
                <th scope="row">
                  {z.icon} {z.name}
                </th>
                {(data.days ?? []).slice(-14).map((d) => {
                  const cell = cellMap.get(`${d}-${z.id}`);
                  const intensity = cell?.intensity ?? -1;
                  return (
                    <td key={d}>
                      <span
                        className={`heatmap-cell${intensity >= 0 ? ` h${intensity}` : " h-empty"}`}
                        title={
                          cell
                            ? `${cell.completions} completada(s), suciedad media ${cell.intensity}`
                            : "Sin actividad"
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("mapa");
  const [overview, setOverview] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [heatmapDays, setHeatmapDays] = useState(30);
  const [error, setError] = useState("");
  const [layoutEdit, setLayoutEdit] = useState(false);
  const [layoutDraft, setLayoutDraft] = useState([]);
  const [layoutSaving, setLayoutSaving] = useState(false);

  const load = useCallback(async () => {
    const [ov, hm] = await Promise.all([
      visualizationApi.overview(),
      visualizationApi.heatmap(heatmapDays),
    ]);
    setOverview(ov);
    setHeatmap(hm);
  }, [heatmapDays]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  if (error) {
    return (
      <div className="page-content map-page">
        <p className="form-error">{error}</p>
      </div>
    );
  }

  if (!overview) {
    return <div className="page-loading">Cargando mapa del hogar…</div>;
  }

  return (
    <div className="page-content map-page">
      <header className="map-hero">
        <div>
          <h1 className="page-title">Estado del hogar</h1>
          <p className="page-desc">
            Vista global de suciedad, estabilidad y actividad. Toca una zona para ver tareas y acciones.
          </p>
        </div>
        <Link to="/historial" className="map-link-historial">
          Ver historial →
        </Link>
      </header>

      <section className="map-summary-cards">
        <div className="map-stat-card">
          <span className="map-stat-label">Estabilidad global</span>
          <strong className="map-stat-value">{overview.globalStabilityPercent}%</strong>
          <span className="map-stat-sub">
            {overview.stableZonesCount}/{overview.totalZones} zonas estables
          </span>
        </div>
        {overview.homeXp != null && (
          <div className="map-stat-card">
            <span className="map-stat-label">XP del hogar</span>
            <strong className="map-stat-value">{overview.homeXp}</strong>
            <span className="map-stat-sub">{overview.activeMembers} miembro(s) activo(s)</span>
          </div>
        )}
        <div className={`map-stat-card map-stat-card--living meta-base--${overview.livingBase?.state ?? "stable"}`}>
          <span className="map-stat-label">Base viva</span>
          <strong className="map-stat-value">{overview.livingBase?.label ?? "—"}</strong>
          <span className="map-stat-sub">
            {overview.livingBase?.buffPercent > 0
              ? `+${overview.livingBase.buffPercent}% monedas`
              : "Sin buff activo"}
          </span>
        </div>
        <div className="map-stat-card">
          <span className="map-stat-label">Temporada</span>
          <strong className="map-stat-value">
            {overview.season?.emoji} S{overview.season?.weekInSeason}/{overview.season?.weeksTotal}
          </strong>
          <span className="map-stat-sub">{overview.season?.name}</span>
        </div>
      </section>

      {overview.recoveryPlan && (
        <section className="meta-recovery-panel" role="status">
          <h2 className="map-panel-title">Plan de recuperación gradual</h2>
          <p>{overview.recoveryPlan.message}</p>
          <p className="muted">{overview.recoveryPlan.collapsedZones} zona(s) en colapso.</p>
        </section>
      )}

      {overview.bossMissions?.length > 0 && (
        <section className="meta-boss-panel" role="alert">
          <h2 className="map-panel-title">Boss activos</h2>
          <ul className="meta-boss-list">
            {overview.bossMissions.map((b) => (
              <li key={b.id}>
                <Link to={`/mapa/zona/${b.zoneId}`}>{b.zoneName}</Link> — misión de rescate cooperativa
              </li>
            ))}
          </ul>
        </section>
      )}

      {overview.dirtPredictions?.length > 0 && (
        <section className="smart-predictions-panel map-panel" aria-labelledby="predictions-title">
          <h2 id="predictions-title" className="map-panel-title">Predicción de suciedad</h2>
          <p className="map-panel-hint">Estimación a 2 días según tu historial local (reglas, no IA externa).</p>
          <ul className="smart-predictions-list">
            {overview.dirtPredictions.map((p) => (
              <li key={p.zoneId} className={`smart-pred smart-pred--${p.confidence}`}>
                <strong>{p.label}</strong>
                <span className="smart-reason-inline" title={p.reason}>
                  {p.confidence === "low" ? " · estimación básica" : ` · confianza ${p.confidence}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ChaosGauge value={overview.chaosRisk} />

      <nav className="map-tabs" aria-label="Vistas del hogar">
        {[
          ["mapa", "Plano"],
          ["estabilidad", "Estabilidad"],
          ["heatmap", "Heatmap"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`map-tab${tab === id ? " map-tab--active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "mapa" && (
        <section className="map-panel" aria-labelledby="map-grid-title">
          <div className="map-panel-head">
            <h2 id="map-grid-title" className="map-panel-title">Plano del hogar</h2>
            {user?.role === "admin" && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (!layoutEdit) {
                    setLayoutDraft(
                      overview.zones.map((z) => ({
                        zoneId: z.id,
                        gridCol: z.gridCol,
                        gridRow: z.gridRow,
                      }))
                    );
                    setLayoutEdit(true);
                  } else {
                    setLayoutEdit(false);
                  }
                }}
              >
                {layoutEdit ? "Cancelar edición" : "Editar disposición"}
              </button>
            )}
          </div>
          <p className="map-panel-hint">El color indica suciedad. Las zonas en negro (nivel 5) muestran etiqueta clara.</p>
          {layoutEdit ? (
            <ul className="layout-editor-list">
              {layoutDraft.map((item, idx) => {
                const z = overview.zones.find((x) => x.id === item.zoneId);
                return (
                  <li key={item.zoneId}>
                    <span>{z?.name}</span>
                    <label>
                      Col
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={item.gridCol}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setLayoutDraft((d) =>
                            d.map((x, i) => (i === idx ? { ...x, gridCol: v } : x))
                          );
                        }}
                      />
                    </label>
                    <label>
                      Fila
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={item.gridRow}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setLayoutDraft((d) =>
                            d.map((x, i) => (i === idx ? { ...x, gridRow: v } : x))
                          );
                        }}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {layoutEdit && (
            <button
              type="button"
              className="btn-primary"
              disabled={layoutSaving}
              onClick={async () => {
                setLayoutSaving(true);
                try {
                  const updated = await visualizationApi.updateLayout(layoutDraft);
                  setOverview(updated);
                  setLayoutEdit(false);
                } catch (e) {
                  setError(e.message);
                } finally {
                  setLayoutSaving(false);
                }
              }}
            >
              {layoutSaving ? "Guardando…" : "Guardar layout"}
            </button>
          )}
          <HomeMapGrid zones={overview.zones} onSelect={(id) => navigate(`/mapa/zona/${id}`)} />
        </section>
      )}

      {tab === "estabilidad" && (
        <section className="map-panel" aria-labelledby="stability-title">
          <h2 id="stability-title" className="map-panel-title">Barras de estabilidad</h2>
          <StabilityBars zones={overview.zones} />
        </section>
      )}

      {tab === "heatmap" && (
        <section className="map-panel" aria-labelledby="heatmap-title">
          <div className="map-panel-head">
            <h2 id="heatmap-title" className="map-panel-title">Heatmap de limpieza</h2>
            <select
              value={heatmapDays}
              onChange={(e) => setHeatmapDays(Number(e.target.value))}
              aria-label="Días del periodo"
            >
              <option value={14}>14 días</option>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días</option>
            </select>
          </div>
          <HeatmapPanel data={heatmap} />
        </section>
      )}
    </div>
  );
}
