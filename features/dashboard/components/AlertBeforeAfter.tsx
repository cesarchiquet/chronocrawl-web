type AlertBeforeAfterProps = {
  beforeValue?: string;
  afterValue?: string;
  compact?: boolean;
  emphatic?: boolean;
};

export default function AlertBeforeAfter({
  beforeValue,
  afterValue,
  compact = false,
  emphatic = false,
}: AlertBeforeAfterProps) {
  return (
    <div className={`grid grid-cols-1 gap-3 ${compact ? "md:grid-cols-2" : ""}`}>
      <div
        className={`rounded-xl p-4 ${emphatic ? "cc-compare-card-strong" : "cc-compare-card"}`}
      >
        <p className="cc-before-card-title text-xs uppercase tracking-wide">
          Etat précédent
        </p>
        <p className="cc-compare-card-text mt-2 text-sm">
          {beforeValue || "non disponible"}
        </p>
      </div>
      <div
        className={`rounded-xl p-4 ${emphatic ? "cc-compare-card-strong" : "cc-compare-card"}`}
      >
        <p className="cc-after-card-title text-xs uppercase tracking-wide">
          Etat observé
        </p>
        <p className="cc-compare-card-text mt-2 text-sm">
          {afterValue || "non disponible"}
        </p>
      </div>
    </div>
  );
}
