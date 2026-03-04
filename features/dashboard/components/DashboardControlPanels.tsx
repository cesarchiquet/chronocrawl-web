"use client";

import {
  ANALYSIS_SEVERITY_LEVELS,
  type ChangeEvent,
} from "@/features/dashboard/types";

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
  privacyMessage: string;
  runningPrivacyExport: boolean;
  deletingAccount: boolean;
  deleteAccountConfirmText: string;
  onDeleteAccountConfirmTextChange: (value: string) => void;
  onExportPersonalData: () => void;
  onDeleteAccount: () => void;
  analysisSeverities: ChangeEvent["severity"][];
  allAnalysisSeveritiesSelected: boolean;
  analysisRunning: boolean;
  analysisMessage: string;
  newUrl: string;
  canAddUrl: boolean;
  hasActiveSubscription: boolean;
  isBypass: boolean;
  currentCount: number;
  limit: number;
  plan: string;
  message: string;
  onToggleAllAnalysisSeverities: (checked: boolean) => void;
  onToggleAnalysisSeverity: (level: ChangeEvent["severity"]) => void;
  onRunAnalysis: () => void;
  onNewUrlChange: (value: string) => void;
  onAddUrl: () => void;
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
  privacyMessage,
  runningPrivacyExport,
  deletingAccount,
  deleteAccountConfirmText,
  onDeleteAccountConfirmTextChange,
  onExportPersonalData,
  onDeleteAccount,
  analysisSeverities,
  allAnalysisSeveritiesSelected,
  analysisRunning,
  analysisMessage,
  newUrl,
  canAddUrl,
  hasActiveSubscription,
  isBypass,
  currentCount,
  limit,
  plan,
  message,
  onToggleAllAnalysisSeverities,
  onToggleAnalysisSeverity,
  onRunAnalysis,
  onNewUrlChange,
  onAddUrl,
}: DashboardControlPanelsProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 pb-24">
      <div className="rounded-xl bg-white/5 border border-white/10 p-6 mb-6">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-semibold">Preferences d&apos;alertes</h2>
          <span className="relative inline-flex items-center group">
            <button
              type="button"
              aria-label="Information sur les preferences d'alertes"
              className="h-4 w-4 rounded-full border border-white/20 text-[10px] leading-none text-gray-300 hover:text-white hover:border-white/40"
            >
              i
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 rounded-md border border-white/10 bg-[#0b1025] p-2 text-[11px] text-gray-200 shadow-lg group-hover:block group-focus-within:block">
              <span className="block">- Mode email: instant envoie chaque alerte, daily envoie un digest, off coupe les emails.</span>
              <span className="block mt-1">- Seuil email: niveau minimal envoye (HIGH uniquement, ou MEDIUM/HIGH).</span>
              <span className="block mt-1">- Heure digest: heure locale (0-23) a laquelle le recap quotidien est envoye.</span>
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
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
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
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
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
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
            />
          </label>
          <div className="flex flex-col gap-2 justify-end">
            <button
              onClick={onSaveAlertSettings}
              disabled={savingAlertSettings}
              className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingAlertSettings ? "Sauvegarde..." : "Sauvegarder"}
            </button>
            <button
              onClick={onRunDailyDigestNow}
              disabled={runningDigest}
              className="px-4 py-2 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningDigest ? "Digest..." : "Tester digest"}
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

      <div className="rounded-xl bg-white/5 border border-white/10 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Confidentialite et donnees (RGPD)
        </h2>
        <p className="text-sm text-gray-300 mb-4">
          Tu peux exporter tes donnees personnelles ou supprimer ton compte
          directement depuis le dashboard.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-medium text-gray-100 mb-1">
              Export de donnees
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Telecharge un JSON complet: URLs, alertes, snapshots, preferences
              et abonnement.
            </p>
            <button
              onClick={onExportPersonalData}
              disabled={runningPrivacyExport}
              className="px-4 py-2 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningPrivacyExport ? "Export..." : "Exporter mes donnees"}
            </button>
          </div>
          <div className="rounded-lg border border-rose-300/20 bg-rose-500/5 p-4">
            <p className="text-sm font-medium text-rose-200 mb-1">
              Suppression de compte
            </p>
            <p className="text-xs text-gray-300 mb-3">
              Action irreversible. Ton compte, tes URLs, tes alertes et
              historiques seront supprimes.
            </p>
            <input
              type="text"
              value={deleteAccountConfirmText}
              onChange={(event) => onDeleteAccountConfirmTextChange(event.target.value)}
              placeholder='Tape SUPPRIMER pour confirmer'
              className="mb-3 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-rose-300/40 text-sm"
            />
            <button
              onClick={onDeleteAccount}
              disabled={deletingAccount}
              className="px-4 py-2 rounded-lg border border-rose-300/40 text-rose-200 hover:bg-rose-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingAccount ? "Suppression..." : "Supprimer mon compte"}
            </button>
          </div>
        </div>
        {privacyMessage && (
          <p className="text-sm text-indigo-200 mt-3">{privacyMessage}</p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Details complets:{" "}
          <a href="/confidentialite" className="text-indigo-300 underline">
            Politique de confidentialite
          </a>
          .
        </p>
      </div>

      <div id="add-url-panel" className="rounded-xl bg-white/5 border border-white/10 p-6">
        <h2 className="text-xl font-semibold mb-4">Ajouter une URL</h2>
        <p className="text-gray-300 text-sm mb-4">
          Ajoute une page concurrente à surveiller. La détection des
          changements sera activée automatiquement.
        </p>
        <div className="mb-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-300">Seuil alertes:</span>
            <span className="relative inline-flex items-center group">
              <button
                type="button"
                aria-label="Information sur le seuil d'alertes"
                className="h-4 w-4 rounded-full border border-white/20 text-[10px] leading-none text-gray-300 hover:text-white hover:border-white/40"
              >
                i
              </button>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-md border border-white/10 bg-[#0b1025] p-2 text-[11px] text-gray-200 shadow-lg group-hover:block group-focus-within:block">
                Choisis les niveaux d&apos;alertes a conserver pendant
                &quot;Analyser maintenant&quot;. Seules les alertes MEDIUM et
                HIGH sont conservees.
              </span>
            </span>
            <label className="text-xs px-2 py-1 rounded border border-white/15 text-gray-200 flex items-center gap-2">
              <input
                type="checkbox"
                checked={allAnalysisSeveritiesSelected}
                onChange={(event) =>
                  onToggleAllAnalysisSeverities(event.target.checked)
                }
                disabled={analysisRunning}
              />
              Tous
            </label>
            {ANALYSIS_SEVERITY_LEVELS.map((level) => (
              <label
                key={level}
                className={`text-xs px-2 py-1 rounded border transition flex items-center gap-2 ${
                  analysisSeverities.includes(level)
                    ? "border-indigo-300/40 bg-indigo-500/15 text-indigo-100"
                    : "border-white/15 text-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={analysisSeverities.includes(level)}
                  onChange={() => onToggleAnalysisSeverity(level)}
                  disabled={analysisRunning}
                />
                {level.toUpperCase()}
              </label>
            ))}
          </div>
          <button
            id="analyze-now-btn"
            onClick={onRunAnalysis}
            className="px-4 py-2 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={(!hasActiveSubscription && !isBypass) || analysisRunning}
          >
            {analysisRunning ? "Analyse en cours..." : "Analyser maintenant"}
          </button>
          {analysisMessage && (
            <p className="text-indigo-200 text-sm mt-2">{analysisMessage}</p>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="url"
            placeholder="https://site-concurrent.com/pricing"
            className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
            value={newUrl}
            onChange={(e) => onNewUrlChange(e.target.value)}
          />
          <button
            onClick={onAddUrl}
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canAddUrl}
          >
            Ajouter
          </button>
        </div>
        {!hasActiveSubscription && !isBypass && (
          <p className="text-amber-200 text-sm mt-3">
            Ajout bloque : ton abonnement n&apos;est pas encore actif.
            Selectionne un plan depuis la landing, puis reviens ici.
          </p>
        )}
        {currentCount >= limit && (
          <p className="text-amber-200 text-sm mt-3">
            Limite atteinte : ton plan {plan.toUpperCase()} autorise {limit} URLs
            max. Supprime une URL ou upgrade ton abonnement.
          </p>
        )}
        {message && <p className="text-red-400 text-sm mt-3">{message}</p>}
      </div>
    </section>
  );
}
