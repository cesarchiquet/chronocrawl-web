"use client";

type DashboardControlPanelsProps = {
  emailMode: "instant" | "daily" | "off";
  minEmailSeverity: "medium" | "high";
  digestHour: number;
  savingAlertSettings: boolean;
  runningDigest: boolean;
  alertSettingsMessage: string;
  digestMessage: string;
  onEmailModeChange: (value: "instant" | "daily" | "off") => void;
  onMinEmailSeverityChange: (value: "medium" | "high") => void;
  onDigestHourChange: (value: number) => void;
  onSaveAlertSettings: () => void;
  onRunDailyDigestNow: () => void;
};

export default function DashboardControlPanels({
  emailMode,
  minEmailSeverity,
  digestHour,
  savingAlertSettings,
  runningDigest,
  alertSettingsMessage,
  digestMessage,
  onEmailModeChange,
  onMinEmailSeverityChange,
  onDigestHourChange,
  onSaveAlertSettings,
  onRunDailyDigestNow,
}: DashboardControlPanelsProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 pb-24">
      <div className="cc-panel-strong mb-6 rounded-[28px] p-6">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-semibold">Préférences d&apos;alertes</h2>
          <span className="relative inline-flex items-center group">
            <button
              type="button"
              aria-label="Information sur les préférences d'alertes"
              className="h-4 w-4 rounded-full border border-white/20 text-[10px] leading-none text-gray-300 hover:text-white hover:border-white/40"
            >
              i
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 rounded-[18px] border border-white/10 bg-[#050505] p-3 text-[11px] text-gray-200 shadow-[0_18px_40px_rgba(0,0,0,0.45)] group-hover:block group-focus-within:block">
              <span className="block">- Mode email : `Instant` envoie chaque alerte prioritaire, `Digest quotidien` envoie un récap lisible, `Aucun email` coupe les envois.</span>
              <span className="block mt-1">- Seuil email : niveau minimal envoyé (`HIGH` uniquement, ou `MEDIUM/HIGH`).</span>
              <span className="block mt-1">- Heure digest : heure locale (0-23) à laquelle le récap quotidien est envoyé.</span>
            </span>
          </span>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          <label className="text-sm text-gray-300 flex flex-col gap-2">
            Mode email
            <select
              value={emailMode}
              onChange={(e) =>
                onEmailModeChange(e.target.value as "instant" | "daily" | "off")
              }
              className="cc-panel rounded-[18px] px-3 py-2 focus:outline-none"
            >
              <option value="instant">Instant</option>
              <option value="daily">Digest quotidien</option>
              <option value="off">Aucun email</option>
            </select>
          </label>
          <label className="text-sm text-gray-300 flex flex-col gap-2">
            Seuil email
            <select
              value={minEmailSeverity}
              onChange={(e) =>
                onMinEmailSeverityChange(
                  e.target.value as "medium" | "high"
                )
              }
              className="cc-panel rounded-[18px] px-3 py-2 focus:outline-none"
            >
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="text-sm text-gray-300 flex flex-col gap-2">
            Heure digest (0-23)
            <input
              type="number"
              min={0}
              max={23}
              value={digestHour}
              onChange={(e) => onDigestHourChange(Number(e.target.value || 0))}
              className="cc-panel rounded-[18px] px-3 py-2 focus:outline-none"
            />
          </label>
          <div className="flex flex-col gap-2 justify-end">
            <button
              onClick={onSaveAlertSettings}
              disabled={savingAlertSettings}
              className="cc-button-primary rounded-full px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingAlertSettings ? "Sauvegarde..." : "Sauvegarder"}
            </button>
            <button
              onClick={onRunDailyDigestNow}
              disabled={runningDigest}
              className="cc-button-secondary rounded-full px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runningDigest ? "Digest..." : "Recevoir un digest test"}
            </button>
          </div>
        </div>
        {alertSettingsMessage && (
          <p className="text-sm text-indigo-200 mt-3">{alertSettingsMessage}</p>
        )}
        {digestMessage && (
          <p className="text-sm text-indigo-200 mt-1">{digestMessage}</p>
        )}
      </div>
    </section>
  );
}
