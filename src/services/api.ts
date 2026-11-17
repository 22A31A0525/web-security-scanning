import type { Target, Scan, Finding, Report, FindingStatus, ScanStatus } from '../types/schema'
import {
  mockTargets,
  mockScans,
  mockFindings,
  mockReports,
  mockSeverityTrends,
  defaultScannerSettings,
} from '../data/mockData'

/**
 * Enterprise DAST API Client Service Layer with LocalStorage Persistence
 * 
 * 1. Seeds mock data into localStorage on first-time visit or user login.
 * 2. Directly persists any creates, edits, updates, or deletions to localStorage.
 * 3. Wipes and cleans localStorage session on user logout.
 */

export const STORAGE_KEYS = {
  targets: 'webscanner_targets',
  scans: 'webscanner_scans',
  findings: 'webscanner_findings',
  reports: 'webscanner_reports',
  settings: 'webscanner_settings',
  sidebar: 'webscanner_sidebar_collapsed',
} as const

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback
    return parsed ?? fallback
  } catch (err) {
    console.warn(`[Storage] Failed to parse key "${key}":`, err)
    return fallback
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn(`[Storage] Failed to save key "${key}":`, err)
  }
}

export function seedInitialStorage(force = false): void {
  if (typeof window === 'undefined') return
  if (force || !localStorage.getItem(STORAGE_KEYS.targets)) {
    dbTargets = JSON.parse(JSON.stringify(mockTargets))
    saveToStorage(STORAGE_KEYS.targets, dbTargets)
  }
  if (force || !localStorage.getItem(STORAGE_KEYS.scans)) {
    dbScans = JSON.parse(JSON.stringify(mockScans))
    saveToStorage(STORAGE_KEYS.scans, dbScans)
  }
  if (force || !localStorage.getItem(STORAGE_KEYS.findings)) {
    dbFindings = JSON.parse(JSON.stringify(mockFindings))
    saveToStorage(STORAGE_KEYS.findings, dbFindings)
  }
  if (force || !localStorage.getItem(STORAGE_KEYS.reports)) {
    dbReports = JSON.parse(JSON.stringify(mockReports))
    saveToStorage(STORAGE_KEYS.reports, dbReports)
  }
  if (force || !localStorage.getItem(STORAGE_KEYS.settings)) {
    saveToStorage(STORAGE_KEYS.settings, defaultScannerSettings)
  }
}

export function clearAppStorage(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEYS.targets)
    localStorage.removeItem(STORAGE_KEYS.scans)
    localStorage.removeItem(STORAGE_KEYS.findings)
    localStorage.removeItem(STORAGE_KEYS.reports)
    localStorage.removeItem(STORAGE_KEYS.settings)
    localStorage.removeItem(STORAGE_KEYS.sidebar)
  } catch (err) {
    console.warn('[Storage] Failed to clear storage:', err)
  }
  dbTargets = []
  dbScans = []
  dbFindings = []
  dbReports = []
}

// Persistent database simulating server-side database backed by localStorage
let dbTargets: Target[] = loadFromStorage(STORAGE_KEYS.targets, mockTargets)
let dbScans: Scan[] = loadFromStorage(STORAGE_KEYS.scans, mockScans)
let dbFindings: Finding[] = loadFromStorage(STORAGE_KEYS.findings, mockFindings)
let dbReports: Report[] = loadFromStorage(STORAGE_KEYS.reports, mockReports)

// Seed on startup if not present
if (typeof window !== 'undefined') {
  seedInitialStorage(false)
}

export const api = {
  // --- Targets Endpoints ---
  async getTargets(): Promise<Target[]> {
    return Promise.resolve([...dbTargets])
  },

  async getTargetById(id: string): Promise<Target | undefined> {
    const target = dbTargets.find((t) => t.id === id)
    return Promise.resolve(target ? { ...target } : undefined)
  },

  async createTarget(data: Partial<Target>): Promise<Target> {
    const maxIdNum = dbTargets.reduce((max, t) => {
      const match = t.id.match(/\d+/)
      if (match) {
        const val = parseInt(match[0], 10)
        return !isNaN(val) ? Math.max(max, val) : max
      }
      return max
    }, 0)
    const newTarget: Target = {
      id: `tgt_${String(maxIdNum + 1).padStart(2, '0')}`,
      name: data.name || 'New Target Asset',
      url: data.url || '--',
      environment: data.environment || 'production',
      authenticated: data.authenticated ?? false,
      authConfig: data.authConfig,
      lastScannedAt: new Date().toISOString(),
      openFindings: 0,
      riskScore: data.riskScore || 'A',
      description: data.description || 'Target enrolled into continuous DAST monitoring.',
    }
    dbTargets = [newTarget, ...dbTargets]
    saveToStorage(STORAGE_KEYS.targets, dbTargets)
    return Promise.resolve({ ...newTarget })
  },

  async updateTarget(id: string, updates: Partial<Target>): Promise<Target> {
    const idx = dbTargets.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error(`Target ${id} not found`)
    const updated = { ...dbTargets[idx], ...updates }
    dbTargets = dbTargets.map((t) => (t.id === id ? updated : t))
    saveToStorage(STORAGE_KEYS.targets, dbTargets)
    return Promise.resolve({ ...updated })
  },

  async deleteTarget(id: string): Promise<boolean> {
    dbTargets = dbTargets.filter((t) => t.id !== id)
    saveToStorage(STORAGE_KEYS.targets, dbTargets)
    return Promise.resolve(true)
  },

  // --- Scans Endpoints ---
  async getScans(): Promise<Scan[]> {
    return Promise.resolve([...dbScans])
  },

  async getScanById(id: string): Promise<Scan | undefined> {
    const scan = dbScans.find((s) => s.id === id)
    return Promise.resolve(scan ? { ...scan } : undefined)
  },

  async createScan(data: Partial<Scan> & { targetId: string }): Promise<Scan> {
    const maxScanNum = dbScans.reduce((max, s) => {
      const match = s.id.match(/\d+/)
      if (match) {
        const val = parseInt(match[0], 10)
        return !isNaN(val) ? Math.max(max, val) : max
      }
      return max
    }, 100)

    // Calculate dynamic endpoints based on profile: owasp_top10 (150-180), api_security (90-120), quick_recon (35-60)
    const baseCount = data.profile === 'quick_recon' ? 45 : data.profile === 'api_security' ? 95 : 140
    const dynamicEndpoints = baseCount + Math.floor(Math.random() * 25)

    const newScan: Scan = {
      id: `scan_${maxScanNum + 1}`,
      targetId: data.targetId,
      status: 'running',
      profile: data.profile || 'owasp_top10',
      progress: 0,
      startedAt: new Date().toISOString(),
      durationSec: 0,
      findingsCount: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      scannedEndpointsCount: dynamicEndpoints,
      triggeredBy: data.triggeredBy || 'Security Analyst (Manual)',
    }
    dbScans = [newScan, ...dbScans]
    saveToStorage(STORAGE_KEYS.scans, dbScans)
    return Promise.resolve({ ...newScan })
  },

  async updateScan(id: string, updates: Partial<Scan>): Promise<Scan> {
    const idx = dbScans.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error(`Scan ${id} not found`)
    const updated = { ...dbScans[idx], ...updates }
    if (updates.status === 'completed' && !updated.completedAt) {
      updated.completedAt = new Date().toISOString()
    }
    dbScans = dbScans.map((s) => (s.id === id ? updated : s))
    saveToStorage(STORAGE_KEYS.scans, dbScans)
    return Promise.resolve({ ...updated })
  },

  async cancelScan(id: string): Promise<Scan> {
    const idx = dbScans.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error(`Scan ${id} not found`)
    const currentScan = dbScans[idx]
    dbScans[idx] = {
      ...currentScan,
      status: 'failed' as ScanStatus,
      completedAt: currentScan.completedAt || new Date().toISOString(),
    }
    saveToStorage(STORAGE_KEYS.scans, dbScans)
    return Promise.resolve({ ...dbScans[idx] })
  },

  // --- Findings Endpoints ---
  async getFindings(): Promise<Finding[]> {
    return Promise.resolve([...dbFindings])
  },

  async getFindingById(id: string): Promise<Finding | undefined> {
    const finding = dbFindings.find((f) => f.id === id)
    return Promise.resolve(finding ? { ...finding } : undefined)
  },

  async updateFindingStatus(id: string, status: FindingStatus): Promise<Finding> {
    const idx = dbFindings.findIndex((f) => f.id === id)
    if (idx === -1) throw new Error(`Finding ${id} not found`)
    const updatedFinding = { ...dbFindings[idx], status }
    dbFindings[idx] = updatedFinding
    saveToStorage(STORAGE_KEYS.findings, dbFindings)

    // Recalculate target's open findings count
    const targetId = updatedFinding.targetId
    if (targetId) {
      const targetOpenCount = dbFindings.filter(
        (f) => f.targetId === targetId && (f.status === 'open' || f.status === 'confirmed')
      ).length
      dbTargets = dbTargets.map((t) => (t.id === targetId ? { ...t, openFindings: targetOpenCount } : t))
      saveToStorage(STORAGE_KEYS.targets, dbTargets)
    }

    return Promise.resolve({ ...dbFindings[idx] })
  },

  async bulkUpdateFindingStatus(ids: string[], status: FindingStatus): Promise<Finding[]> {
    const updated: Finding[] = []
    const affectedTargetIds = new Set<string>()
    dbFindings = dbFindings.map((f) => {
      if (ids.includes(f.id)) {
        const item = { ...f, status }
        updated.push(item)
        if (f.targetId) affectedTargetIds.add(f.targetId)
        return item
      }
      return f
    })
    saveToStorage(STORAGE_KEYS.findings, dbFindings)

    // Recalculate affected targets' open findings count
    if (affectedTargetIds.size > 0) {
      dbTargets = dbTargets.map((t) => {
        if (affectedTargetIds.has(t.id)) {
          const count = dbFindings.filter(
            (f) => f.targetId === t.id && (f.status === 'open' || f.status === 'confirmed')
          ).length
          return { ...t, openFindings: count }
        }
        return t
      })
      saveToStorage(STORAGE_KEYS.targets, dbTargets)
    }

    return Promise.resolve(updated)
  },

  // --- Reports Endpoints ---
  async getReports(): Promise<Report[]> {
    return Promise.resolve([...dbReports])
  },

  async getReportById(id: string): Promise<Report | undefined> {
    const report = dbReports.find((r) => r.id === id)
    return Promise.resolve(report ? { ...report } : undefined)
  },

  async createReport(data: Partial<Report>): Promise<Report> {
    const fallbackScan = dbScans[0]
    const fallbackTarget = fallbackScan ? dbTargets.find((t) => t.id === fallbackScan.targetId) : dbTargets[0]
    const targetName = data.target || fallbackTarget?.name || 'All Monitored Targets'
    const scanId = data.scanId || fallbackScan?.id || 'scan_all'

    const newReport: Report = {
      id: `rpt_${String(dbReports.length + 1).padStart(2, '0')}`,
      scanId,
      target: targetName,
      title: data.title || `${targetName} — Security Evaluation`,
      framework: data.framework || 'OWASP Top 10 Audit',
      createdAt: new Date().toISOString(),
      findings: data.findings ?? 0,
      format: data.format || 'pdf',
      fileSizeKb: data.fileSizeKb || 1100,
      downloadUrl: '#',
    }
    dbReports = [newReport, ...dbReports]
    saveToStorage(STORAGE_KEYS.reports, dbReports)
    return Promise.resolve({ ...newReport })
  },

  async deleteReport(id: string): Promise<boolean> {
    dbReports = dbReports.filter((r) => r.id !== id)
    saveToStorage(STORAGE_KEYS.reports, dbReports)
    return Promise.resolve(true)
  },

  // --- Analytics & Trends Endpoints ---
  async getSeverityTrends(timeline: string = '30D') {
    const data = (mockSeverityTrends as Record<string, typeof mockSeverityTrends['30D']>)[timeline] || mockSeverityTrends['30D']
    return Promise.resolve([...data])
  },

  // --- Reset to Pristine Demo Data ---
  resetToDemoData(): { targets: Target[]; scans: Scan[]; findings: Finding[]; reports: Report[] } {
    dbTargets = JSON.parse(JSON.stringify(mockTargets))
    dbScans = JSON.parse(JSON.stringify(mockScans))
    dbFindings = JSON.parse(JSON.stringify(mockFindings))
    dbReports = JSON.parse(JSON.stringify(mockReports))
    saveToStorage(STORAGE_KEYS.targets, dbTargets)
    saveToStorage(STORAGE_KEYS.scans, dbScans)
    saveToStorage(STORAGE_KEYS.findings, dbFindings)
    saveToStorage(STORAGE_KEYS.reports, dbReports)
    return { targets: dbTargets, scans: dbScans, findings: dbFindings, reports: dbReports }
  },

  // --- Session Management ---
  loginSession(): { targets: Target[]; scans: Scan[]; findings: Finding[]; reports: Report[] } {
    seedInitialStorage(true)
    return { targets: dbTargets, scans: dbScans, findings: dbFindings, reports: dbReports }
  },

  logoutSession(): void {
    clearAppStorage()
  },
}
