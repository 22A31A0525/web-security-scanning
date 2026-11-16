import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Eye,
  CheckCircle2,
  AlertOctagon,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { DataTable, TableRowActions } from "../components/table";
import type { DataTableColumn } from "../components/table/types";
import { useEnrichedFindings, useAppStore } from "../store/useAppStore";
import type { EnrichedFinding } from "../types/schema";
import FindingDetailDrawer from "./FindingDetailDrawer";

export default function FindingsView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetIdParam = searchParams.get("targetId");
  const findingIdParam = searchParams.get("findingId");
  const severityParam = searchParams.get("severity");
  const statusParam = searchParams.get("status");

  const findings = useEnrichedFindings();
  const targets = useAppStore((state) => state.targets);
  const updateFindingStatus = useAppStore((state) => state.updateFindingStatus);

  // Derive active inspected finding directly from URL parameter ?findingId=...
  const activeSelectedFinding = useMemo(() => {
    if (!findingIdParam) return null;
    return findings.find((f) => f.id === findingIdParam) || null;
  }, [findings, findingIdParam]);

  const isDrawerOpen = Boolean(activeSelectedFinding);

  const handleInspectFinding = (finding: EnrichedFinding) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("findingId", finding.id);
    setSearchParams(nextParams);
  };

  const handleCloseDrawer = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("findingId");
    setSearchParams(nextParams);
  };

  // Helper functions to parse HTTP method and path from finding location
  const getFindingMethod = (location: string): string => {
    const parts = (location || "").trim().split(" ");
    return parts.length > 1 ? parts[0].toUpperCase() : "GET";
  };

  const getFindingPath = (location: string): string => {
    const parts = (location || "").trim().split(" ");
    return parts.length > 1 ? parts.slice(1).join(" ") : location;
  };

  // Local Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [targetFilters, setTargetFilters] = useState<string[]>(
    targetIdParam ? [targetIdParam] : ["all"],
  );
  const [severityFilters, setSeverityFilters] = useState<string[]>(
    severityParam ? [severityParam] : ["all"],
  );
  const [statusFilters, setStatusFilters] = useState<string[]>(
    statusParam ? [statusParam] : ["all"],
  );

  const targetFilterOptions = useMemo(() => {
    return [
      { label: "All Targets", value: "all", count: findings.length },
      ...targets
        .map((t) => ({
          label: `${t.name} (#${t.id})`,
          value: t.id,
          count: findings.filter((f) => f.targetId === t.id).length,
        }))
        .filter((opt) => opt.count > 0 || (targetFilters.includes(opt.value) && opt.value !== "all")),
    ];
  }, [targets, findings, targetFilters]);

  // Keep state in sync if URL parameters change
  useEffect(() => {
    if (targetIdParam) {
      setTargetFilters([targetIdParam]);
    } else {
      setTargetFilters(["all"]);
    }
  }, [targetIdParam]);

  useEffect(() => {
    if (severityParam) {
      setSeverityFilters([severityParam]);
    } else {
      setSeverityFilters(["all"]);
    }
  }, [severityParam]);

  useEffect(() => {
    if (statusParam) {
      setStatusFilters([statusParam]);
    } else {
      setStatusFilters(["all"]);
    }
  }, [statusParam]);
  const [methodFilters, setMethodFilters] = useState<string[]>(["all"]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [sortField, setSortField] = useState<string | null>("discoveredAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Counts for filter dropdown options
  const critCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;
  const medCount = findings.filter((f) => f.severity === "medium").length;
  const lowCount = findings.filter((f) => f.severity === "low").length;

  const openCount = findings.filter((f) => f.status === "open").length;
  const confirmedCount = findings.filter(
    (f) => f.status === "confirmed",
  ).length;
  const resolvedCount = findings.filter((f) => f.status === "resolved").length;
  const fpCount = findings.filter((f) => f.status === "false_positive").length;

  const getCount = findings.filter(
    (f) => getFindingMethod(f.location) === "GET",
  ).length;
  const postCount = findings.filter(
    (f) => getFindingMethod(f.location) === "POST",
  ).length;
  const putCount = findings.filter(
    (f) => getFindingMethod(f.location) === "PUT",
  ).length;
  const deleteCount = findings.filter(
    (f) => getFindingMethod(f.location) === "DELETE",
  ).length;

  // Filter Logic
  const filteredFindings = useMemo(() => {
    let result = [...findings];

    if (!targetFilters.includes("all") && targetFilters.length > 0) {
      result = result.filter((f) => targetFilters.includes(f.targetId));
    }

    if (!severityFilters.includes("all") && severityFilters.length > 0) {
      result = result.filter((f) => severityFilters.includes(f.severity));
    }

    if (!statusFilters.includes("all") && statusFilters.length > 0) {
      result = result.filter((f) => statusFilters.includes(f.status));
    }

    if (!methodFilters.includes("all") && methodFilters.length > 0) {
      result = result.filter((f) =>
        methodFilters.includes(getFindingMethod(f.location)),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.id.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.targetId.toLowerCase().includes(q) ||
          f.scanId.toLowerCase().includes(q) ||
          f.cwe.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q) ||
          f.targetName.toLowerCase().includes(q) ||
          Boolean(f.targetUrl?.toLowerCase().includes(q)),
      );
    }

    // Sort Logic
    if (sortField) {
      result.sort((a, b) => {
        let valA: unknown = (a as unknown as Record<string, unknown>)[
          sortField
        ];
        let valB: unknown = (b as unknown as Record<string, unknown>)[
          sortField
        ];

        if (sortField === "discoveredAt") {
          valA = new Date(a.discoveredAt || 0).getTime();
          valB = new Date(b.discoveredAt || 0).getTime();
        }

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA || "").toLowerCase();
        const strB = String(valB || "").toLowerCase();
        return sortDirection === "asc"
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [
    findings,
    severityFilters,
    statusFilters,
    searchQuery,
    sortField,
    sortDirection,
  ]);

  const pagedFindings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFindings.slice(start, start + pageSize);
  }, [filteredFindings, currentPage, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Column Schema for Findings
  const columns: DataTableColumn<EnrichedFinding>[] = [
    {
      id: "id",
      header: "ID",
      width: "100px",
      sortable: true,
      cell: (finding) => (
        <button
          type="button"
          onClick={() => handleInspectFinding(finding)}
          className="font-mono text-xs font-semibold text-status-blue hover:text-heading hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors group text-left"
          title={`Finding #${finding.id}`}
        >
          <span>#{finding.id}</span>
          <ArrowUpRight className="size-icon-xs opacity-0 group-hover:opacity-100 transition-opacity text-status-blue shrink-0" />
        </button>
      ),
    },
    {
      id: "targetId",
      header: "Target ID",
      width: "110px",
      sortable: true,
      cell: (finding) => (
        <button
          type="button"
          onClick={() => navigate(`/targets?targetId=${finding.targetId}`)}
          className="font-mono text-xs font-semibold text-status-blue hover:text-heading hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors group text-left"
          title={`Target #${finding.targetId} (${finding.targetName})`}
        >
          <span>#{finding.targetId}</span>
          <ArrowUpRight className="size-icon-xs opacity-0 group-hover:opacity-100 transition-opacity text-status-blue shrink-0" />
        </button>
      ),
    },
    {
      id: "scanId",
      header: "Scan ID",
      width: "105px",
      sortable: true,
      cell: (finding) => (
        <button
          type="button"
          onClick={() => navigate(`/scans?scanId=${finding.scanId}`)}
          className="font-mono text-xs font-semibold text-status-blue hover:text-heading hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors group text-left"
          title={`Open scan #${finding.scanId}`}
        >
          <span>#{finding.scanId}</span>
          <ArrowUpRight className="size-icon-xs opacity-0 group-hover:opacity-100 transition-opacity text-status-blue shrink-0" />
        </button>
      ),
    },
    {
      id: "severity",
      header: "Severity",
      width: "100px",
      sortable: true,
      cell: (finding) => {
        const textColor =
          finding.severity === "critical"
            ? "text-status-red"
            : finding.severity === "high"
              ? "text-status-orange"
              : finding.severity === "medium"
                ? "text-status-yellow"
                : "text-status-blue";

        const label =
          finding.severity === "critical"
            ? "Critical"
            : finding.severity === "high"
              ? "High"
              : finding.severity === "medium"
                ? "Medium"
                : "Low";

        return (
          <span className={`text-xs font-semibold capitalize ${textColor}`}>
            {label}
          </span>
        );
      },
    },
    {
      id: "title",
      header: "Vulnerability Title",
      width: "230px",
      minWidth: "200px",
      sortable: true,
      cell: (finding) => (
        <span
          className="text-body text-xs font-medium truncate block w-full"
          title={finding.title}
        >
          {finding.title}
        </span>
      ),
    },
    {
      id: "endpoint",
      header: "Endpoint",
      width: "230px",
      minWidth: "190px",
      sortable: true,
      cell: (finding) => {
        const method = getFindingMethod(finding.location);
        const path = getFindingPath(finding.location);

        return (
          <div
            className="flex items-center gap-2 min-w-0"
            title={finding.location}
          >
            <span className="font-mono text-xs font-semibold shrink-0 text-desc">
              {method}
            </span>
            <span className="font-mono text-xs text-heading font-medium truncate">
              {path}
            </span>
          </div>
        );
      },
    },
    {
      id: "cwe",
      header: "CWE",
      width: "90px",
      sortable: true,
      cell: (finding) => (
        <span className="font-mono text-desc text-xs">{finding.cwe}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      width: "105px",
      sortable: true,
      cell: (finding) => {
        const statusLabels: Record<string, string> = {
          open: "Open",
          confirmed: "Confirmed",
          resolved: "Resolved",
          false_positive: "Accepted (FP)",
        };
        return (
          <span className="text-xs text-desc font-medium">
            {statusLabels[finding.status] || finding.status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      width: "80px",
      align: "center",
      cell: (finding) => (
        <TableRowActions
          actions={[
            {
              label: "Inspect",
              icon: <Eye className="size-icon-xs text-desc" />,
              onClick: () => handleInspectFinding(finding),
            },
            {
              label: "Confirm Issue",
              icon: (
                <AlertOctagon className="size-icon-xs text-status-orange" />
              ),
              onClick: () => updateFindingStatus(finding.id, "confirmed"),
            },
            {
              label: "Mark Resolved",
              icon: <CheckCircle2 className="size-icon-xs text-status-green" />,
              onClick: () => updateFindingStatus(finding.id, "resolved"),
            },
            {
              label: "False Positive",
              icon: <Trash2 className="size-icon-xs text-status-red" />,
              danger: true,
              onClick: () => updateFindingStatus(finding.id, "false_positive"),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Centralized High-Density Data Table */}
      <DataTable<EnrichedFinding>
        columns={columns}
        data={pagedFindings}
        keyExtractor={(item) => item.id}
        maxHeight="max-h-table-view"
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search findings by ID, title, target ID, scan ID, or CWE..."
        totalRecords={findings.length}
        recordsLabel="findings"
        filters={[
          {
            id: "target",
            label: "Target Asset",
            selectedValues: targetFilters,
            onChange: (val) => {
              const selected = Array.isArray(val) ? val : [val];
              setTargetFilters(selected);
              const nextParams = new URLSearchParams(searchParams);
              const lastPicked = selected.find((v) => v !== "all");
              if (lastPicked && !selected.includes("all") && selected.length === 1) {
                nextParams.set("targetId", lastPicked);
              } else {
                nextParams.delete("targetId");
              }
              setSearchParams(nextParams);
              setCurrentPage(1);
            },
            options: targetFilterOptions,
          },
          {
            id: "method",
            label: "Method",
            selectedValues: methodFilters,
            onChange: (val) => {
              setMethodFilters(Array.isArray(val) ? val : [val]);
              setCurrentPage(1);
            },
            options: [
              { label: "All Methods", value: "all", count: findings.length },
              { label: "GET", value: "GET", count: getCount },
              { label: "POST", value: "POST", count: postCount },
              { label: "PUT", value: "PUT", count: putCount },
              { label: "DELETE", value: "DELETE", count: deleteCount },
            ],
          },
          {
            id: "severity",
            label: "Severity",
            selectedValues: severityFilters,
            onChange: (val) => {
              const selected = Array.isArray(val) ? val : [val];
              setSeverityFilters(selected);
              const nextParams = new URLSearchParams(searchParams);
              const lastPicked = selected.find((v) => v !== "all");
              if (lastPicked && !selected.includes("all") && selected.length === 1) {
                nextParams.set("severity", lastPicked);
              } else {
                nextParams.delete("severity");
              }
              setSearchParams(nextParams);
              setCurrentPage(1);
            },
            options: [
              { label: "All Severities", value: "all", count: findings.length },
              { label: "Critical", value: "critical", count: critCount },
              { label: "High", value: "high", count: highCount },
              { label: "Medium", value: "medium", count: medCount },
              { label: "Low", value: "low", count: lowCount },
            ],
          },
          {
            id: "status",
            label: "Status",
            selectedValues: statusFilters,
            onChange: (val) => {
              const selected = Array.isArray(val) ? val : [val];
              setStatusFilters(selected);
              const nextParams = new URLSearchParams(searchParams);
              const lastPicked = selected.find((v) => v !== "all");
              if (lastPicked && !selected.includes("all") && selected.length === 1) {
                nextParams.set("status", lastPicked);
              } else {
                nextParams.delete("status");
              }
              setSearchParams(nextParams);
              setCurrentPage(1);
            },
            options: [
              { label: "All Statuses", value: "all", count: findings.length },
              { label: "Open", value: "open", count: openCount },
              { label: "Confirmed", value: "confirmed", count: confirmedCount },
              { label: "Resolved", value: "resolved", count: resolvedCount },
              {
                label: "False Positive",
                value: "false_positive",
                count: fpCount,
              },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearchQuery("");
          setTargetFilters(["all"]);
          setSeverityFilters(["all"]);
          setStatusFilters(["all"]);
          setMethodFilters(["all"]);
          setSearchParams({});
          setCurrentPage(1);
        }}
        pagination={{
          currentPage,
          pageSize: 10,
          totalItems: filteredFindings.length,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Slide-over Inspection Drawer for Finding */}
      <FindingDetailDrawer
        finding={activeSelectedFinding}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onUpdateStatus={updateFindingStatus}
      />
    </div>
  );
}
