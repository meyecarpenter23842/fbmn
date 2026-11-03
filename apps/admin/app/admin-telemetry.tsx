"use client";

import { useEffect, useRef } from "react";
import type { AdminTelemetrySection, AdminTelemetryEvent } from "../lib/admin-telemetry-policy";

// No SDK: no autocapture, session replay, cookies, persistence or text masking risk.
// Disabled unless deliberately enabled in Vercel AND server-side project key configured.
const ENABLED = process.env.NEXT_PUBLIC_FBMN_ADMIN_TELEMETRY === "1";

function send(event: AdminTelemetryEvent, section: AdminTelemetrySection) {
  if (!ENABLED || navigator.doNotTrack === "1") return;
  void fetch("/api/telemetry", {
    method: "POST", credentials: "same-origin", cache: "no-store",
    referrerPolicy: "no-referrer", keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, section })
  }).catch(() => { /* Telemetry must never interrupt Admin work. */ });
}

export default function AdminTelemetry({ section }: { section: AdminTelemetrySection }) {
  const latestSection = useRef(section);
  useEffect(() => {
    latestSection.current = section;
    send("admin_section_view", section);
  }, [section]);

  useEffect(() => {
    if (!ENABLED) return;
    let remainingErrors = 3;
    const onError = () => {
      // Neither ErrorEvent nor PromiseRejectionEvent data may leave the device.
      if (remainingErrors-- > 0) send("admin_client_exception", latestSection.current);
    };
    let remainingOperations = 12;
    const onOperationError = () => {
      if (remainingOperations-- > 0) send("admin_operation_error", latestSection.current);
    };
    window.addEventListener("fbmn-admin-operation-error", onOperationError);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    return () => {
      window.removeEventListener("fbmn-admin-operation-error", onOperationError);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, []);
  return null;
}
