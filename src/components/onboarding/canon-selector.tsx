import { useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { CANON_OPTIONS } from "@/lib/schemas/onboarding";

type Props = {
  selectedCanonId: string;
  onSelectCanon: (params: { canonId: string }) => void;
};

export function CanonSelector({ selectedCanonId, onSelectCanon }: Props) {
  const [showCanonPicker, setShowCanonPicker] = useState(false);

  const selectedCanon =
    CANON_OPTIONS.find((c) => c.id === selectedCanonId) || CANON_OPTIONS[0]!;

  return (
    <div className="ui-card mt-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-foreground-dim uppercase">
            SELECTED BIBLE CANON
          </span>
          <h3 className="text-[16px] font-bold text-foreground">
            {selectedCanon.name}
          </h3>
          <p className="mt-0.5 text-[12px] text-foreground-secondary">
            {selectedCanon.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCanonPicker(!showCanonPicker)}
          className="ui-btn-secondary ui-btn-sm gap-1.5"
        >
          <SlidersHorizontal className="size-3" />
          <span>{showCanonPicker ? "Done" : "Change"}</span>
        </button>
      </div>

      {/* Collapsible Canon Options List */}
      {showCanonPicker && (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          <span className="text-[11px] font-normal text-foreground-dim">
            Choose from 4 historical Christian traditions:
          </span>
          <div className="grid gap-2">
            {CANON_OPTIONS.map((canon) => {
              const isSelected = canon.id === selectedCanonId;
              return (
                <button
                  key={canon.id}
                  type="button"
                  onClick={() => {
                    onSelectCanon({ canonId: canon.id });
                    setShowCanonPicker(false);
                  }}
                  className={`flex items-start justify-between rounded-[14px] border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary-muted"
                      : "border-border bg-surface hover:bg-surface-elevated"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-foreground">
                        {canon.name}
                      </span>
                      {canon.id === "protestant" && (
                        <span className="ui-pill text-[9px]">Default</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-foreground-secondary">
                      {canon.subtitle}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
