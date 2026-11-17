import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, ExternalLink, Clock, ArrowUpRight, RotateCcw } from "lucide-react";
import type { EnrichedScan } from "../types/schema";
import ScanStatusBadge from "./components/ScanStatusBadge";

interface ScanDetailDrawerProps {
  scan: EnrichedScan | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelScan?: (scanId: string) => void;
  onRerunScan?: (scan: EnrichedScan) => void;
}

export default function ScanDetailDrawer({
  scan,
  isOpen,
  onClose,
  onCancelScan,
  onRerunScan,
}: ScanDetailDrawerProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !scan) return null;

  const isRunning = scan.status === "running";
  const isCompleted = scan.status === "completed";
  const isFailed = scan.status === "failed";
  const isQueued = scan.status === "queued";

  const totalFindings =
    (scan.findingsCount.critical || 0) +
    (scan.findingsCount.high || 0) +
    (scan.findingsCount.medium || 0) +
    (scan.findingsCount.low || 0);

  // Format scan start date string
  const formattedStartTime = scan.startedAt
    ? new Date(scan.startedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "00:00:00";

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-canvas/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          aria-label="Scan Execution Profile Drawer"
          className="w-screen max-w-lg h-full bg-sidebar border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Top Drawer Header */}
          <div className="p-6 border-b border-border bg-sidebar shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* Target Name as high-contrast prominent title */}
                <h2 className="text-h2 text-heading truncate">
                  {scan.targetName || "Web Target Scan"}
                </h2>

                {/* Scan ID, Target ID & Status Indicator */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-desc">
                    #{scan.id}
                  </span>
                  <span className="font-mono text-xs text-desc flex items-center gap-1">
                    Target:{" "}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/targets?targetId=${scan.targetId}`);
                      }}
                      className="text-status-blue font-semibold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                      title={`Open Target #${scan.targetId}`}
                    >
                      <span>#{scan.targetId}</span>
                      <ArrowUpRight className="size-icon-xs shrink-0" />
                    </button>
                  </span>
                  <ScanStatusBadge
                    status={scan.status}
                    phase={scan.phase}
                    progress={scan.progress}
                  />
                </div>

                {/* Target URL prominent link */}
                {scan.targetUrl && (
                  <a
                    href={scan.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-heading hover:underline flex items-center gap-1.5 mt-2 truncate max-w-sm transition-colors group"
                  >
                    <span className="truncate">{scan.targetUrl}</span>
                    <ExternalLink className="size-icon-xs text-desc group-hover:text-heading shrink-0" />
                  </a>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="size-icon-lg rounded-lg text-desc hover:text-heading hover:bg-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close drawer"
                aria-label="Close drawer"
              >
                <X className="size-icon-md text-desc hover:text-heading" />
              </button>
            </div>

            {/* Quick Actions Header Bar */}
            <div className="flex items-center gap-2 mt-4">
              {isCompleted && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/findings?scanId=${scan.id}`);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-heading hover:bg-body active:bg-desc text-canvas text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <span>View Findings</span>
                  <ArrowUpRight className="size-icon-xs text-canvas" />
                </button>
              )}

              {isRunning && onCancelScan && (
                <button
                  type="button"
                  onClick={() => onCancelScan(scan.id)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-border hover:bg-surface text-status-red text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <X className="size-icon-xs text-status-red" />
                  <span>Stop Scan</span>
                </button>
              )}

              {(isFailed || isCompleted) && onRerunScan && (
                <button
                  type="button"
                  onClick={() => onRerunScan(scan)}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isFailed
                      ? "bg-heading hover:bg-body active:bg-desc text-canvas shadow-xs"
                      : "border border-border hover:bg-surface text-desc hover:text-heading"
                  }`}
                >
                  <RotateCcw
                    className={`size-icon-xs ${isFailed ? "text-canvas" : "text-desc"}`}
                  />
                  <span>Rerun Scan</span>
                </button>
              )}

              <div className="ml-auto flex items-center gap-1.5 text-xs text-desc font-mono">
                <Clock className="size-icon-xs text-caption" />
                <span>
                  {Math.floor(scan.durationSec / 60)}m{" "}
                  {String(scan.durationSec % 60).padStart(2, "0")}s
                </span>
              </div>
            </div>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Execution Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-heading">
                  Execution Progress
                </h3>
                <span className="font-mono text-xs font-bold text-heading">
                  {scan.progress}%
                </span>
              </div>
              <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border/40">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-status-green"
                      : isFailed
                        ? "bg-status-red"
                        : "bg-status-blue"
                  }`}
                  style={{ width: `${scan.progress}%` }}
                />
              </div>
            </div>

            {/* 2. Telemetry Overview */}
            <div>
              <h3 className="text-xs font-semibold text-heading mb-2.5">
                Telemetry Overview
              </h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-desc text-[11px]">Audit Profile</div>
                  <div className="text-xs font-semibold text-heading mt-1">
                    {scan.profile === "api_security"
                      ? "API & GraphQL"
                      : scan.profile === "quick_recon"
                        ? "Quick Recon"
                        : "OWASP Top 10"}
                  </div>
                </div>

                <div>
                  <div className="text-desc text-[11px]">Endpoints Crawled</div>
                  <div className="font-mono text-base font-bold text-heading mt-0.5">
                    {scan.scannedEndpointsCount || 0}
                  </div>
                </div>

                <div>
                  <div className="text-desc text-[11px]">Trigger Source</div>
                  <div className="text-xs font-semibold text-heading mt-1">
                    {scan.triggeredBy || "Automated Pipeline"}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Findings Discovered Summary */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold text-heading">
                  Findings Discovered
                </h3>
                <span className="font-mono text-xs font-bold text-heading">
                  {totalFindings} Total
                </span>
              </div>

              {totalFindings > 0 ? (
                <div className="flex items-center gap-6 text-xs text-desc py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-heading text-sm">
                      {scan.findingsCount.critical || 0}
                    </span>
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-heading text-sm">
                      {scan.findingsCount.high || 0}
                    </span>
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-heading text-sm">
                      {scan.findingsCount.medium || 0}
                    </span>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-heading text-sm">
                      {scan.findingsCount.low || 0}
                    </span>
                    <span>Low</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-desc py-1">
                  {isRunning
                    ? "Scan engine is currently crawling endpoints; vulnerabilities will stream live upon detection."
                    : "Clean scan. Zero security vulnerabilities identified during execution."}
                </div>
              )}
            </div>

            {/* 4. Live Crawler Log / Terminal Feed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-heading">
                  Execution Log Feed
                </h3>
                <span className="text-[10px] font-mono text-desc font-semibold px-2 py-0.5 rounded bg-surface border border-border">
                  stdout
                </span>
              </div>
              <div className="bg-canvas rounded-xl p-4 font-mono text-xs text-body leading-relaxed overflow-y-auto max-h-drawer-log border border-border space-y-2 select-text">
                <div className="flex items-start gap-2">
                  <span className="text-caption font-semibold shrink-0">
                    [{formattedStartTime}]
                  </span>
                  <span className="text-body font-medium">
                    Initializing DAST crawler engine and allocating worker
                    thread...
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-caption font-semibold shrink-0">
                    [{formattedStartTime}]
                  </span>
                  <span className="text-body font-medium">
                    Target host seed:{" "}
                    <span className="text-heading underline decoration-border font-bold">
                      {scan.targetUrl || scan.targetId}
                    </span>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-caption font-semibold shrink-0">
                    [{formattedStartTime}]
                  </span>
                  <span className="text-status-green font-semibold">
                    ✓ TLS handshake verified (TLSv1.3, Cipher AES-256-GCM)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-caption font-semibold shrink-0">
                    [{formattedStartTime}]
                  </span>
                  <span className="text-body font-medium">
                    Crawling robots.txt, sitemap.xml, OpenAPI schemas, and
                    dynamic client links...
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-caption font-semibold shrink-0">
                    [+1m 02s]
                  </span>
                  <span className="text-body font-medium">
                    Attack surface discovered: {scan.scannedEndpointsCount || 0}{" "}
                    routable endpoints mapped across REST routes.
                  </span>
                </div>
                {scan.progress > 25 && (
                  <div className="flex items-start gap-2">
                    <span className="text-caption font-semibold shrink-0">
                      [+2m 14s]
                    </span>
                    <span className="text-status-blue font-semibold">
                      Active fuzzing: injecting SQLi, NoSQL, and blind polyglot
                      vectors across parameters...
                    </span>
                  </div>
                )}
                {scan.progress > 45 && (
                  <div className="flex items-start gap-2">
                    <span className="text-caption font-semibold shrink-0">
                      [+3m 48s]
                    </span>
                    <span className="text-body font-medium">
                      Cross-Site Scripting (XSS) probe: evaluating DOM
                      reflections and CSP header boundaries.
                    </span>
                  </div>
                )}
                {scan.progress > 60 && (
                  <div className="flex items-start gap-2">
                    <span className="text-caption font-semibold shrink-0">
                      [+5m 30s]
                    </span>
                    <span className="text-status-yellow font-semibold">
                      Testing session lifecycle: token entropy, refresh token
                      reuse, and CORS origin validation.
                    </span>
                  </div>
                )}
                {scan.progress > 80 && (
                  <div className="flex items-start gap-2">
                    <span className="text-caption font-semibold shrink-0">
                      [+8m 15s]
                    </span>
                    <span className="text-body font-medium">
                      OWASP API top 10 auditing: BOLA / IDOR parameter tampering
                      evaluation completed.
                    </span>
                  </div>
                )}
                {isCompleted && (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-caption font-semibold shrink-0">
                        [+
                        {scan.durationSec > 15
                          ? `${Math.floor((scan.durationSec - 15) / 60)}m ${String((scan.durationSec - 15) % 60).padStart(2, "0")}s`
                          : "17m 45s"}
                        ]
                      </span>
                      <span className="text-body font-medium">
                        Generating structured security evidence archive and
                        aggregating findings.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 pt-1.5 border-t border-border text-status-green font-bold">
                      <span className="text-caption font-semibold shrink-0">
                        [+
                        {scan.durationSec > 0
                          ? `${Math.floor(scan.durationSec / 60)}m ${String(scan.durationSec % 60).padStart(2, "0")}s`
                          : "18m 00s"}
                        ]
                      </span>
                      <span>
                        ✓ Scan completed successfully. 100% of attack surface
                        audited ({totalFindings} findings recorded).
                      </span>
                    </div>
                  </>
                )}
                {isRunning && (
                  <div className="pt-1.5 border-t border-border text-status-blue font-semibold">
                    <span>
                      Crawler worker active — streaming real-time
                      request/response telemetry...
                    </span>
                  </div>
                )}
                {isFailed && (
                  <div className="flex items-start gap-2 pt-1.5 border-t border-border text-status-red font-bold">
                    <span className="text-caption font-semibold shrink-0">
                      [+12m 00s]
                    </span>
                    <span>
                      ✕ Error: Upstream service timeout (HTTP 503 Gateway
                      Unavailable). Audit halted.
                    </span>
                  </div>
                )}
                {isQueued && (
                  <div className="flex items-center gap-2 text-desc font-medium italic">
                    <span>
                      Task queued. Awaiting available scanner worker slot in
                      pool.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>,
    document.body
  );
}
