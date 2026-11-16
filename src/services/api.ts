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
      return match ? Math.max(max, parseInt(match[0], 10)) : max
    }, 0)
    const newTarget: Target = {
      id: `tgt_${String(maxIdNum + 1).padStart(2, '0')}`,
      name: data.name || 'New Target Asset',
      url: data.url || 'https://target.acme.com',
      environment: data.environment || 'production',
      authenticated: data.authenticated ?? false,
      authConfig: data.authConfig,
      lastScannedAt: new Date().toISOString(),
      openFindings: 0,
      riskScore: 'A',
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
      return match ? Math.max(max, parseInt(match[0], 10)) : max
    }, 100)
    const newScan: Scan = {
      id: `scan_${maxScanNum + 1}`,
      targetId: data.targetId,
      status: 'running',
      profile: data.profile || 'owasp_top10',
      progress: 0,
      startedAt: new Date().toISOString(),
      durationSec: 0,
      findingsCount: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      scannedEndpointsCount: 120,
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
    dbScans[idx] = { ...dbScans[idx], status: 'failed' as ScanStatus, progress: 100 }
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
    dbFindings[idx] = { ...dbFindings[idx], status }
    saveToStorage(STORAGE_KEYS.findings, dbFindings)
    return Promise.resolve({ ...dbFindings[idx] })
  },

  async bulkUpdateFindingStatus(ids: string[], status: FindingStatus): Promise<Finding[]> {
    const updated: Finding[] = []
    dbFindings = dbFindings.map((f) => {
      if (ids.includes(f.id)) {
        const item = { ...f, status }
        updated.push(item)
        return item
      }
      return f
    })
    saveToStorage(STORAGE_KEYS.findings, dbFindings)
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
    const newReport: Report = {
      id: `rpt_${String(dbReports.length + 1).padStart(2, '0')}`,
      scanId: data.scanId || 'scan_118',
      target: data.target || 'Acme Production Target',
      title: data.title || `${data.target || 'Acme Production Target'} — Security Evaluation`,
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
