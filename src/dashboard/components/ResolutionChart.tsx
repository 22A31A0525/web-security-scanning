import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowUpRight, Info, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import Button from "../../ui/Button";
import type { Finding } from "../../types/schema";
import TimelineFilterPopover, {
  DEFAULT_TIMELINE_FILTER,
  TimelineFilter,
} from "./TimelineFilterPopover";

// Pull centralized palette directly from tailwind.config.js
// @ts-ignore
import tailwindConfig from "../../../tailwind.config.js";

const colors = tailwindConfig.theme.extend.colors;
const statusColors = colors.status;

export type ResolutionScope = "resolved" | "open" | "false_positive";

interface ScopeConfig {
  key: ResolutionScope;
  label: string;
  subHeaderTitle: string;
  dotClass: string;
  textClass: string;
  borderClass: string;
  bgDot: string;
  chartColor: string;
}

const SCOPE_CONFIG: Record<ResolutionScope, ScopeConfig> = {
  resolved: {
    key: "resolved",
    label: "Resolved",
    subHeaderTitle: "Resolved Findings",
    dotClass: "bg-status-green",
    textClass: "text-status-green",
    borderClass: "border-status-green",
    bgDot: statusColors.green,
    chartColor: statusColors.green,
  },
  open: {
    key: "open",
    label: "Open",
    subHeaderTitle: "Open Findings",
    dotClass: "bg-status-red",
    textClass: "text-status-red",
    borderClass: "border-status-red",
    bgDot: statusColors.red,
    chartColor: statusColors.red,
  },
  false_positive: {
    key: "false_positive",
    label: "False Pos",
    subHeaderTitle: "False Positives",
    dotClass: "bg-caption",
    textClass: "text-caption",
    borderClass: "border-caption",
    bgDot: colors.caption,
    chartColor: colors.caption,
  },
};

export default function ResolutionChart() {
  const [timeline, setTimeline] = useState<TimelineFilter>(
    DEFAULT_TIMELINE_FILTER,
  );
  const [selectedScope, setSelectedScope] = useState<ResolutionScope | null>(
    null,
  );
  const [popoverPlacement, setPopoverPlacement] = useState<
    "right" | "left" | "bottom"
  >("left");

  const containerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const findings = useAppStore((state) => state.findings);
  const targets = useAppStore((state) => state.targets);
  const targetMap = useMemo(
    () => new Map(targets.map((t) => [t.id, t])),
    [targets],
  );

  // Filter findings based on active timeline (or fallback to all if none in range)
  const timelineFindings = useMemo(() => {
    return findings;
  }, [findings]);

  // Group findings by status cleanly
  const resolvedFindings = useMemo(() => {
    return [...timelineFindings]
      .filter((f) => f.status === "resolved")
      .sort(
        (a, b) =>
          new Date(b.discoveredAt).getTime() -
          new Date(a.discoveredAt).getTime(),
      );
  }, [timelineFindings]);

  const openFindings = useMemo(() => {
    return [...timelineFindings]
      .filter((f) => f.status === "open" || f.status === "confirmed")
      .sort(
        (a, b) =>
          new Date(b.discoveredAt).getTime() -
          new Date(a.discoveredAt).getTime(),
      );
  }, [timelineFindings]);

  const falsePositiveFindings = useMemo(() => {
    return [...timelineFindings]
      .filter((f) => f.status === "false_positive")
      .sort(
        (a, b) =>
          new Date(b.discoveredAt).getTime() -
          new Date(a.discoveredAt).getTime(),
      );
  }, [timelineFindings]);

  const resolvedCount = resolvedFindings.length;
  const openCount = openFindings.length;
  const fpCount = falsePositiveFindings.length;
  const total = timelineFindings.length;
  const resolvedRate =
    total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const resolutionData = useMemo(() => {
    if (total === 0) {
      return [{ name: "Empty", value: 1, color: colors.border, key: "empty" }];
    }
    return [
      {
        name: "Resolved",
        value: resolvedCount,
        color: SCOPE_CONFIG.resolved.chartColor,
        key: "resolved",
      },
      {
        name: "Open",
        value: openCount,
        color: SCOPE_CONFIG.open.chartColor,
        key: "open",
      },
      {
        name: "False Pos",
        value: fpCount,
        color: SCOPE_CONFIG.false_positive.chartColor,
        key: "false_positive",
      },
    ];
  }, [total, resolvedCount, openCount, fpCount]);

  // Active findings list for currently selected slice
  const activeFindings: Finding[] = useMemo(() => {
    if (selectedScope === "resolved") return resolvedFindings;
    if (selectedScope === "open") return openFindings;
    if (selectedScope === "false_positive") return falsePositiveFindings;
    return [];
  }, [selectedScope, resolvedFindings, openFindings, falsePositiveFindings]);

  // Dynamic placement logic:
  // On screens < 640px, place below
  // For resolved (starts 0° to 90°, right/bottom side): place left
  // For open (spans 90° to 342°, left/top side): place right or left depending on card boundaries
  // ResolutionChart is on the far-right in lg grid: placed to the LEFT so it never clips off-screen
  const updatePlacement = (_scope: ResolutionScope) => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setPopoverPlacement("bottom");
    } else {
      // ResolutionChart is the rightmost dashboard column; placing on left points neatly to the slice
      setPopoverPlacement("left");
    }
  };

  // Pure Click-Based Selection Behavior (exact same format as AuthScopeChart and SeverityTrendChart)
  const handleSliceClick = (scope: ResolutionScope) => {
    if (selectedScope === scope) {
      setSelectedScope(null);
    } else {
      setSelectedScope(scope);
      updatePlacement(scope);
    }
  };

  const handleClose = () => {
    setSelectedScope(null);
  };

  // Close when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSelectedScope(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Tightly anchored adjacent to the donut ring (outerRadius 86px)
  const getPlacementStyles = () => {
    if (
      popoverPlacement === "bottom" ||
      (typeof window !== "undefined" && window.innerWidth < 640)
    ) {
      return {
        top: "calc(50% + 92px)",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }
    if (popoverPlacement === "right") {
      return {
        left: "calc(50% + 92px)",
        top: "50%",
        transform: "translateY(-50%)",
      };
    }
    return {
      right: "calc(50% + 92px)",
      top: "50%",
      transform: "translateY(-50%)",
    };
  };

  // Active config for current scope
  const currentConfig = selectedScope ? SCOPE_CONFIG[selectedScope] : null;

  return (
    <section
      ref={containerRef}
      aria-label="Vulnerability Resolution"
      className="col-span-1 h-[320px] max-h-[320px] bg-card border border-border rounded-2xl p-4 flex flex-col justify-between select-none relative"
    >
      {/* Top Row: Title & Timeline Selector */}
      <div className="flex items-center justify-between min-h-[32px] gap-2">
        <span className="text-sm font-bold text-heading whitespace-nowrap">
          Vulnerability Resolution
        </span>
        <TimelineFilterPopover value={timeline} onChange={setTimeline} />
      </div>

      {/* Middle: Clean Donut Chart + Anchored Tightly Beside the Ring */}
      <div className="relative w-full h-48 sm:h-52 flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={resolutionData}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={86}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              cursor="pointer"
              isAnimationActive={false}
              onClick={(entry: any) => {
                if (
                  entry &&
                  (entry.key === "resolved" ||
                    entry.key === "open" ||
                    entry.key === "false_positive")
                ) {
                  handleSliceClick(entry.key as ResolutionScope);
                }
              }}
            >
              {resolutionData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={
                    selectedScope === entry.key ? colors.heading : colors.card
                  }
                  strokeWidth={selectedScope === entry.key ? 2 : 1}
                  className="cursor-pointer transition-all duration-150 outline-none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Donut Hole Center Content - Reflects selected state cleanly or % resolved */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          {selectedScope === "resolved" ? (
            <>
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-status-green leading-none">
                {resolvedCount}
              </span>
              <span className="text-xs text-status-green font-medium leading-none mt-1">
                Resolved
              </span>
            </>
          ) : selectedScope === "open" ? (
            <>
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-status-red leading-none">
                {openCount}
              </span>
              <span className="text-xs text-status-red font-medium leading-none mt-1">
                Open
              </span>
            </>
          ) : selectedScope === "false_positive" ? (
            <>
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-caption leading-none">
                {fpCount}
              </span>
              <span className="text-xs text-caption font-medium leading-none mt-1">
                False Pos
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-heading leading-none">
                {resolvedRate}%
              </span>
              <span className="text-xs text-desc leading-none mt-1">
                Resolved Rate
              </span>
            </>
          )}
        </div>

        {/* Refined Interactive Popover Anchored on User Click */}
        {selectedScope && currentConfig && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute z-50 w-[350px] bg-card border border-border rounded-xl shadow-2xl flex flex-col select-none animate-in fade-in zoom-in-95 duration-150"
            style={getPlacementStyles()}
          >
            {/* Directional Arrow Pointer touching the slice */}
            {popoverPlacement === "right" && (
              <div
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-card border-l border-b border-border rotate-45 pointer-events-none z-10"
                aria-hidden="true"
              />
            )}
            {popoverPlacement === "left" && (
              <div
                className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-card border-r border-t border-border rotate-45 pointer-events-none z-10"
                aria-hidden="true"
              />
            )}
            {popoverPlacement === "bottom" && (
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-l border-t border-border rotate-45 pointer-events-none z-10"
                aria-hidden="true"
              />
            )}

            {/* Inner Card Container: Solid bg-card (#0d1117) */}
            <div className="w-full bg-card rounded-xl overflow-hidden flex flex-col z-20">
              {/* Header: Transparent background matching card container */}
              <div className="px-3 py-2 min-h-[38px] flex items-center justify-between bg-transparent border-b border-border text-xs gap-2">
                <span
                  className={`font-semibold text-xs truncate ${currentConfig?.textClass || "text-heading"}`}
                >
                  {currentConfig?.subHeaderTitle || "Findings"}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {activeFindings.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      aria-label="Show all findings"
                      onClick={() => navigate("/findings")}
                      className="px-2.5 py-1 text-xs border border-border shadow-sm flex items-center gap-1.5"
                    >
                      <span>Show all</span>
                      <ArrowUpRight
                        className="size-icon-xs text-desc shrink-0"
                        aria-hidden="true"
                      />
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={handleClose}
                    title="Close"
                    aria-label="Close"
                    className="p-1 rounded-lg hover:bg-surface text-desc hover:text-heading transition-colors cursor-pointer shrink-0"
                  >
                    <X className="size-icon-xs shrink-0" />
                  </button>
                </div>
              </div>

              {/* List of Findings with Clean Internal Scroll */}
              <div className="divide-y divide-border max-h-56 overflow-y-auto bg-card">
                {activeFindings.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-desc text-center bg-card">
                    No findings recorded
                  </div>
                ) : (
                  activeFindings.map((finding) => {
                    const target = targetMap.get(finding.targetId);
                    const displayUrl = target?.url || finding.location;

                    return (
                      <div
                        key={finding.id}
                        onClick={() =>
                          navigate(`/findings?findingId=${finding.id}`)
                        }
                        className="px-3 py-2 bg-transparent hover:bg-surface transition-colors duration-150 cursor-pointer"
                      >
                        {/* Row 1: Finding Title */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className="text-xs font-semibold text-heading truncate flex-1 min-w-0"
                            title={finding.title}
                          >
                            {finding.title}
                          </span>
                        </div>
                        {/* Row 2: Target URL & Target ID */}
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-desc truncate mt-0.5">
                          <span
                            className="truncate flex-1 min-w-0"
                            title={displayUrl}
                          >
                            {displayUrl}
                          </span>
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-surface border border-border text-desc shrink-0 select-none">
                            #{finding.targetId}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Clean minimal Legend with config colors & Info Hint */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-3">
          {(["resolved", "open", "false_positive"] as const).map((scopeKey) => {
            const cfg = SCOPE_CONFIG[scopeKey];
            const isSelected = selectedScope === scopeKey;
            const count =
              scopeKey === "resolved"
                ? resolvedCount
                : scopeKey === "open"
                  ? openCount
                  : fpCount;

            return (
              <button
                key={scopeKey}
                type="button"
                onClick={() => handleSliceClick(scopeKey)}
                className={`flex items-center gap-1.5 cursor-pointer truncate text-left transition-colors py-0.5 rounded ${
                  isSelected
                    ? "text-heading font-medium"
                    : "text-desc hover:text-heading"
                }`}
                title={`Click to view ${cfg.label} findings`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${cfg.dotClass} shrink-0`}
                  aria-hidden="true"
                />
                <span className="truncate">
                  {cfg.label} ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Right: Click Sectorto inspect hint (matching graph UX) */}
        <div className="flex items-center gap-1 text-[11px] text-desc font-medium shrink-0">
          <Info
            className="size-icon-xs text-desc shrink-0"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Click Sector to inspect</span>
        </div>
      </div>
    </section>
  );
}
