import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Unlock, Play, Pencil, Eye, Trash2, ArrowUpRight, Activity } from 'lucide-react'
import { DataTable, TableRowActions } from '../components/table'
import type { DataTableColumn } from '../components/table/types'
import { useEnrichedTargets, useAppStore } from '../store/useAppStore'
import type { TargetWithTelemetry } from '../types/schema'
import TargetDetailDrawer from './TargetDetailDrawer'
import CreateTargetDrawer from './CreateTargetDrawer'

export default function TargetsView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetIdParam = searchParams.get('targetId')
  const targets = useEnrichedTargets()
  const deleteTarget = useAppStore((state) => state.deleteTarget)
  const addScan = useAppStore((state) => state.addScan)
  const updateTarget = useAppStore((state) => state.updateTarget)

  // Drawer states
  const [inspectedTarget, setInspectedTarget] = useState<TargetWithTelemetry | null>(null)
  const [editingTarget, setEditingTarget] = useState<TargetWithTelemetry | null>(null)

  // Local Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('')

  // Sync searchQuery when targetId is provided in URL
  useEffect(() => {
    if (targetIdParam) {
      setSearchQuery(targetIdParam)
    }
  }, [targetIdParam])
  const [environmentFilters, setEnvironmentFilters] = useState<string[]>(['all'])
  const [authFilters, setAuthFilters] = useState<string[]>(['all'])
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
          onClick={() => setInspectedTarget(target)}
          className="font-mono text-xs font-semibold text-status-blue hover:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors group text-left"
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
              onClick: () => setInspectedTarget(target),
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
              onClick: () => deleteTarget(target.id),
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
        maxHeight="max-h-[620px]"
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
              { label: 'All Environments', value: 'all' },
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
              setAuthFilters(Array.isArray(val) ? val : [val])
              setCurrentPage(1)
            },
            options: [
              { label: 'All Scopes', value: 'all' },
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
              { label: 'All Grades', value: 'all' },
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
        onClose={() => setInspectedTarget(null)}
        onEdit={(t) => {
          setInspectedTarget(null)
          setEditingTarget(t as TargetWithTelemetry)
        }}
        onRunScan={async (t) => {
          const newScan = await addScan({ targetId: t.id })
          setInspectedTarget(null)
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
        targetToEdit={editingTarget}
        onUpdateTarget={updateTarget}
      />
    </div>
  )
}
