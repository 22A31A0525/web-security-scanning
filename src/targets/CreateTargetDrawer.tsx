import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Globe,
  Lock,
  Unlock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import type { Target, Environment, TargetAuthConfig } from "../types/schema";

interface CreateTargetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onCreateTarget?: (targetData: Partial<Target>) => Promise<Target>;
  onUpdateTarget?: (id: string, updates: Partial<Target>) => Promise<Target>;
  targetToEdit?: Target | null;
}

export type TargetCreationStep = "general" | "auth" | "review";

export default function CreateTargetDrawer({
  isOpen,
  onClose,
  onBack,
  onCreateTarget,
  onUpdateTarget,
  targetToEdit,
}: CreateTargetDrawerProps) {
  const isEditMode = Boolean(targetToEdit);

  // Step state: 'general' (Step 1) -> 'auth' (Step 2) -> 'review' (Step 3)
  const [currentStep, setCurrentStep] = useState<TargetCreationStep>("general");

  // Form Fields
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [environment, setEnvironment] = useState<Environment>("production");
  const [description, setDescription] = useState("");

  // Authentication Fields (Bearer Token Auth)
  const [authenticated, setAuthenticated] = useState(false);
  const [bearerToken, setBearerToken] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Section completion / filled checks for top navigation indicators
  const isProfileFilled = Boolean(name.trim() && url.trim());
  const isAuthFilled = !authenticated || Boolean(bearerToken.trim());

  // Reset or pre-fill form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("general");
      if (targetToEdit) {
        setName(targetToEdit.name || "");
        setUrl(targetToEdit.url || "");
        setEnvironment(targetToEdit.environment || "production");
        setDescription(targetToEdit.description || "");
        setAuthenticated(Boolean(targetToEdit.authenticated));
        setBearerToken(
          targetToEdit.authConfig?.password ||
            (targetToEdit.authConfig as unknown as { token?: string })?.token ||
            (targetToEdit.authenticated
              ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
              : ""),
        );
      } else {
        setName("");
        setUrl("");
        setEnvironment("production");
        setDescription("");
        setAuthenticated(false);
        setBearerToken("");
      }
      setValidationError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, targetToEdit]);

  // Handle ESC key
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

  // Validate step 1 before proceeding to auth
  const handleNextFromGeneral = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setValidationError("Target name is required.");
      return;
    }
    if (!url.trim()) {
      setValidationError("Target URL is required.");
      return;
    }
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (!parsed.protocol.startsWith("http")) {
        setValidationError("Target URL must begin with http:// or https://");
        return;
      }
    } catch {
      setValidationError(
        "Please enter a valid URL (e.g. https://api.acme.com)",
      );
      return;
    }
    setValidationError(null);
    setCurrentStep("auth");
  };

  // Validate step 2 before proceeding to review
  const handleNextFromAuth = () => {
    if (authenticated && !bearerToken.trim()) {
      setValidationError(
        "Bearer authorization token is required when authentication is enabled.",
      );
      return;
    }
    setValidationError(null);
    setCurrentStep("review");
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setValidationError(null);
    try {
      let authConfig: TargetAuthConfig | undefined = undefined;
      if (authenticated) {
        authConfig = {
          enabled: true,
          authType: "bearer",
          password: bearerToken.trim(),
        };
      }

      if (isEditMode && targetToEdit && onUpdateTarget) {
        await onUpdateTarget(targetToEdit.id, {
          name: name.trim(),
          url: url.startsWith("http") ? url.trim() : `https://${url.trim()}`,
          environment,
          description: description.trim(),
          authenticated,
          authConfig,
        });
      } else if (onCreateTarget) {
        await onCreateTarget({
          name: name.trim(),
          url: url.startsWith("http") ? url.trim() : `https://${url.trim()}`,
          environment,
          description: description.trim(),
          authenticated,
          authConfig,
        });
      }

      onClose();
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Failed to save target.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          aria-label={
            isEditMode ? "Edit Target Drawer" : "Create Target Drawer"
          }
          className="w-screen max-w-lg h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Top Drawer Header */}
          <div className="p-6 border-b border-border bg-card shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                {/* Back navigation button */}
                {(currentStep !== "general" || onBack) && (
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError(null);
                      if (currentStep === "review") {
                        setCurrentStep("auth");
                      } else if (currentStep === "auth") {
                        setCurrentStep("general");
                      } else if (currentStep === "general" && onBack) {
                        onBack();
                      }
                    }}
                    className="w-8 h-8 rounded-lg text-desc hover:text-heading hover:bg-surface flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
                    title={
                      currentStep === "general"
                        ? "Back to Inspect"
                        : "Previous step"
                    }
                    aria-label={
                      currentStep === "general"
                        ? "Back to Inspect"
                        : "Previous step"
                    }
                  >
                    <ArrowLeft className="size-icon-md text-desc hover:text-heading" />
                  </button>
                )}
                <div>
                  <h2 className="text-h2 text-heading">
                    {isEditMode
                      ? `Edit Target #${targetToEdit?.id}`
                      : "Add New Target"}
                  </h2>
                  <p className="text-xs text-desc mt-1">
                    {isEditMode
                      ? "Update monitored endpoint profile and Bearer authentication"
                      : "Configure monitored web asset, endpoint scope, and Bearer authentication"}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="size-icon-lg rounded-lg text-desc hover:text-heading hover:bg-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close drawer"
                aria-label="Close drawer"
              >
                <X className="size-icon-md text-desc hover:text-heading" />
              </button>
            </div>

            {/* Top Sections Navigation Bar - Merged Segmented Group */}
            <div className="flex w-full rounded-xl border border-border divide-x divide-border overflow-hidden bg-card mt-4">
              {/* Step 1: Profile */}
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setCurrentStep("general");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer outline-none select-none ${
                  currentStep === "general"
                    ? "bg-surface text-heading font-semibold shadow-xs"
                    : "bg-card text-desc hover:text-heading hover:bg-surface/50"
                }`}
              >
                <Globe
                  className={`size-icon-xs shrink-0 ${
                    currentStep === "general" ? "text-heading" : "text-desc"
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">Profile</span>
                {!isProfileFilled && (
                  <span
                    className="text-status-red font-bold text-sm leading-none ml-0.5"
                    title="Required profile fields not filled"
                  >
                    *
                  </span>
                )}
              </button>

              {/* Step 2: Authorization */}
              <button
                type="button"
                onClick={() => {
                  if (name.trim() && url.trim()) {
                    setValidationError(null);
                    setCurrentStep("auth");
                  } else {
                    setValidationError(
                      "Please complete required Profile fields first.",
                    );
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer outline-none select-none ${
                  currentStep === "auth"
                    ? "bg-surface text-heading font-semibold shadow-xs"
                    : "bg-card text-desc hover:text-heading hover:bg-surface/50"
                }`}
              >
                <Lock
                  className={`size-icon-xs shrink-0 ${
                    currentStep === "auth" ? "text-heading" : "text-desc"
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">Authorization</span>
                {!isAuthFilled && (
                  <span
                    className="text-status-red font-bold text-sm leading-none ml-0.5"
                    title="Required Bearer token not filled"
                  >
                    *
                  </span>
                )}
              </button>

              {/* Step 3: Review */}
              <button
                type="button"
                onClick={() => {
                  if (name.trim() && url.trim() && isAuthFilled) {
                    setValidationError(null);
                    setCurrentStep("review");
                  } else if (!name.trim() || !url.trim()) {
                    setValidationError(
                      "Please complete required Profile fields first.",
                    );
                  } else {
                    setValidationError(
                      "Please complete required Authorization fields first.",
                    );
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
                {(!isProfileFilled || !isAuthFilled) && (
                  <span
                    className="text-status-red font-bold text-sm leading-none ml-0.5"
                    title="Required steps incomplete"
                  >
                    *
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Drawer Body (Form Content) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Validation Error Notice (Clean plain text, no card container) */}
            {validationError && (
              <p role="alert" className="text-xs font-medium text-status-red">
                {validationError}
              </p>
            )}

            {/* ========================================================= */}
            {/* SECTION 1: TARGET PROFILE (Name, URL, Env, Description) */}
            {/* ========================================================= */}
            {currentStep === "general" && (
              <form onSubmit={handleNextFromGeneral} className="space-y-4">
                {/* Target Name via Custom Input */}
                <div>
                  <Input
                    id="target-name"
                    label={
                      <span className="flex items-center gap-1 text-xs font-semibold text-heading">
                        Target Name{" "}
                        {!name.trim() && (
                          <span className="text-status-red">*</span>
                        )}
                      </span>
                    }
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="e.g. Acme Customer Portal"
                    className="!py-2.5 !text-xs bg-transparent"
                  />
                </div>

                {/* Target URL via Custom Input */}
                <div>
                  <Input
                    id="target-url"
                    label={
                      <span className="flex items-center gap-1 text-xs font-semibold text-heading">
                        Target URL / Endpoint{" "}
                        {!url.trim() && (
                          <span className="text-status-red">*</span>
                        )}
                      </span>
                    }
                    type="text"
                    required
                    leftIcon={<Globe className="size-icon-xs text-caption" />}
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="https://app.acme.com"
                    className="!py-2.5 !text-xs font-mono bg-transparent"
                  />
                </div>

                {/* Environment Selector - Merged Segmented Group */}
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1.5">
                    Deployment Environment
                  </label>
                  <div className="flex w-full rounded-xl border border-border divide-x divide-border overflow-hidden bg-card">
                    {(["production", "staging", "dev"] as const).map((env) => (
                      <button
                        key={env}
                        type="button"
                        onClick={() => setEnvironment(env)}
                        className={`flex-1 py-2 px-3 text-xs font-medium capitalize transition-colors cursor-pointer text-center outline-none select-none ${
                          environment === env
                            ? "bg-surface text-heading font-semibold shadow-xs"
                            : "bg-card text-desc hover:text-heading hover:bg-surface/50"
                        }`}
                      >
                        {env}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Description */}
                <div>
                  <label
                    htmlFor="target-desc"
                    className="block text-xs font-semibold text-heading mb-1.5"
                  >
                    Target Description
                  </label>
                  <textarea
                    id="target-desc"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief architectural overview or scope boundary details..."
                    style={{ backgroundColor: "transparent" }}
                    className="w-full !bg-transparent border border-border-input rounded-xl p-3 text-xs text-heading placeholder:text-placeholder focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus hover:border-desc transition-colors resize-none leading-relaxed"
                  />
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* SECTION 2: AUTHORIZATION SCOPE (Bearer Token)            */}
            {/* ========================================================= */}
            {currentStep === "auth" && (
              <div className="space-y-5">
                {/* Authentication Toggle (Clean Row, No Card Box) */}
                <div className="flex items-center justify-between gap-4 py-2 border-border">
                  <div className="flex items-center gap-2.5">
                    {authenticated ? (
                      <Lock className="size-icon-sm text-status-blue shrink-0" />
                    ) : (
                      <Unlock className="size-icon-sm text-caption shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-heading">
                        Authenticated Scan Scope
                      </div>
                      <div className="text-[11px] text-desc mt-0.5">
                        Enables crawler to audit protected routes using Bearer
                        authorization
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAuthenticated(!authenticated)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      authenticated ? "bg-heading" : "bg-surface border-border"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-canvas shadow-lg ring-0 transition duration-200 ease-in-out ${
                        authenticated ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Bearer Token Input (Visible when authenticated is toggled on) */}
                {authenticated && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div>
                      <Input
                        id="bearer-token"
                        type="password"
                        label={
                          <span className="flex items-center gap-1 text-xs font-semibold text-heading">
                            Bearer Authorization Token{" "}
                            {!bearerToken.trim() && (
                              <span className="text-status-red">*</span>
                            )}
                          </span>
                        }
                        value={bearerToken}
                        onChange={(e) => {
                          setBearerToken(e.target.value);
                          if (validationError) setValidationError(null);
                        }}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="!py-2.5 !text-xs font-mono bg-transparent"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION 3: REVIEW & ENROLL                               */}
            {/* ========================================================= */}
            {currentStep === "review" && (
              <div className="space-y-4">
                <div className="text-desc text-[11px] capitalize tracking-wider font-mono">
                  Target Configuration Summary
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-caption text-[11px]">Asset Name</div>
                      <div className="font-semibold text-heading mt-0.5">
                        {name}
                      </div>
                    </div>
                    <div>
                      <div className="text-caption text-[11px]">
                        Environment
                      </div>
                      <div className="font-semibold text-heading mt-0.5 capitalize">
                        {environment}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-caption text-[11px]">Target URL</div>
                    <div className="font-mono font-medium text-heading mt-0.5 truncate">
                      {url}
                    </div>
                  </div>

                  {description.trim() && (
                    <div>
                      <div className="text-caption text-[11px]">
                        Description
                      </div>
                      <div className="text-body mt-0.5 leading-relaxed">
                        {description.trim()}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-caption text-[11px]">
                      Authentication Scope
                    </div>
                    <div className="font-semibold text-heading mt-0.5 flex items-center gap-1.5">
                      {authenticated ? (
                        <>
                          <Lock className="size-icon-xs text-status-blue" />
                          <span>Authenticated (Bearer Token)</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="size-icon-xs text-caption" />
                          <span className="text-desc font-normal">
                            Unauthenticated (Passive / Public scope)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Drawer Actions Bar */}
          <div className="p-6 border-t border-border bg-card shrink-0 flex items-center justify-end gap-2.5">
            {currentStep === "general" && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNextFromGeneral}
                className="cursor-pointer"
              >
                <span>Continue to Auth</span>
                <ArrowRight className="size-icon-xs" />
              </Button>
            )}

            {currentStep === "auth" && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNextFromAuth}
                className="cursor-pointer"
              >
                <span>Review Target</span>
                <ArrowRight className="size-icon-xs" />
              </Button>
            )}

            {currentStep === "review" && (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="cursor-pointer"
              >
                <CheckCircle2 className="size-icon-xs" />
                <span>
                  {isSubmitting
                    ? isEditMode
                      ? "Saving..."
                      : "Enrolling..."
                    : isEditMode
                      ? "Save Changes"
                      : "Enroll Target"}
                </span>
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>,
    document.body
  );
}
