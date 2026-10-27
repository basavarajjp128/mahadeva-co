"use client";

import type { ReactNode } from "react";

export function ConfirmSubmitButton({
  children,
  message,
  className = "admin-btn admin-btn--small admin-btn--danger",
}: {
  children: ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
