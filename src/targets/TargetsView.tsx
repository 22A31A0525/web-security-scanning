import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Unlock, Play, Pencil, Eye, Trash2, ArrowUpRight, Activity, AlertTriangle, X } from 'lucide-react'
import { DataTable, TableRowActions } from '../components/table'
import type { DataTableColumn } from '../components/table/types'
import { useEnrichedTargets, useAppStore } from '../store/useAppStore'
import type { TargetWithTelemetry } from '../types/schema'
import TargetDetailDrawer from './TargetDetailDrawer'
import CreateTargetDrawer from './CreateTargetDrawer'
import Button from '../ui/Button'

export default function TargetsView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetIdParam = searchParams.get('targetId')
  const authParam = searchParams.get('auth')
  const targets = useEnrichedTargets()
  const deleteTarget = useAppStore((state) => state.deleteTarget)
  const addScan = useAppStore((state) => state.addScan)
  const updateTarget = useAppStore((state) => state.updateTarget)

  // Derive active inspected target directly from URL parameter ?targetId=... or local state
  const inspectedTarget = useMemo(() => {
    if (targetIdParam) {
      return targets.find((t) => t.id === targetIdParam) || null
    }
    return null
  }, [targets, targetIdParam])

  const [editingTarget, setEditingTarget] = useState<TargetWithTelemetry | null>(null)
  const [targetToDelete, setTargetToDelete] = useState<TargetWithTelemetry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleInspectTarget = (target: TargetWithTelemetry) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('targetId', target.id)
    setSearchParams(nextParams)
  }

  const handleCloseInspect = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('targetId')
    setSearchParams(nextParams)
  }

  // Local Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('')
  const [environmentFilters, setEnvironmentFilters] = useState<string[]>(['all'])
  const [authFilters, setAuthFilters] = useState<string[]>(
    authParam ? [authParam] : ['all']
  )

  useEffect(() => {
    if (authParam) {
      setAuthFilters([authParam])
    } else {
      setAuthFilters(['all'])
    }
  }, [authParam])
  const [riskFilters, setRiskFilters] = useState<string[]>(['all'])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [sortField, setSortField] = useState<string | null>('openFindings')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Counts for filter badges
  const totalAssets = targets.length
  const prodAssets = targets.filter((t) => t.environment === 'production').length
  const stagingAssets = targets.filter((t) => t.environment === 'staging').length
  const devAssets = targets.filter((t) => t.environment === 'dev').length
  const authenticatedCount = targets.filter((t) => t.authenticated).length
  const gradeACount = targets.filter((t) => (t.riskScore || 'A') === 'A').length
  const gradeBCount = targets.filter((t) => t.riskScore === 'B').length
  const gradeCCount = targets.filter((t) => t.riskScore === 'C').length
  const gradeDCount = targets.filter((t) => t.riskScore === 'D' || t.riskScore === 'F').length

  // Filter Logic
  const filteredTargets = useMemo(() => {
    let result = [...targets]

    if (!environmentFilters.includes('all') && environmentFilters.length > 0) {
      result = result.filter((t) => environmentFilters.includes(t.environment))
    }

    if (!authFilters.includes('all') && authFilters.length > 0) {
      const hasAuth = authFilters.includes('auth')
      const hasUnauth = authFilters.includes('unauth')
      if (hasAuth && !hasUnauth) {
        result = result.filter((t) => t.authenticated)
      } else if (!hasAuth && hasUnauth) {
        result = result.filter((t) => !t.authenticated)
      }
    }

    if (!riskFilters.includes('all') && riskFilters.length > 0) {
      result = result.filter((t) => {
        const score = t.riskScore || 'A'
        return riskFilters.includes(score) || (score === 'F' && riskFilters.includes('D'))
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.url.toLowerCase().includes(q) ||
          t.environment.toLowerCase().includes(q)
      )
    }

    // Sort Logic
    if (sortField) {
      result.sort((a, b) => {
        let valA: unknown = (a as unknown as Record<string, unknown>)[sortField]
        let valB: unknown = (b as unknown as Record<string, unknown>)[sortField]

        if (sortField === 'lastScannedAt') {
          valA = new Date(a.lastScannedAt || 0).getTime()
          valB = new Date(b.lastScannedAt || 0).getTime()
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA
        }

        const strA = String(valA || '').toLowerCase()
        const strB = String(valB || '').toLowerCase()
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
      })
    }

    return result
  }, [targets, environmentFilters, authFilters, searchQuery, sortField, sortDirection])

  const pagedTargets = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTargets.slice(start, start + pageSize)
  }, [filteredTargets, currentPage, pageSize])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Column Schema for Targets (Proper Case, Centered, matching Scans format)
  const columns: DataTableColumn<TargetWithTelemetry>[] = [
    {
      id: 'id',
      header: 'ID',
      width: '100px',
      sortable: true,
      cell: (target) => (
        <button
          type="button"
          onClick={() => handleInspectTarget(target)}
          className="font-mono text-xs font-semibold text-status-blue hover:text-heading hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors group text-left"
          title={`Inspect Target #${target.id}`}
        >
          <span>#{target.id}</span>
          <ArrowUpRight className="size-icon-xs opacity-0 group-hover:opacity-100 transition-opacity text-status-blue shrink-0" />
        </button>
      ),
    },
    {
      id: 'name',
      header: 'Target Name',
      width: '140px',
      minWidth: '130px',
      sortable: true,
      cell: (target) => (
        <span className="text-body text-xs font-medium truncate block w-full" title={target.name}>
          {target.name}
        </span>
      ),
    },
    {
      id: 'url',
      header: 'Target URL',
      width: '240px',
      minWidth: '220px',
      sortable: true,
      cell: (target) => (
        <span className="text-heading font-mono text-xs font-medium truncate block w-full" title={target.url}>
          {target.url}
        </span>
      ),
    },
    {
      id: 'environment',
      header: 'Environment',
      width: '110px',
      sortable: true,
      cell: (target) => {
        const envLabel =
          target.environment === 'production'
            ? 'Production'
            : target.environment === 'staging'
            ? 'Staging'
            : 'Dev'
        return <span className="text-xs text-desc font-medium">{envLabel}</span>
      },
    },
    {
      id: 'authenticated',
      header: 'Auth Scope',
      width: '130px',
      sortable: true,
      cell: (target) => (
        <div className="inline-flex items-center gap-1.5 text-xs text-desc">
          {target.authenticated ? (
            <>
              <Lock className="size-icon-xs text-scope-authenticated shrink-0" />
              <span className="text-body font-medium">Authenticated</span>
            </>
          ) : (
            <>
              <Unlock className="size-icon-xs text-scope-unauthenticated shrink-0" />
              <span className="text-caption">Unauthenticated</span>
            </>
          )}
        </div>
      ),
    },
    {
      id: 'openFindings',
      header: 'Findings',
      width: '180px',
      sortable: true,
      cell: (target) => {
        const crit = target.severityCounts?.critical || 0
        const high = target.severityCounts?.high || 0
        const med = target.severityCounts?.medium || 0
        return (
          <div className="flex flex-col text-xs text-desc leading-tight">
            <div className="flex items-center gap-2.5 whitespace-nowrap">
              <span>{crit} Critical</span>
              <span>{high} High</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap mt-0.5">
              <span>{med} Medium</span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'riskScore',
      header: 'Risk Grade',
      width: '135px',
      sortable: true,
      cell: (target) => {
        const score = target.riskScore || 'A'
        const gradeColor =
          score === 'A'
            ? 'text-status-green'
            : score === 'B'
            ? 'text-status-blue'
            : score === 'C'
            ? 'text-status-yellow'
            : 'text-status-red'
        const gradeDescription =
          score === 'A'
            ? 'Grade A: Clean security posture — zero high or critical vulnerabilities detected.'
            : score === 'B'
            ? 'Grade B: Low risk — minor non-exploitable findings present.'
            : score === 'C'
            ? 'Grade C: Moderate risk — medium severity issues require scheduled remediation.'
            : score === 'D'
            ? 'Grade D: High risk — active critical/high findings or SLA breaches requiring triage.'
            : 'Grade F: Critical risk — severe exploitable vulnerabilities detected on active endpoints.'

        return (
          <span
            title={gradeDescription}
            className={`font-bold text-xs cursor-help ${gradeColor}`}
          >
            {score}
          </span>
        )
      },
    },
    {
      id: 'lastScannedAt',
      header: 'Last Audit',
      width: '120px',
      sortable: true,
      cell: (target) => (
        <button
          type="button"
          onClick={() => navigate(`/scans?targetId=${target.id}`)}
          className="text-desc font-mono text-[11px] hover:text-status-blue hover:underline text-left cursor-pointer transition-colors"
          title={`View scans for Target #${target.id}`}
        >
          {target.lastScannedAt ? new Date(target.lastScannedAt).toLocaleDateString() : 'Never'}
        </button>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '80px',
      align: 'center',
      cell: (target) => (
        <TableRowActions
          actions={[
            {
              label: 'Run scan',
              icon: <Play className="size-icon-xs text-desc" />,
              onClick: async () => {
                const newScan = await addScan({ targetId: target.id })
                if (newScan?.id) {
                  navigate(`/scans?scanId=${newScan.id}`)
                } else {
                  navigate('/scans')
                }
              },
            },
            {
              label: 'View scans',
              icon: <Activity className="size-icon-xs text-desc" />,
              onClick: () => navigate(`/scans?targetId=${target.id}`),
            },
            {
              label: 'Inspect',
              icon: <Eye className="size-icon-xs text-desc" />,
              onClick: () => handleInspectTarget(target),
            },
            {
              label: 'Edit',
              icon: <Pencil className="size-icon-xs text-desc" />,
              onClick: () => setEditingTarget(target),
            },
            {
              label: 'Delete',
              icon: <Trash2 className="size-icon-xs text-status-red" />,
              danger: true,
              onClick: () => setTargetToDelete(target),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="w-full">
      {/* Centralized High-Density Data Table */}
      <DataTable<TargetWithTelemetry>
        columns={columns}
        data={pagedTargets}
        keyExtractor={(item) => item.id}
        maxHeight="max-h-table-view"
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q)
          setCurrentPage(1)
          if (!q && targetIdParam) {
            const nextParams = new URLSearchParams(searchParams)
            nextParams.delete('targetId')
            setSearchParams(nextParams)
          }
        }}
        searchPlaceholder="Search targets by ID, name, or URL..."
        totalRecords={targets.length}
        recordsLabel="targets"
        filters={[
          {
            id: 'environment',
            label: 'Environment',
            selectedValues: environmentFilters,
            onChange: (val) => {
              setEnvironmentFilters(Array.isArray(val) ? val : [val])
              setCurrentPage(1)
            },
            options: [
              { label: 'All Environments', value: 'all', count: targets.length },
              { label: 'Production', value: 'production', count: prodAssets },
              { label: 'Staging', value: 'staging', count: stagingAssets },
              { label: 'Dev', value: 'dev', count: devAssets },
            ],
          },
          {
            id: 'auth',
            label: 'Scope',
            selectedValues: authFilters,
            onChange: (val) => {
              const selected = Array.isArray(val) ? val : [val]
              setAuthFilters(selected)
              const nextParams = new URLSearchParams(searchParams)
              const lastPicked = selected.find((v) => v !== 'all')
              if (lastPicked && !selected.includes('all') && selected.length === 1) {
                nextParams.set('auth', lastPicked)
              } else {
                nextParams.delete('auth')
              }
              setSearchParams(nextParams)
              setCurrentPage(1)
            },
            options: [
              { label: 'All Scopes', value: 'all', count: targets.length },
              { label: 'Authenticated', value: 'auth', count: authenticatedCount },
              { label: 'Unauthenticated', value: 'unauth', count: totalAssets - authenticatedCount },
            ],
          },
          {
            id: 'risk',
            label: 'Risk Grade',
            selectedValues: riskFilters,
            onChange: (val) => {
              setRiskFilters(Array.isArray(val) ? val : [val])
              setCurrentPage(1)
            },
            options: [
              { label: 'All Grades', value: 'all', count: targets.length },
              { label: 'Grade A', value: 'A', count: gradeACount },
              { label: 'Grade B', value: 'B', count: gradeBCount },
              { label: 'Grade C', value: 'C', count: gradeCCount },
              { label: 'Grade D', value: 'D', count: gradeDCount },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearchQuery('')
          setEnvironmentFilters(['all'])
          setAuthFilters(['all'])
          setRiskFilters(['all'])
          if (targetIdParam) {
            const nextParams = new URLSearchParams(searchParams)
            nextParams.delete('targetId')
            setSearchParams(nextParams)
          }
        }}
        pagination={{
          currentPage,
          pageSize: 10,
          totalItems: filteredTargets.length,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Slide-over Inspection Drawer for Target */}
      <TargetDetailDrawer
        target={inspectedTarget}
        isOpen={Boolean(inspectedTarget)}
        onClose={handleCloseInspect}
        onEdit={(t) => {
          handleCloseInspect()
          setEditingTarget(t as TargetWithTelemetry)
        }}
        onRunScan={async (t) => {
          const newScan = await addScan({ targetId: t.id })
          handleCloseInspect()
          if (newScan?.id) {
            navigate(`/scans?scanId=${newScan.id}`)
          } else {
            navigate('/scans')
          }
        }}
      />

      {/* Slide-over Edit Target Drawer */}
      <CreateTargetDrawer
        isOpen={Boolean(editingTarget)}
        onClose={() => setEditingTarget(null)}
        onBack={() => {
          if (editingTarget) {
            handleInspectTarget(editingTarget)
          }
          setEditingTarget(null)
        }}
        targetToEdit={editingTarget}
        onUpdateTarget={updateTarget}
      />

      {/* Confirmation Modal for Delete Target */}
      {targetToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-modal bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-status-red/10 border border-status-red/20 flex items-center justify-center text-status-red shrink-0">
                  <AlertTriangle className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="delete-modal-title" className="text-base font-bold text-heading">
                    Delete Target
                  </h3>
                  <p className="text-xs text-desc mt-0.5">
                    This action will permanently remove this target and cascade to its scans and findings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTargetToDelete(null)}
                className="text-desc hover:text-heading cursor-pointer p-1 rounded-lg hover:bg-surface transition-colors"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="bg-surface/50 border border-border rounded-xl p-3 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-desc font-medium">Target Name:</span>
                <span className="text-heading font-semibold">{targetToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-desc font-medium">Target URL:</span>
                <span className="text-heading font-mono">{targetToDelete.url}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-desc font-medium">Associated Findings:</span>
                <span className="text-status-red font-semibold">{targetToDelete.openFindings} open</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTargetToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-status-red text-white hover:bg-status-red/90"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true)
                    await deleteTarget(targetToDelete.id)
                    setTargetToDelete(null)
                  } finally {
                    setIsDeleting(false)
                  }
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Target'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
