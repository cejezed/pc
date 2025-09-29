// src/components/ui/LoadingState.tsx
import React from "react";

type Props = { message?: string; className?: string };

export default function LoadingState({ message = "Laden...", className }: Props) {
  return (
    <div className={`w-full py-6 text-center text-gray-500 ${className ?? ""}`}>
      {message}
    </div>
  );
}
