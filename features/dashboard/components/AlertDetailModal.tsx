"use client";

import {
  getAlertChangeSummary,
  getAlertImpactLabel,
  getAlertRecommendedAction,
} from "@/lib/alertPresentation";
import { formatAlertDateShort } from "@/lib/dateFormat";
import type { ChangeEvent } from "@/features/dashboard/types";

type AlertDetailModalProps = {
  alert: ChangeEvent;
  onClose: () => void;
};

export default function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-[#0b1025] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-indigo-200 uppercase">
              {alert.domain} - {alert.severity}
            </p>
            <p className="mt-1 text-sm text-gray-100">
              {getAlertChangeSummary(alert)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {formatAlertDateShort(alert.detected_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded border border-white/20 text-gray-200 hover:bg-white/5"
          >
            Fermer
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-300">
          <span className="text-gray-400">Impact:</span>{" "}
          {getAlertImpactLabel(alert)}
        </p>
        <p className="mt-1 text-xs text-gray-300">
          <span className="text-gray-400">Action:</span>{" "}
          {getAlertRecommendedAction(alert)}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 text-xs">
          <div className="rounded-md border border-white/10 bg-black/20 p-3">
            <p className="text-gray-400 mb-1">Avant</p>
            <p className="text-gray-200">
              {alert.metadata?.before_short || "non disponible"}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-black/20 p-3">
            <p className="text-gray-400 mb-1">Apres</p>
            <p className="text-gray-200">
              {alert.metadata?.after_short || "non disponible"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-gray-400">
          {alert.metadata?.priority_reason ||
            "Priorite calculee automatiquement."}
        </p>
      </div>
    </div>
  );
}
