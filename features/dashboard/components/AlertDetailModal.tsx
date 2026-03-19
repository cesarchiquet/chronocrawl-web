"use client";

import {
  getAlertChangeKind,
  getAlertChangeSummary,
  getAlertDomainLabel,
  getAlertFieldLabel,
  getAlertImpactLabel,
  getAlertRecommendedAction,
} from "@/lib/alertPresentation";
import { formatAlertDateShort } from "@/lib/dateFormat";
import type { ChangeEvent } from "@/features/dashboard/types";
import AlertBeforeAfter from "@/features/dashboard/components/AlertBeforeAfter";

type AlertDetailModalProps = {
  alert: ChangeEvent;
  onClose: () => void;
};

export default function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  const quickFacts = [
    { label: "Type", value: getAlertDomainLabel(alert.domain) },
    { label: "Element", value: getAlertFieldLabel(alert.field_key) },
    { label: "Variation", value: getAlertChangeKind(alert) },
    { label: "Source", value: alert.metadata?.url || "URL indisponible" },
  ];
  const priorityNote =
    alert.metadata?.priority_reason ||
    "Priorité estimee selon le type de changement observe.";
  const groupedFieldsSummary = alert.metadata?.grouped_fields_summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_#0a0a0a_42%,_#030303_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/10 px-5 py-5 md:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-white">
                  Observation concurrente
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-gray-300">
                  {getAlertDomainLabel(alert.domain)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-gray-300">
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <p className="mt-3 text-base font-medium text-white md:text-lg">
                {getAlertChangeSummary(alert)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {formatAlertDateShort(alert.detected_at)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs text-gray-200 transition hover:bg-white/5"
            >
              Fermer
            </button>
          </div>
        </div>
        <div className="px-5 py-5 md:px-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-[11px]">
            {quickFacts.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <p className="text-gray-400">{item.label}</p>
                <p className="mt-1 break-words text-sm text-gray-100">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Ce que cela peut signaler
              </p>
              <p className="mt-2 text-sm text-gray-200">
                {getAlertImpactLabel(alert)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Vérification utile
              </p>
              <p className="mt-2 text-sm text-gray-200">
                {getAlertRecommendedAction(alert)}
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm">
            <AlertBeforeAfter
              beforeValue={alert.metadata?.before_short}
              afterValue={alert.metadata?.after_short}
              compact
            />
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Lecture de priorité
            </p>
            <p className="mt-2 text-sm text-gray-300">{priorityNote}</p>
          </div>
          {groupedFieldsSummary && (alert.metadata?.grouped_changes_count || 0) > 1 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Signaux inclus
              </p>
              <p className="mt-2 text-sm text-gray-300">{groupedFieldsSummary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
