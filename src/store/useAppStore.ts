import { create } from 'zustand'
import { themeColors } from '../theme/tokens'
import type {
  Target,
  Scan,
  Finding,
  Report,
  FindingStatus,
  ScanStatus,
  ScannerSettings,
  TargetWithTelemetry,
  EnrichedScan,
  EnrichedFinding,
  EnrichedReport,
  LiveTaskItem,
  SeverityStats,
  SeverityTrendPoint,
  AuthScopeSlice,
  TargetStackedFinding,
  OwaspStackedCategory,
  ResolutionStatusSlice,
  DashboardTimeline,
  DashboardTimelineOptions,
} from '../types/schema'
import { api, STORAGE_KEYS, loadFromStorage, saveToStorage } from '../services/api'
import {
  mockTargets,
  mockScans,
  mockFindings,
  mockReports,
  mockSeverityTrends,
  defaultScannerSettings,
} from '../data/mockData'

export interface AppState {
  targets: Target[]
  scans: Scan[]
  findings: Finding[]
  reports: Report[]
  settings: ScannerSettings
  sidebarCollapsed: boolean
  isLoading: boolean
  error: string | null

  // Sidebar Actions
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void

  // Lifecycle
  initialize: () => Promise<void>

  // Targets Actions
  setTargets: (targets: Target[]) => void
  addTarget: (targetData: Partial<Target>) => Promise<Target>
  updateTarget: (id: string, updates: Partial<Target>) => Promise<Target>
  deleteTarget: (id: string) => Promise<boolean>

  // Scans Actions
  setScans: (scans: Scan[]) => void
  addScan: (scanData: Partial<Scan> & { targetId: string }) => Promise<Scan>
  updateScanProgress: (id: string, progress: number, status?: ScanStatus) => Promise<void>
  cancelScan: (id: string) => Promise<void>

  // Findings Actions
  setFindings: (findings: Finding[]) => void
  updateFindingStatus: (id: string, status: FindingStatus) => Promise<Finding>
  bulkUpdateFindingStatus: (ids: string[], status: FindingStatus) => Promise<Finding[]>

  // Reports Actions
  setReports: (reports: Report[]) => void
  addReport: (reportData: Partial<Report>) => Promise<Report>
  deleteReport: (id: string) => Promise<boolean>

  // Settings Actions
  updateSettings: (updates: Partial<ScannerSettings>) => void

  // Demo Data Reset
  resetAllDemoData: () => void

  // Auth Session Lifecycle
  login: () => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initialize with persisted storage or initial API fallback
  targets: loadFromStorage(STORAGE_KEYS.targets, mockTargets),
  scans: loadFromStorage(STORAGE_KEYS.scans, mockScans),
  findings: loadFromStorage(STORAGE_KEYS.findings, mockFindings),
  reports: loadFromStorage(STORAGE_KEYS.reports, mockReports),
  settings: loadFromStorage(STORAGE_KEYS.settings, defaultScannerSettings),
  sidebarCollapsed: loadFromStorage(STORAGE_KEYS.sidebar, false),
  isLoading: false,
  error: null,

  setSidebarCollapsed: (collapsed) => {
    saveToStorage(STORAGE_KEYS.sidebar, collapsed)
    set({ sidebarCollapsed: collapsed })
  },
  toggleSidebarCollapsed: () => {
    set((state) => {
      const next = !state.sidebarCollapsed
      saveToStorage(STORAGE_KEYS.sidebar, next)
      return { sidebarCollapsed: next }
    })
  },

  initialize: async () => {
    set({ isLoading: true, error: null })
    try {
      const [targets, scans, findings, reports] = await Promise.all([
        api.getTargets(),
        api.getScans(),
        api.getFindings(),
        api.getReports(),
      ])
      set({ targets, scans, findings, reports, isLoading: false })
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch API data',
        isLoading: false,
      })
    }
  },

  // Targets
  setTargets: (targets) => {
    saveToStorage(STORAGE_KEYS.targets, targets)
    set({ targets })
  },

  addTarget: async (targetData) => {
    const newTarget = await api.createTarget(targetData)
    set((state) => ({ targets: [newTarget, ...state.targets] }))
    return newTarget
  },

  updateTarget: async (id, updates) => {
    const updated = await api.updateTarget(id, updates)
    set((state) => ({
      targets: state.targets.map((t) => (t.id === id ? updated : t)),
    }))
    return updated
  },

  deleteTarget: async (id) => {
    await api.deleteTarget(id)
    set((state) => {
      const nextTargets = state.targets.filter((t) => t.id !== id)
      const nextScans = state.scans.filter((s) => s.targetId !== id)
      const nextFindings = state.findings.filter((f) => f.targetId !== id)
      saveToStorage(STORAGE_KEYS.targets, nextTargets)
      saveToStorage(STORAGE_KEYS.scans, nextScans)
      saveToStorage(STORAGE_KEYS.findings, nextFindings)
      return {
        targets: nextTargets,
        scans: nextScans,
        findings: nextFindings,
      }
    })
    return true
  },

  // Scans
  setScans: (scans) => {
    saveToStorage(STORAGE_KEYS.scans, scans)
    set({ scans })
  },

  addScan: async (scanData) => {
    const newScan = await api.createScan(scanData)
    set((state) => {
      const nextScans = [newScan, ...state.scans]
      const nextTargets = state.targets.map((t) =>
        t.id === scanData.targetId
          ? { ...t, lastScannedAt: newScan.startedAt }
          : t
      )
      saveToStorage(STORAGE_KEYS.targets, nextTargets)
      return {
        scans: nextScans,
        targets: nextTargets,
      }
    })
    return newScan
  },

  updateScanProgress: async (id, progress, status) => {
    const updates: Partial<Scan> = { progress }
    if (status) updates.status = status
    if (progress >= 100) {
      updates.status = 'completed'
      updates.completedAt = new Date().toISOString()
    }
    const updatedScan = await api.updateScan(id, updates)
    set((state) => {
      const nextScans = state.scans.map((s) => (s.id === id ? { ...s, ...updatedScan, ...updates } : s))
      saveToStorage(STORAGE_KEYS.scans, nextScans)
      return { scans: nextScans }
    })
  },

  cancelScan: async (id) => {
    const updated = await api.cancelScan(id)
    set((state) => {
      const nextScans = state.scans.map((s) =>
        s.id === id ? { ...s, ...updated } : s
      )
      saveToStorage(STORAGE_KEYS.scans, nextScans)
      return { scans: nextScans }
    })
  },

  // Findings
  setFindings: (findings) => {
    saveToStorage(STORAGE_KEYS.findings, findings)
    set({ findings })
  },

  updateFindingStatus: async (id, status) => {
    const updated = await api.updateFindingStatus(id, status)
    set((state) => {
      const newFindings = state.findings.map((f) => (f.id === id ? updated : f))
      const updatedFinding = newFindings.find((f) => f.id === id)
      let newTargets = state.targets
      if (updatedFinding) {
        const targetFindings = newFindings.filter(
          (f) =>
            f.targetId === updatedFinding.targetId &&
            (f.status === 'open' || f.status === 'confirmed')
        )
        newTargets = state.targets.map((t) =>
          t.id === updatedFinding.targetId
            ? { ...t, openFindings: targetFindings.length }
            : t
        )
        saveToStorage(STORAGE_KEYS.targets, newTargets)
      }
      return { findings: newFindings, targets: newTargets }
    })
    return updated
  },

  bulkUpdateFindingStatus: async (ids, status) => {
    const updatedList = await api.bulkUpdateFindingStatus(ids, status)
    set((state) => {
      const updatedMap = new Map(updatedList.map((u) => [u.id, u]))
      const newFindings = state.findings.map((f) => updatedMap.get(f.id) || f)
      const newTargets = state.targets.map((t) => {
        const count = newFindings.filter(
          (f) => f.targetId === t.id && (f.status === 'open' || f.status === 'confirmed')
        ).length
        return { ...t, openFindings: count }
      })
      saveToStorage(STORAGE_KEYS.targets, newTargets)
      return { findings: newFindings, targets: newTargets }
    })
    return updatedList
  },

  // Reports
  setReports: (reports) => {
    saveToStorage(STORAGE_KEYS.reports, reports)
    set({ reports })
  },

  addReport: async (reportData) => {
    const newReport = await api.createReport(reportData)
    set((state) => ({ reports: [newReport, ...state.reports] }))
    return newReport
  },

  deleteReport: async (id) => {
    await api.deleteReport(id)
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    }))
    return true
  },

  // Settings
  updateSettings: (updates) =>
    set((state) => {
      const nextSettings = { ...state.settings, ...updates }
      saveToStorage(STORAGE_KEYS.settings, nextSettings)
      return { settings: nextSettings }
    }),

  // Demo Data Reset
  resetAllDemoData: () => {
    const fresh = api.resetToDemoData()
    saveToStorage(STORAGE_KEYS.settings, defaultScannerSettings)
    set({
      targets: fresh.targets,
      scans: fresh.scans,
      findings: fresh.findings,
      reports: fresh.reports,
      settings: defaultScannerSettings,
    })
  },

  // Auth Session Lifecycle
  login: () => {
    const fresh = api.loginSession()
    saveToStorage(STORAGE_KEYS.settings, defaultScannerSettings)
    set({
      targets: fresh.targets,
      scans: fresh.scans,
      findings: fresh.findings,
      reports: fresh.reports,
      settings: defaultScannerSettings,
    })
  },

  logout: () => {
    api.logoutSession()
    set({
      targets: [],
      scans: [],
      findings: [],
      reports: [],
      sidebarCollapsed: false,
      settings: defaultScannerSettings,
      error: null,
      isLoading: false,
    })
  },
}))

// ==========================================
// Centralized Selectors & Computation Hooks
// ==========================================

/**
 * Returns targets enriched with live telemetry dynamically computed from relational findings and scans
 */
export function useEnrichedTargets(): TargetWithTelemetry[] {
  const targets = useAppStore((state) => state.targets)
  const scans = useAppStore((state) => state.scans)
  const findings = useAppStore((state) => state.findings)

  return targets.map((t) => {
    const targetFindings = findings.filter((f) => f.targetId === t.id)
    const activeFindings = targetFindings.filter(
      (f) => f.status === 'open' || f.status === 'confirmed'
    )
    const targetScans = scans
      .filter((s) => s.targetId === t.id)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())

    const severityCounts = {
      critical: activeFindings.filter((f) => f.severity === 'critical').length,
      high: activeFindings.filter((f) => f.severity === 'high').length,
      medium: activeFindings.filter((f) => f.severity === 'medium').length,
      low: activeFindings.filter((f) => f.severity === 'low').length,
    }

    const calculatedRiskScore = Math.min(
      9.8,
      Math.max(
        1.0,
        Math.round(
          (severityCounts.critical * 3.2 +
            severityCounts.high * 1.8 +
            severityCounts.medium * 0.9 +
            severityCounts.low * 0.3) *
            10
        ) / 10
      )
    )

    const riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low' =
      severityCounts.critical > 0
        ? 'Critical'
        : severityCounts.high > 0
        ? 'High'
        : severityCounts.medium > 0
        ? 'Moderate'
        : 'Low'

    const lastScan = targetScans[0]
    let lastScanStatus: 'Completed' | 'Running' | 'Failed' | 'Queued' = 'Completed'
    if (lastScan) {
      if (lastScan.status === 'running') lastScanStatus = 'Running'
      else if (lastScan.status === 'failed') lastScanStatus = 'Failed'
      else if (lastScan.status === 'queued') lastScanStatus = 'Queued'
    }

    const durationMin = lastScan ? Math.round(lastScan.durationSec / 60) : 0
    const durationSec = lastScan ? lastScan.durationSec % 60 : 0
    const lastScanDuration = lastScan
      ? `${durationMin}m ${String(durationSec).padStart(2, '0')}s`
      : '--'

    const topVulnerabilities = activeFindings.slice(0, 5).map((f) => ({
      id: f.id,
      title: f.title,
      severity: f.severity as 'critical' | 'high' | 'medium' | 'low',
      cwe: f.cwe,
      location: f.location,
    }))

    const recentScans = targetScans.slice(0, 3).map((s) => ({
      id: s.id,
      status: s.status as 'completed' | 'running' | 'failed' | 'queued',
      duration: `${Math.round(s.durationSec / 60)}m ${s.durationSec % 60}s`,
      findingsFound:
        s.findingsCount.critical +
        s.findingsCount.high +
        s.findingsCount.medium +
        s.findingsCount.low,
      date: new Date(s.startedAt).toLocaleDateString(),
    }))

    const completedTargetScan = targetScans.find((s) => (s.scannedEndpointsCount || 0) > 0)
    const endpointsCount = completedTargetScan
      ? completedTargetScan.scannedEndpointsCount || 0
      : lastScan?.scannedEndpointsCount || 0

    return {
      ...t,
      openFindings: activeFindings.length,
      endpointsCount,
      riskScoreNumber: calculatedRiskScore,
      riskLevel,
      severityCounts,
      lastScanStatus,
      lastScanDuration,
      topVulnerabilities,
      recentScans,
    }
  })
}

/**
 * Returns scans enriched with target details and phase information
 */
export function useEnrichedScans(): EnrichedScan[] {
  const scans = useAppStore((state) => state.scans)
  const targets = useAppStore((state) => state.targets)
  const findings = useAppStore((state) => state.findings)

  const targetMap = new Map<string, Target>()
  targets.forEach((t) => targetMap.set(t.id, t))

  return scans.map((s) => {
    const tgt = targetMap.get(s.targetId)
    let phase = 'Idle'
    if (s.status === 'running') phase = s.progress > 50 ? 'Auditing' : 'Crawling'
    else if (s.status === 'completed') phase = 'Finalized'
    else if (s.status === 'failed') phase = 'Aborted'
    else if (s.status === 'queued') phase = 'Queued'

    // Compute live findings counts dynamically from findings store
    const scanFindings = findings.filter((f) => f.scanId === s.id)
    const liveFindingsCount = scanFindings.length > 0 ? {
      critical: scanFindings.filter((f) => f.severity === 'critical').length,
      high: scanFindings.filter((f) => f.severity === 'high').length,
      medium: scanFindings.filter((f) => f.severity === 'medium').length,
      low: scanFindings.filter((f) => f.severity === 'low').length,
      info: scanFindings.filter((f) => f.severity === 'info').length,
    } : s.findingsCount

    return {
      ...s,
      findingsCount: liveFindingsCount,
      targetName: tgt?.name || 'Unknown Target',
      targetUrl: tgt?.url || '--',
      environment: tgt?.environment || 'production',
      phase,
    }
  })
}

/**
 * Returns findings enriched with target asset names, URLs, and environments
 */
export function useEnrichedFindings(): EnrichedFinding[] {
  const findings = useAppStore((state) => state.findings)
  const targets = useAppStore((state) => state.targets)

  const targetMap = new Map<string, Target>()
  targets.forEach((t) => targetMap.set(t.id, t))

  return findings.map((f) => {
    const tgt = targetMap.get(f.targetId)
    return {
      ...f,
      targetName: tgt?.name || 'Unknown Target',
      targetUrl: tgt?.url || '--',
      targetEnv: tgt?.environment || 'production',
    }
  })
}

/**
 * Returns reports enriched with human-readable titles and security frameworks
 */
export function useEnrichedReports(): EnrichedReport[] {
  const reports = useAppStore((state) => state.reports)

  return reports.map((r) => {
    const fallbackMock = mockReports.find((m) => m.id === r.id)
    return {
      ...r,
      title: r.title || fallbackMock?.title || `${r.target} — Security Evaluation`,
      framework: r.framework || fallbackMock?.framework || 'OWASP Top 10 Audit',
    }
  })
}

/**
 * Returns live running task items for Dashboard telemetry widgets and Header pill
 */
export function useLiveTasks(): LiveTaskItem[] {
  const scans = useAppStore((state) => state.scans)
  const targets = useAppStore((state) => state.targets)

  const targetMap = new Map<string, Target>()
  targets.forEach((t) => targetMap.set(t.id, t))

  const activeScans = scans
    .filter((s) => s.status === 'running' || s.status === 'queued')
    .sort((a, b) => {
      if (a.status === 'running' && b.status !== 'running') return -1
      if (a.status !== 'running' && b.status === 'running') return 1
      return 0
    })

  return activeScans.map((s) => {
    const tgt = targetMap.get(s.targetId)
    const elapsedMin = Math.max(1, Math.floor(s.durationSec / 60))
    const elapsedSec = s.durationSec % 60
    const isQueued = s.status === 'queued'

    let eta = isQueued ? 'Awaiting slot' : '~4m remaining'
    if (!isQueued && s.progress > 0 && s.progress < 100) {
      const totalEstSec = (s.durationSec / s.progress) * 100
      const remSec = Math.max(0, Math.round(totalEstSec - s.durationSec))
      const remMin = Math.floor(remSec / 60)
      eta = remMin > 0 ? `~${remMin}m remaining` : '< 1m remaining'
    }

    const profileLabel =
      s.profile === 'api_security'
        ? 'API Security'
        : s.profile === 'quick_recon'
        ? 'Quick Recon'
        : 'OWASP Top 10'

    let currentActivity = ''
    if (isQueued) {
      currentActivity = 'Position #1 in queue • Awaiting engine worker slot'
    } else if (s.progress > 50) {
      currentActivity =
        s.profile === 'api_security'
          ? 'POST /api/v2/checkout • Testing SQL Injection on "token"'
          : 'POST /auth/login • Fuzzing parameter "redirect_uri" (SSRF)'
    } else {
      currentActivity =
        s.profile === 'api_security'
          ? 'GET /openapi.json • Parsing GraphQL & REST endpoints'
          : 'GET /dashboard • DOM crawling & form discovery'
    }

    const phase: 'Auditing' | 'Crawling' | 'Fuzzing' | 'Queued' = isQueued
      ? 'Queued'
      : s.progress > 50
      ? 'Auditing'
      : 'Crawling'

    return {
      id: s.id,
      taskId: `#${s.id}`,
      targetName: tgt?.name || 'Web Target Scan',
      targetUrl: tgt ? tgt.url.replace(/^https?:\/\//, '') : '--',
      profile: profileLabel,
      status: s.status as 'running' | 'queued',
      phase,
      currentActivity,
      progress: s.progress,
      elapsed: isQueued ? 'In Queue' : `${elapsedMin}m ${String(elapsedSec).padStart(2, '0')}s`,
      eta,
      endpoints: s.scannedEndpointsCount ?? 0,
      findingsCount: {
        critical: s.findingsCount?.critical ?? 0,
        high: s.findingsCount?.high ?? 0,
        medium: s.findingsCount?.medium ?? 0,
        low: s.findingsCount?.low ?? 0,
        info: s.findingsCount?.info ?? 0,
      },
    }
  })
}

/**
 * Returns dynamic executive dashboard telemetry and chart distributions
 */
export function useDashboardAnalytics(
  timelineOrOptions: DashboardTimeline | DashboardTimelineOptions = '30D'
) {
  const timeline: DashboardTimeline =
    typeof timelineOrOptions === 'string'
      ? timelineOrOptions
      : timelineOrOptions.trendTimeline || '30D'

  const targets = useAppStore((state) => state.targets)
  const scans = useAppStore((state) => state.scans)
  const findings = useAppStore((state) => state.findings)

  const activeFindings = findings.filter(
    (f) => f.status === 'open' || f.status === 'confirmed'
  )

  const refDate = new Date()

  const targetTimelineFindings = activeFindings
  const owaspTimelineFindings = activeFindings

  // 1. Severity Stats
  const severityStats: SeverityStats = {
    critical: activeFindings.filter((f) => f.severity === 'critical').length,
    high: activeFindings.filter((f) => f.severity === 'high').length,
    medium: activeFindings.filter((f) => f.severity === 'medium').length,
    low: activeFindings.filter((f) => f.severity === 'low').length,
  }

  // 2. Trend Data
  const baseTrends =
    (mockSeverityTrends as Record<string, SeverityTrendPoint[]>)[timeline] ||
    mockSeverityTrends['30D']
  const trendData: SeverityTrendPoint[] = baseTrends.map((point, idx) => {
    if (idx === baseTrends.length - 1) {
      return { ...point, ...severityStats }
    }
    return point
  })

  // 3. Authentication Scope Distribution (Directly matches targets in AuthScopeChart)
  const authTargetsCount = targets.filter((t) => t.authenticated).length
  const unauthTargetsCount = targets.length - authTargetsCount
  const authScopeData: AuthScopeSlice[] = [
    { name: 'Authenticated', value: authTargetsCount, color: themeColors.scope.authenticated },
    { name: 'Unauthenticated', value: unauthTargetsCount, color: themeColors.scope.unauthenticated },
  ]

  // 4. Target Stacked Findings
  const targetStackedData: TargetStackedFinding[] = targets
    .map((t) => {
      const tf = targetTimelineFindings.filter((f) => f.targetId === t.id)
      const crit = tf.filter((f) => f.severity === 'critical').length
      const high = tf.filter((f) => f.severity === 'high').length
      const med = tf.filter((f) => f.severity === 'medium').length
      const low = tf.filter((f) => f.severity === 'low').length
      return {
        targetId: t.id,
        targetName: t.name,
        url: t.url,
        environment: t.environment,
        riskScore: t.riskScore,
        critical: crit,
        high,
        medium: med,
        low,
        total: crit + high + med + low,
      }
    })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // 5. Official OWASP Top 10 Stacked Categories
  const categoryMap = new Map<string, { crit: number; high: number; med: number; low: number }>()
  owaspTimelineFindings.forEach((f) => {
    const key = f.category
    const curr = categoryMap.get(key) || { crit: 0, high: 0, med: 0, low: 0 }
    if (f.severity === 'critical') curr.crit++
    else if (f.severity === 'high') curr.high++
    else if (f.severity === 'medium') curr.med++
    else if (f.severity === 'low') curr.low++
    categoryMap.set(key, curr)
  })

  const owaspStackedData: OwaspStackedCategory[] = Array.from(categoryMap.entries())
    .map(([category, counts]) => {
      const code = category.slice(0, 3)
      return {
        category,
        code,
        critical: counts.crit,
        high: counts.high,
        medium: counts.med,
        low: counts.low,
        total: counts.crit + counts.high + counts.med + counts.low,
      }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // 6. Vulnerability Resolution Lifecycle
  const resolvedCount = findings.filter((f) => f.status === 'resolved').length
  const openCount = findings.filter((f) => f.status === 'open' || f.status === 'confirmed').length
  const fpCount = findings.filter((f) => f.status === 'false_positive').length
  const resolutionData: ResolutionStatusSlice[] = [
    { name: 'Resolved / Fixed', value: resolvedCount, color: themeColors.status.green },
    { name: 'Open / Unresolved', value: openCount, color: themeColors.status.red },
    { name: 'Accepted / False Positive', value: fpCount, color: themeColors.caption },
  ]

  // 7. Live Telemetry metrics
  const totalCrawledEndpoints = scans.reduce(
    (acc, s) => acc + (s.scannedEndpointsCount || 0),
    0
  )
  const completedScans = scans.filter((s) => s.status === 'completed' && s.durationSec > 0)
  const avgSeconds =
    completedScans.length > 0
      ? Math.round(completedScans.reduce((acc, s) => acc + s.durationSec, 0) / completedScans.length)
      : 0
  const avgRuntime = completedScans.length > 0 ? `${Math.round(avgSeconds / 60)}m` : '--'

  // 8. KPIs & Security Posture Score
  const resolvedFindings = findings.filter((f) => f.status === 'resolved')
  const mttrDays =
    resolvedFindings.length > 0
      ? Math.round(
          (resolvedFindings.reduce((sum, f) => {
            const ageDays =
              Math.max(0.1, (refDate.getTime() - new Date(f.discoveredAt).getTime()) / (1000 * 60 * 60 * 24))
            return sum + ageDays
          }, 0) /
            resolvedFindings.length) *
            10
        ) / 10
      : 0

  const kpis = {
    totalTargets: targets.length,
    activeScansCount: scans.filter((s) => s.status === 'running').length,
    totalOpenFindings: activeFindings.length,
    criticalCount: severityStats.critical,
    mttrDays,
    slaBreachedCount: activeFindings.filter((f) => (f.slaDaysRemaining ?? 1) <= 0).length,
  }

  // CVSS-aligned security posture penalty weights per open vulnerability:
  // - Critical: 2.4 penalty points (immediate exploitability, urgent triage)
  // - High: 1.4 penalty points (significant threat, SLA priority)
  // - Medium: 0.5 penalty points (moderate attack vector)
  // - Low: 0.1 penalty points (informational / minor hygiene)
  const SEVERITY_WEIGHTS = {
    CRITICAL: 2.4,
    HIGH: 1.4,
    MEDIUM: 0.5,
    LOW: 0.1,
  } as const

  const penalty =
    severityStats.critical * SEVERITY_WEIGHTS.CRITICAL +
    severityStats.high * SEVERITY_WEIGHTS.HIGH +
    severityStats.medium * SEVERITY_WEIGHTS.MEDIUM +
    severityStats.low * SEVERITY_WEIGHTS.LOW
  const postureScore = Math.max(15, Math.min(100, Math.round(100 - penalty)))
  const postureGrade =
    postureScore >= 90
      ? 'A+'
      : postureScore >= 80
      ? 'A'
      : postureScore >= 70
      ? 'B'
      : postureScore >= 55
      ? 'C'
      : 'D'
  const postureStatus =
    postureScore >= 85
      ? 'Optimal Posture'
      : postureScore >= 70
      ? 'Moderate Posture'
      : postureScore >= 55
      ? 'Elevated Risk'
      : 'Critical Risk'
  const postureColor =
    postureScore >= 80
      ? themeColors.status.green
      : postureScore >= 65
      ? themeColors.status.yellow
      : themeColors.status.red
  const authCoveragePct =
    targets.length > 0
      ? Math.round((targets.filter((t) => t.authenticated).length / targets.length) * 100)
      : 100

  const posture = {
    score: postureScore,
    grade: postureGrade,
    statusLabel: postureStatus,
    color: postureColor,
    authCoveragePct,
    openFindingsCount: activeFindings.length,
    urgentCount: severityStats.critical + severityStats.high,
    totalTargets: targets.length,
    authenticatedTargetsCount: targets.filter((t) => t.authenticated).length,
  }

  // 9. Remediation SLA & MTTR Velocity
  const resolvedCritical = resolvedFindings.filter((f) => f.severity === 'critical')
  const resolvedHigh = resolvedFindings.filter((f) => f.severity === 'high')

  const criticalMttrDays =
    resolvedCritical.length > 0
      ? Math.round(
          (resolvedCritical.reduce((sum, f) => {
            const ageDays =
              (refDate.getTime() - new Date(f.discoveredAt).getTime()) / (1000 * 60 * 60 * 24)
            return sum + Math.max(1, ageDays)
          }, 0) /
            resolvedCritical.length) *
            10
        ) / 10
      : 3.4

  const highMttrDays =
    resolvedHigh.length > 0
      ? Math.round(
          (resolvedHigh.reduce((sum, f) => {
            const ageDays =
              (refDate.getTime() - new Date(f.discoveredAt).getTime()) / (1000 * 60 * 60 * 24)
            return sum + Math.max(1, ageDays)
          }, 0) /
            resolvedHigh.length) *
            10
        ) / 10
      : 8.2

  const breachedSlaCount = activeFindings.filter((f) => (f.slaDaysRemaining ?? 1) <= 0).length
  const withinSlaCount = Math.max(0, activeFindings.length - breachedSlaCount)
  const slaCompliancePct =
    activeFindings.length > 0
      ? Math.round((withinSlaCount / activeFindings.length) * 100)
      : 100
  const velocityRatio =
    activeFindings.length > 0
      ? Math.round((resolvedCount / activeFindings.length) * 10) / 10
      : 1.0

  const slaAnalytics = {
    criticalMttrDays,
    highMttrDays,
    overallMttrDays: mttrDays || 5.8,
    withinSlaCount,
    breachedSlaCount,
    slaCompliancePct,
    resolvedCount,
    openCount: activeFindings.length,
    velocityRatio,
  }

  return {
    severityStats,
    trendData,
    authScopeData,
    targetStackedData,
    owaspStackedData,
    resolutionData,
    totalCrawledEndpoints,
    avgRuntime,
    kpis,
    posture,
    slaAnalytics,
  }
}
