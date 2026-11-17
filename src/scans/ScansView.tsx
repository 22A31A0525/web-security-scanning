import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { RotateCcw, Eye, Trash2, ArrowUpRight } from 'lucide-react'
import { DataTable, TableRowActions } from '../components/table'
import type { DataTableColumn } from '../components/table/types'
import { useAppStore, useEnrichedScans } from '../store/useAppStore'
import type { EnrichedScan } from '../types/schema'
import ScanDetailDrawer from './ScanDetailDrawer'
import Button from '../ui/Button'

export default function ScansView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const scanIdParam = searchParams.get('scanId')
  const targetIdParam = searchParams.get('targetId')
  const statusParam = searchParams.get('status')
  const pageParam = searchParams.get('page')

  const scans = useEnrichedScans()
  const targets = useAppStore((state) => state.targets)
  const { cancelScan, addScan, scans: rawScans, setScans } = useAppStore()

  // Derive active inspected scan directly from URL parameter ?scanId=...
  const activeSelectedScan = useMemo(() => {
    if (!scanIdParam) return null
    return scans.find((s) => s.id === scanIdParam) || null
  }, [scans, scanIdParam])

  const isDrawerOpen = Boolean(activeSelectedScan)

  const handleInspectScan = (scan: EnrichedScan) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('scanId', scan.id)
    setSearchParams(nextParams)
  }

  const handleCloseDrawer = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('scanId')
    setSearchParams(nextParams)
  }

  // Local Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>(
    statusParam ? [statusParam] : ['all']
  )
  const [targetFilters, setTargetFilters] = useState<string[]>(
    targetIdParam ? [targetIdParam] : ['all']
  )

  useEffect(() => {
    if (statusParam) {
      setStatusFilters([statusParam])
    } else {
      setStatusFilters(['all'])
    }
  }, [statusParam])

  useEffect(() => {
    if (targetIdParam) {
      setTargetFilters([targetIdParam])
    } else {
      setTargetFilters(['all'])
    }
  }, [targetIdParam])
  const [profileFilters, setProfileFilters] = useState<string[]>(['all'])
  const [findingFilters, setFindingFilters] = useState<string[]>(['all'])
  const [currentPage, setCurrentPage] = useState(() => {
    const parsed = Number(pageParam)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  })

  // Sync page state when URL back/forward navigation changes ?page=
  useEffect(() => {
    const parsed = Number(pageParam)
    const validPage = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    setCurrentPage((prev) => (prev !== validPage ? validPage : prev))
  }, [pageParam])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    const nextParams = new URLSearchParams(searchParams)
    if (newPage > 1) {
      nextParams.set('page', String(newPage))
    } else {
      nextParams.delete('page')
    }
    setSearchParams(nextParams)
  }

  const pageSize = 10
  const [sortField, setSortField] = useState<string | null>('startedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Target Filter Options with Scan Counts
  const targetFilterOptions = useMemo(() => {
    return [
      { label: 'All Targets', value: 'all', count: scans.length },
      ...targets.map((t) => ({
        label: `${t.name} (#${t.id})`,
        value: t.id,
        count: scans.filter((s) => s.targetId === t.id).length,
      })),
    ]
  }, [targets, scans])

  // Status & Finding Counts
  const runningCount = scans.filter((s) => s.status === 'running').length
  const queuedCount = scans.filter((s) => s.status === 'queued').length
  const completedScans = scans.filter((s) => s.status === 'completed')
  const failedCount = scans.filter((s) => s.status === 'failed').length
  const criticalFindingsCount = scans.filter((s) => (s.findingsCount.critical || 0) > 0).length
  const highFindingsCount = scans.filter((s) => (s.findingsCount.high || 0) > 0).length
  const cleanScansCount = scans.filter(
    (s) =>
      ((s.findingsCount.critical || 0) +
        (s.findingsCount.high || 0) +
        (s.findingsCount.medium || 0) +
        (s.findingsCount.low || 0)) ===
      0
  ).length

  // Filter Logic
  const filteredScans = useMemo(() => {
    let result = [...scans]

    if (!statusFilters.includes('all') && statusFilters.length > 0) {
      result = result.filter((s) => statusFilters.includes(s.status))
    }

    if (!targetFilters.includes('all') && targetFilters.length > 0) {
      result = result.filter((s) => targetFilters.includes(s.targetId))
    }

    if (!profileFilters.includes('all') && profileFilters.length > 0) {
      result = result.filter((s) => s.profile && profileFilters.includes(s.profile))
    }

    if (!findingFilters.includes('all') && findingFilters.length > 0) {
      result = result.filter((s) => {
        const crit = s.findingsCount.critical || 0
        const high = s.findingsCount.high || 0
        const total =
          crit + high + (s.findingsCount.medium || 0) + (s.findingsCount.low || 0)
        let match = false
        if (findingFilters.includes('has_critical') && crit > 0) match = true
        if (findingFilters.includes('has_high') && high > 0) match = true
        if (findingFilters.includes('clean') && total === 0) match = true
        return match
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.targetName.toLowerCase().includes(q) ||
          s.targetUrl.toLowerCase().includes(q) ||
          (s.profile && s.profile.toLowerCase().includes(q))
      )
    }

    // Sort Logic
    if (sortField) {
      result.sort((a, b) => {
        let valA: unknown = (a as unknown as Record<string, unknown>)[sortField]
        let valB: unknown = (b as unknown as Record<string, unknown>)[sortField]

        if (sortField === 'startedAt') {
          valA = new Date(a.startedAt).getTime()
          valB = new Date(b.startedAt).getTime()
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
  }, [scans, statusFilters, targetFilters, profileFilters, findingFilters, searchQuery, sortField, sortDirection])

  const pagedScans = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredScans.slice(start, start + pageSize)
  }, [filteredScans, currentPage, pageSize])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Column Schema for Enriched Scans (Proper Case headers & Live Scans status format)
  const columns: DataTableColumn<EnrichedScan>[] = [
    {
      id: 'id',
      header: 'ID',
      width: '110px',
      sortable: true,
      cell: (scan) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleInspectScan(scan)
          }}
          className="font-mono text-xs font-semibold text-status-blue hover:text-heading hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors group text-left"
          title={`Inspect scan #${scan.id}`}
        >
          <span>#{scan.id}</span>
          <ArrowUpRight className="size-icon-xs opacity-0 group-hover:opacity-100 transition-opacity text-status-blue shrink-0" />
        </button>
      ),
    },
    {
      id: 'targetId',
      header: 'Target ID',
      width: '110px',
      sortable: true,
      cell: (scan) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/targets?targetId=${scan.targetId}`)
          }}
          className="font-mono text-xs font-semibold text-status-blue hover:text-heading hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors group text-left"
          title={`Target #${scan.targetId} (${scan.targetName})`}
        >
          <span>#{scan.targetId}</span>
          <ArrowUpRight className="size-icon-xs opacity-0 group-hover:opacity-100 transition-opacity text-status-blue shrink-0" />
        </button>
      ),
    },
    {
      id: 'targetUrl',
      header: 'Target URL',
      width: '240px',
      minWidth: '220px',
      sortable: true,
      cell: (scan) => (
        <span className="text-heading font-mono text-xs font-medium truncate block w-full" title={scan.targetUrl}>
          {scan.targetUrl}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '110px',
      sortable: true,
      cell: (scan) => {
        let textColor = 'text-status-green'
        let label = 'Completed'
        if (scan.status === 'running') {
          textColor = 'text-status-blue'
          label = scan.phase || (scan.progress > 50 ? 'Auditing' : 'Crawling')
        } else if (scan.status === 'queued') {
          textColor = 'text-status-yellow'
          label = 'Queued'
        } else if (scan.status === 'failed') {
          textColor = 'text-status-red'
          label = 'Failed'
        } else if (scan.status === 'cancelled') {
          textColor = 'text-caption'
          label = 'Cancelled'
        }
        return (
          <span className={`text-xs font-semibold ${textColor}`}>
            {label}
          </span>
        )
      },
    },
    {
      id: 'profile',
      header: 'Profile',
      width: '130px',
      sortable: true,
      cell: (scan) => {
        const label =
          scan.profile === 'api_security'
            ? 'API Security'
            : scan.profile === 'quick_recon'
            ? 'Quick Recon'
            : 'OWASP Top 10'
        return (
          <span className="text-xs text-desc font-medium">
            {label}
          </span>
        )
      },
    },
    {
      id: 'progress',
      header: 'Progress',
      width: '130px',
      sortable: true,
      cell: (scan) => (
        <div className="w-full max-w-[120px] flex items-center gap-2">
          <div className="flex-1 bg-surface h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                scan.status === 'completed'
                  ? 'bg-status-green'
                  : scan.status === 'failed'
                  ? 'bg-status-red'
                  : 'bg-heading'
              }`}
              style={{ width: `${scan.progress}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-desc w-7 text-right">
            {scan.progress}%
          </span>
        </div>
      ),
    },
    {
      id: 'findingsCount',
      header: 'Findings',
      width: '180px',
      cell: (scan) => {
        const crit = scan.findingsCount.critical || 0
        const high = scan.findingsCount.high || 0
        const med = scan.findingsCount.medium || 0
        const low = scan.findingsCount.low || 0
        return (
          <div className="flex flex-col text-xs text-desc leading-tight">
            <div className="flex items-center gap-2.5 whitespace-nowrap">
              <span>{crit} Critical</span>
              <span>{high} High</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap mt-0.5">
              <span>{med} Medium</span>
              {low > 0 && <span>{low} Low</span>}
            </div>
          </div>
        )
      },
    },
    {
      id: 'durationSec',
      header: 'Duration',
      width: '100px',
      sortable: true,
      cell: (scan) => {
        const min = Math.floor(scan.durationSec / 60)
        const sec = scan.durationSec % 60
        return (
          <span className="font-mono text-desc text-xs">
            {min}m {String(sec).padStart(2, '0')}s
          </span>
        )
      },
    },
    {
      id: 'startedAt',
      header: 'Started',
      width: '130px',
      sortable: true,
      cell: (scan) => (
        <span className="text-desc font-mono text-[11px]">
          {new Date(scan.startedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '80px',
      align: 'center',
      cell: (scan) => (
        <TableRowActions
          actions={[
            {
              label: 'Inspect',
              icon: <Eye className="size-icon-xs text-desc" />,
              onClick: () => {
                handleInspectScan(scan)
              },
            },
            {
              label: 'Rerun',
              icon: <RotateCcw className="size-icon-xs text-desc" />,
              onClick: () => {
                addScan({ targetId: scan.targetId, profile: scan.profile })
              },
            },
            {
              label: 'Delete',
              icon: <Trash2 className="size-icon-xs text-status-red" />,
              danger: true,
              onClick: () => {
                setScans(rawScans.filter((s) => s.id !== scan.id))
                if (scanIdParam === scan.id) {
                  handleCloseDrawer()
                }
              },
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="w-full">
      {/* Centralized High-Density Data Table */}
      <DataTable<EnrichedScan>
        columns={columns}
        data={pagedScans}
        keyExtractor={(item) => item.id}
        maxHeight="max-h-table-view"
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search scans by ID, target asset, or profile..."
        totalRecords={scans.length}
        recordsLabel="scans"
        filters={[
          {
            id: 'status',
            label: 'Status',
            selectedValues: statusFilters,
            onChange: (val) => {
              const selected = Array.isArray(val) ? val : [val]
              setStatusFilters(selected)
              const nextParams = new URLSearchParams(searchParams)
              const lastPicked = selected.find((v) => v !== 'all')
              if (lastPicked && !selected.includes('all') && selected.length === 1) {
                nextParams.set('status', lastPicked)
              } else {
                nextParams.delete('status')
              }
              setSearchParams(nextParams)
              setCurrentPage(1)
            },
            options: [
              { label: 'All Statuses', value: 'all', count: scans.length },
              { label: 'Running', value: 'running', count: runningCount },
              { label: 'Queued', value: 'queued', count: queuedCount },
              { label: 'Completed', value: 'completed', count: completedScans.length },
              { label: 'Failed', value: 'failed', count: failedCount },
              { label: 'Cancelled', value: 'cancelled', count: scans.filter((s) => s.status === 'cancelled').length },
            ],
          },
          {
            id: 'target',
            label: 'Target',
            selectedValues: targetFilters,
            onChange: (val) => {
              const selected = Array.isArray(val) ? val : [val]
              setTargetFilters(selected)
              const nextParams = new URLSearchParams(searchParams)
              const lastPicked = selected.find((v) => v !== 'all')
              if (lastPicked && !selected.includes('all')) {
                nextParams.set('targetId', lastPicked)
              } else {
                nextParams.delete('targetId')
              }
              setSearchParams(nextParams)
              setCurrentPage(1)
            },
            options: targetFilterOptions,
          },
          {
            id: 'profile',
            label: 'Profile',
            selectedValues: profileFilters,
            onChange: (val) => {
              setProfileFilters(Array.isArray(val) ? val : [val])
              setCurrentPage(1)
            },
            options: [
              { label: 'All Profiles', value: 'all', count: scans.length },
              { label: 'OWASP Top 10', value: 'owasp_top10', count: scans.filter((s) => s.profile === 'owasp_top10').length },
              { label: 'API Security', value: 'api_security', count: scans.filter((s) => s.profile === 'api_security').length },
              { label: 'Quick Recon', value: 'quick_recon', count: scans.filter((s) => s.profile === 'quick_recon').length },
            ],
          },
          {
            id: 'findings',
            label: 'Outcome',
            selectedValues: findingFilters,
            onChange: (val) => {
              setFindingFilters(Array.isArray(val) ? val : [val])
              setCurrentPage(1)
            },
            options: [
              { label: 'All Outcomes', value: 'all', count: scans.length },
              { label: 'Has Critical', value: 'has_critical', count: criticalFindingsCount },
              { label: 'Has High', value: 'has_high', count: highFindingsCount },
              { label: 'Clean Scans', value: 'clean', count: cleanScansCount },
            ],
          },
        ]}
        emptyTitle="No scans found"
        emptyDescription="No scan executions match your selected status, target, or search criteria."
        emptyAction={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setStatusFilters(['all'])
              setTargetFilters(['all'])
              setProfileFilters(['all'])
              setFindingFilters(['all'])
              setSearchParams({})
              setCurrentPage(1)
            }}
          >
            Clear filters
          </Button>
        }
        onResetFilters={() => {
          setSearchQuery('')
          setStatusFilters(['all'])
          setTargetFilters(['all'])
          setProfileFilters(['all'])
          setFindingFilters(['all'])
          setSearchParams({})
          setCurrentPage(1)
        }}
        pagination={{
          currentPage,
          pageSize: 10,
          totalItems: filteredScans.length,
          onPageChange: handlePageChange,
        }}
      />

      {/* Slide-over Inspection Drawer (Triggered by ID link, Actions Inspect, or URL ?scanId=...) */}
      <ScanDetailDrawer
        scan={activeSelectedScan}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onCancelScan={(id) => cancelScan(id)}
        onRerunScan={(s) => addScan({ targetId: s.targetId, profile: s.profile })}
      />
    </div>
  )
}
