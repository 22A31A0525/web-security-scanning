/**
 * Web Security Scanning Dashboard - Centralized Data Types & Schema
 * Aligned with assignment data contracts & enterprise DAST benchmarks (OWASP Top 10, CWE).
 */

// --- 1. Target Types ---
export type Environment = 'production' | 'staging' | 'dev'
export type RiskScore = 'A' | 'B' | 'C' | 'D' | 'F'

export interface TargetAuthConfig {
  enabled: boolean
  username?: string
  password?: string
  authType?: 'basic' | 'bearer' | 'form'
  loginUrl?: string
}

export interface Target {
  id: string
  name: string
  url: string
  environment: Environment
  authenticated: boolean
  authConfig?: TargetAuthConfig
  lastScannedAt: string
  openFindings: number
  riskScore?: RiskScore
  description?: string
}

// --- 2. Scan Execution Types ---
export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type ScanProfile = 'owasp_top10' | 'api_security' | 'quick_recon'

export interface FindingsCount {
  critical: number
  high: number
  medium: number
  low: number
  info?: number
}

export interface Scan {
  id: string
  targetId: string
  status: ScanStatus
  profile?: ScanProfile
  progress: number // 0..100 (animated for running state)
  startedAt: string
  completedAt?: string
  durationSec: number
  findingsCount: FindingsCount
  scannedEndpointsCount?: number
  triggeredBy?: string
}

// --- 3. Vulnerability Finding Types ---
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type OWASPCategory =
  | 'A01: Broken Access Control'
  | 'A02: Cryptographic Failures'
  | 'A03: Injection'
  | 'A04: Insecure Design'
  | 'A05: Security Misconfiguration'
  | 'A06: Vulnerable and Outdated Components'
  | 'A07: Identification and Authentication Failures'
  | 'A08: Software and Data Integrity Failures'
  | 'A09: Security Logging and Monitoring Failures'
  | 'A10: Server-Side Request Forgery (SSRF)'

export type FindingStatus = 'open' | 'confirmed' | 'resolved' | 'false_positive'

export interface FindingEvidence {
  request: string
  response: string
}

export interface Finding {
  id: string
  scanId: string
  targetId: string
  title: string
  severity: FindingSeverity
  category: OWASPCategory
  cwe: string // e.g. "CWE-89", "CWE-79"
  status: FindingStatus
  location: string // e.g. "GET /search?q="
  description: string
  evidence: FindingEvidence
  remediation: string
  discoveredAt: string
  slaDaysRemaining?: number // SLA breach tracking
  complexity?: 'low' | 'medium' | 'high'
}

// --- 4. Compliance & Audit Report Types ---
export type ReportFormat = 'pdf' | 'json' | 'csv'

export interface Report {
  id: string
  scanId: string
  target: string
  title?: string
  framework?: string
  createdAt: string
  findings: number
  findingIds?: string[]
  format: ReportFormat
  fileSizeKb?: number
  downloadUrl?: string
}

// --- 5. Executive Dashboard Analytics Types ---
export interface DashboardKPIs {
  totalTargets: number
  activeScansCount: number
  totalOpenFindings: number
  criticalCount: number
  mttrDays: number
  slaBreachedCount: number
}

export interface SeverityDistribution {
  severity: FindingSeverity
  count: number
  color: string
}

export interface TrendDataPoint {
  date: string
  discovered: number
  resolved: number
  openBacklog: number
}

export interface OWASPDistribution {
  category: string
  count: number
  criticalHighCount: number
}

// --- 6. Enriched Domain Entity Types ---
export interface TargetWithTelemetry extends Target {
  endpointsCount: number
  riskScoreNumber: number
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low'
  severityCounts: {
    critical: number
    high: number
    medium: number
    low: number
  }
  lastScanStatus: 'Completed' | 'Running' | 'Failed' | 'Queued' | 'Cancelled'
  lastScanDuration: string
  topVulnerabilities: Array<{
    id: string
    title: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    cwe: string
    location: string
  }>
  recentScans: Array<{
    id: string
    status: 'completed' | 'running' | 'failed' | 'queued' | 'cancelled'
    duration: string
    findingsFound: number
    date: string
  }>
}

export interface EnrichedScan extends Scan {
  targetName: string
  targetUrl: string
  environment: string
  phase: string
}

export interface EnrichedFinding {
  id: string
  scanId: string
  targetId: string
  targetName: string
  targetUrl?: string
  targetEnv: 'production' | 'staging' | 'dev'
  title: string
  severity: FindingSeverity
  category: string
  cwe: string
  status: FindingStatus
  location: string
  description: string
  evidence: { request: string; response: string }
  remediation: string
  discoveredAt: string
  slaDaysRemaining?: number
  complexity?: 'low' | 'medium' | 'high'
}

export interface EnrichedReport extends Report {
  title: string
  framework: string
}

// --- 7. Scanner & Environment Configuration Types ---
export interface EnvironmentPolicy {
  tier: 'production' | 'staging' | 'dev'
  maxConcurrentScans: number
  safeModeOnly: boolean
  rateLimitRps: number
  requireApproval: boolean
}

export interface ScannerEngineConfig {
  engineVersion: string
  maxCrawlDepth: number
  maxPagesPerTarget: number
  requestTimeoutSec: number
  userAgent: string
  excludedPaths: string
  excludedExtensions: string
  allowDestructivePayloads: boolean
}

export interface SlaConfig {
  criticalDays: number
  highDays: number
  mediumDays: number
  lowDays: number
}

export interface IntegrationConfig {
  slackWebhookUrl: string
  pagerDutyRoutingKey: string
  jiraProjectKey: string
  notifyOnCritical: boolean
  notifyOnHigh: boolean
  apiKey: string
}

export interface ScannerSettings {
  engine: ScannerEngineConfig
  environments: Record<'production' | 'staging' | 'dev', EnvironmentPolicy>
  sla: SlaConfig
  integrations: IntegrationConfig
}

// --- 8. UI Widget Analytics & Telemetry Types ---
export interface LiveTaskItem {
  id: string
  taskId: string
  targetName: string
  targetUrl: string
  profile: string
  status: 'running' | 'queued'
  phase: 'Auditing' | 'Crawling' | 'Fuzzing' | 'Queued'
  currentActivity: string
  progress: number
  elapsed: string
  eta: string
  endpoints: number
  findingsCount: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
}

export interface SeverityStats {
  critical: number
  high: number
  medium: number
  low: number
}

export interface SeverityTrendPoint {
  date: string
  isoDate?: string
  critical: number
  high: number
  medium: number
  low: number
}

export interface AuthScopeSlice {
  name: string
  value: number
  color: string
}

export interface TargetStackedFinding {
  targetId: string
  targetName: string
  url: string
  environment: Environment
  riskScore?: RiskScore
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

export interface OwaspStackedCategory {
  category: string
  code: string
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

export interface ResolutionStatusSlice {
  name: string
  value: number
  color: string
}

export type DashboardTimeline = '30D' | '90D' | '6M' | 'All'

export interface DashboardTimelineOptions {
  trendTimeline?: DashboardTimeline
  targetTimeline?: DashboardTimeline
  owaspTimeline?: DashboardTimeline
}

export interface SlaAnalytics {
  criticalMttrDays: number
  highMttrDays: number
  overallMttrDays: number
  withinSlaCount: number
  breachedSlaCount: number
  slaCompliancePct: number
  resolvedCount: number
  openCount: number
  velocityRatio: number
}
