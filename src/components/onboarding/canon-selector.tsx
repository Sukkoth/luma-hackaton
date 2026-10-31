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
    <div className="mt-6 rounded-[20px] border border-black/[0.08] bg-white/70 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-medium tracking-wider text-[#888888] uppercase dark:text-[#9CA3AF]">
            SELECTED BIBLE CANON
          </span>
          <h3 className="text-[16px] font-medium text-black dark:text-white">
            {selectedCanon.name}
          </h3>
          <p className="mt-0.5 text-[12px] text-[#666666] dark:text-[#9CA3AF]">
            {selectedCanon.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCanonPicker(!showCanonPicker)}
          className="inline-flex items-center gap-1.5 rounded-[12px] border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-black shadow-2xs hover:bg-black/5 dark:border-white/15 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/15"
        >
          <SlidersHorizontal className="h-3 w-3" />
          <span>{showCanonPicker ? "Done" : "Change"}</span>
        </button>
      </div>

      {/* Collapsible Canon Options List */}
      {showCanonPicker && (
        <div className="mt-4 space-y-2 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
          <span className="text-[11px] font-normal text-[#888888] dark:text-[#A1A1AA]">
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
                  className={`flex items-start justify-between rounded-[14px] border p-3 text-left transition-all ${
                    isSelected
                      ? "border-black/30 bg-black/[0.03] dark:border-white/30 dark:bg-white/[0.06]"
                      : "border-black/[0.06] bg-white/50 hover:bg-white/90 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-black dark:text-white">
                        {canon.name}
                      </span>
                      {canon.id === "protestant" && (
                        <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.2 text-[9px] font-medium text-black">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#666666] dark:text-[#9CA3AF]">
                      {canon.subtitle}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-[#82ADD4]" />
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
