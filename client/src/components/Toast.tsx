"use client";
import React, { useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function Toast({ message, type, onDismiss }: { message: string; type?: string; onDismiss?: () => void }) {
  useEffect(() => {
    if (!onDismiss) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className={`fixed top-6 right-6 z-50 rounded-md px-4 py-2 shadow ${type === "success" ? "bg-green-600 text-white" : type === "error" ? "bg-rose-600 text-white" : "bg-muted-foreground text-card-foreground"}`}>
      <div className="flex items-center gap-2">
        <span>{type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}</span>
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}
