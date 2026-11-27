"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SettingsError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Settings page error:", error);
  }, [error]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="ui-card p-6 sm:p-8 max-w-lg mx-auto text-center space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          Unable to load settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Something went wrong while loading your settings. Please try again.
        </p>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
