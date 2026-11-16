import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Globe,
  ArrowRight,
  ArrowLeft,
  Play,
  ShieldAlert,
  ChevronDown,
  Check,
  CheckCircle2,
} from "lucide-react";
import Button from "../ui/Button";
import type { ScanProfile, Scan } from "../types/schema";
import { useAppStore } from "../store/useAppStore";

interface CreateScanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  preselectedTargetId?: string | null;
  onScanLaunched?: (scan: Scan) => void;
}

export type ScanCreationStep = "target" | "profile" | "review";

const SCAN_PROFILES: Array<{
  id: ScanProfile;
  title: string;
  estTime: string;
}> = [
  {
    id: "owasp_top10",
    title: "OWASP Top 10 Audit",
    estTime: "~12 min",
  },
  {
    id: "api_security",
    title: "API Security Audit",
    estTime: "~8 min",
  },
  {
    id: "quick_recon",
    title: "Quick Recon",
    estTime: "~3 min",
  },
];

export default function CreateScanDrawer({
  isOpen,
  onClose,
  onBack,
  preselectedTargetId,
  onScanLaunched,
}: CreateScanDrawerProps) {
  const targets = useAppStore((state) => state.targets);
  const addScan = useAppStore((state) => state.addScan);

  // Step state: 'target' -> 'profile' -> 'review'
  const [currentStep, setCurrentStep] = useState<ScanCreationStep>("target");

  // Selected Target & Dropdown open state
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  const targetDropdownRef = useRef<HTMLDivElement>(null);

  // Selected Profile & Dropdown open state
  const [selectedProfile, setSelectedProfile] =
    useState<ScanProfile>("owasp_top10");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        targetDropdownRef.current &&
        !targetDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTargetDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("target");
      setSelectedTargetId(
        preselectedTargetId || (targets.length > 0 ? targets[0].id : ""),
      );
      setSelectedProfile("owasp_top10");
      setValidationError(null);
      setIsSubmitting(false);
      setIsTargetDropdownOpen(false);
      setIsProfileDropdownOpen(false);
    }
  }, [isOpen, preselectedTargetId, targets]);

  const selectedTarget = useMemo(
    () => targets.find((t) => t.id === selectedTargetId),
    [targets, selectedTargetId],
  );

  const selectedProfileObj = useMemo(
    () =>
      SCAN_PROFILES.find((p) => p.id === selectedProfile) || SCAN_PROFILES[0],
    [selectedProfile],
  );

  const isTargetFilled = Boolean(selectedTargetId);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Step transitions
  const handleNextFromTarget = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTargetId) {
      setValidationError("Please select a target.");
      return;
    }
    setValidationError(null);
    setCurrentStep("profile");
  };

  const handleNextFromProfile = () => {
    setValidationError(null);
    setCurrentStep("review");
  };

  const handleLaunch = async () => {
    if (!selectedTargetId) {
      setValidationError("No target selected.");
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);

      const createdScan = await addScan({
        targetId: selectedTargetId,
        profile: selectedProfile,
      });

      if (onScanLaunched) {
        onScanLaunched(createdScan);
      }

      onClose();
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Failed to launch scan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          aria-label="Launch Scan Drawer"
          className="w-screen max-w-lg h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Top Drawer Header with Back Navigation exactly matching CreateTargetDrawer */}
          <div className="p-6 border-b border-border bg-card shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                {(currentStep !== "target" || onBack) && (
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError(null);
                      if (currentStep === "review") {
                        setCurrentStep("profile");
                      } else if (currentStep === "profile") {
                        setCurrentStep("target");
                      } else if (currentStep === "target" && onBack) {
                        onBack();
                      }
                    }}
                    className="w-8 h-8 rounded-lg text-desc hover:text-heading hover:bg-surface flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
                    title={currentStep === "target" ? "Back" : "Previous step"}
                    aria-label={
                      currentStep === "target" ? "Back" : "Previous step"
                    }
                  >
                    <ArrowLeft className="size-icon-md text-desc hover:text-heading" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-heading">
                    Launch Security Scan
                  </h2>
                  <p className="text-xs text-desc mt-1">
                    Select target, choose scan profile, and launch automated
                    audit
                  </p>
                </div>
              </div>

              {/* Close Button matching CreateTargetDrawer */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-desc hover:text-heading hover:bg-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close drawer"
                aria-label="Close drawer"
              >
                <X className="size-icon-md text-desc hover:text-heading" />
              </button>
            </div>

            {/* Top Sections Navigation Bar - Segmented Group matching CreateTargetDrawer */}
            <div className="flex w-full rounded-xl border border-border divide-x divide-border overflow-hidden bg-card mt-4">
              {/* Step 1: Target */}
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setCurrentStep("target");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer outline-none select-none ${
                  currentStep === "target"
                    ? "bg-surface text-heading font-semibold shadow-xs"
                    : "bg-card text-desc hover:text-heading hover:bg-surface/50"
                }`}
              >
                <Globe
                  className={`size-icon-xs shrink-0 ${
                    currentStep === "target" ? "text-heading" : "text-desc"
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">Target</span>
                {!isTargetFilled && (
                  <span
                    className="text-status-red font-bold text-sm leading-none ml-0.5"
                    title="Required target not selected"
                  >
                    *
                  </span>
                )}
              </button>

              {/* Step 2: Profile */}
              <button
                type="button"
                onClick={() => {
                  if (selectedTargetId) {
                    setValidationError(null);
                    setCurrentStep("profile");
                  } else {
                    setValidationError("Please select a target first.");
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer outline-none select-none ${
                  currentStep === "profile"
                    ? "bg-surface text-heading font-semibold shadow-xs"
                    : "bg-card text-desc hover:text-heading hover:bg-surface/50"
                }`}
              >
                <ShieldAlert
                  className={`size-icon-xs shrink-0 ${
                    currentStep === "profile" ? "text-heading" : "text-desc"
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">Profile</span>
              </button>

              {/* Step 3: Review */}
              <button
                type="button"
                onClick={() => {
                  if (selectedTargetId) {
                    setValidationError(null);
                    setCurrentStep("review");
                  } else {
                    setValidationError("Please select a target first.");
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer outline-none select-none ${
                  currentStep === "review"
                    ? "bg-surface text-heading font-semibold shadow-xs"
                    : "bg-card text-desc hover:text-heading hover:bg-surface/50"
                }`}
              >
                <CheckCircle2
                  className={`size-icon-xs shrink-0 ${
                    currentStep === "review" ? "text-heading" : "text-desc"
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">Review</span>
              </button>
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-status-red/10 border border-status-red/30 text-xs text-status-red flex items-center justify-between shrink-0">
              <span>{validationError}</span>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="hover:opacity-80 cursor-pointer"
              >
                <X className="size-icon-xs" />
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* STEP 1: Select Target (Clean Filter Dropdown) */}
            {currentStep === "target" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-heading">
                    Target Asset
                  </label>
                  <p className="text-xs text-desc">
                    Choose the target endpoint to audit from your monitored
                    inventory.
                  </p>
                </div>

                {/* Target Dropdown matching FilterBar */}
                <div className="relative" ref={targetDropdownRef}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setIsTargetDropdownOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isTargetDropdownOpen}
                    className="w-full justify-between px-3.5 py-2.5 border border-border text-xs gap-2"
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="text-desc font-normal shrink-0">
                        Target:
                      </span>
                      <span className="text-heading font-semibold truncate">
                        {selectedTarget?.name || "Select a target"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`size-icon-xs text-desc transition-transform duration-200 shrink-0 ${
                        isTargetDropdownOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </Button>

                  {/* Dropdown Options Menu */}
                  {isTargetDropdownOpen && (
                    <div
                      role="listbox"
                      className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-sidebar border border-border rounded-xl p-1.5 shadow-2xl max-h-64 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                    >
                      {targets.map((t) => {
                        const isSelected = selectedTargetId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTargetId(t.id);
                              setIsTargetDropdownOpen(false);
                              if (validationError) setValidationError(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                              isSelected
                                ? "bg-surface text-heading font-semibold"
                                : "text-desc hover:text-heading hover:bg-surface/50"
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-heading font-semibold truncate">
                                  {t.name}
                                </span>
                                <span className="text-[10px] font-mono text-caption shrink-0">
                                  #{t.id}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-desc truncate mt-0.5">
                                {t.url}
                              </div>
                            </div>
                            {isSelected && (
                              <Check
                                className="size-icon-xs text-heading shrink-0"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Scan Profile (Clean Minimal Dropdown) */}
            {currentStep === "profile" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-heading">
                    Scan Profile
                  </label>
                  <p className="text-xs text-desc">
                    Select the scanning framework and audit ruleset.
                  </p>
                </div>

                {/* Profile Dropdown matching FilterBar */}
                <div className="relative" ref={profileDropdownRef}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isProfileDropdownOpen}
                    className="w-full justify-between px-3.5 py-2.5 border border-border text-xs gap-2"
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="text-desc font-normal shrink-0">
                        Profile:
                      </span>
                      <span className="text-heading font-semibold truncate">
                        {selectedProfileObj.title}
                      </span>
                    </div>
                    <ChevronDown
                      className={`size-icon-xs text-desc transition-transform duration-200 shrink-0 ${
                        isProfileDropdownOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </Button>

                  {/* Profile Dropdown Options */}
                  {isProfileDropdownOpen && (
                    <div
                      role="listbox"
                      className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-sidebar border border-border rounded-xl p-1.5 shadow-2xl space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                    >
                      {SCAN_PROFILES.map((p) => {
                        const isSelected = selectedProfile === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProfile(p.id);
                              setIsProfileDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                              isSelected
                                ? "bg-surface text-heading font-semibold"
                                : "text-desc hover:text-heading hover:bg-surface/50"
                            }`}
                          >
                            <span className="text-heading font-semibold">
                              {p.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-desc">
                                {p.estTime}
                              </span>
                              {isSelected && (
                                <Check
                                  className="size-icon-xs text-heading shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Review & Launch Confirmation */}
            {currentStep === "review" && selectedTarget && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface/50 border border-border space-y-3 text-xs">
                  <h3 className="text-xs font-bold text-heading capitalize tracking-wider">
                    Scan Specification
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-desc">Target Name:</span>
                      <span className="font-semibold text-heading">
                        {selectedTarget.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-desc">Target ID:</span>
                      <span className="font-mono text-[10px] text-desc">
                        #{selectedTarget.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-desc">Target URL:</span>
                      <span
                        className="font-mono text-desc truncate max-w-[200px]"
                        title={selectedTarget.url}
                      >
                        {selectedTarget.url}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-desc">Profile:</span>
                      <span className="font-semibold text-heading">
                        {selectedProfileObj.title}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Drawer Actions Bar matching CreateTargetDrawer */}
          <div className="p-6 border-t border-border bg-card shrink-0 flex items-center justify-end gap-2.5">
            {currentStep === "target" && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNextFromTarget}
                className="cursor-pointer"
              >
                <span>Continue to Profile</span>
                <ArrowRight className="size-icon-xs" />
              </Button>
            )}

            {currentStep === "profile" && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNextFromProfile}
                className="cursor-pointer"
              >
                <span>Review Scan</span>
                <ArrowRight className="size-icon-xs" />
              </Button>
            )}

            {currentStep === "review" && (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                onClick={handleLaunch}
                className="cursor-pointer"
              >
                <Play className="size-icon-xs fill-current" />
                <span>{isSubmitting ? "Launching..." : "Launch Scan"}</span>
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
