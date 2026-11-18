import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Download, Trash2, ArrowUpRight } from 'lucide-react'
import { DataTable, TableRowActions } from '../components/table'
import type { DataTableColumn } from '../components/table/types'
import { useEnrichedReports, useAppStore } from '../store/useAppStore'
import type { EnrichedReport } from '../types/schema'
import DownloadReportDrawer from '../findings/DownloadReportDrawer'
import ReportDetailDrawer from './ReportDetailDrawer'

export default function ReportsView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const frameworkParam = searchParams.get('framework')
  const reportIdParam = searchParams.get('reportId')

  const reports = useEnrichedReports()
  const deleteReport = useAppStore((state) => state.deleteReport)
  const findings = useAppStore((state) => state.findings)

  // Derive inspected report from URL parameter ?reportId=...
  const activeInspectedReport = useMemo(() => {
    if (!reportIdParam) return null
    return reports.find((r) => r.id === reportIdParam) || null
  }, [reports, reportIdParam])

  const handleInspectReport = (report: EnrichedReport) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('reportId', report.id)
    setSearchParams(nextParams)
  }

  const handleCloseInspect = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('reportId')
    setSearchParams(nextParams)
  }

  // Local state for interactive filtering & pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [frameworkFilters, setFrameworkFilters] = useState<string[]>(
    frameworkParam ? [frameworkParam] : ['all']
  )
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [sortField, setSortField] = useState<string | null>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isDownloadDrawerOpen, setIsDownloadDrawerOpen] = useState(false)

  // Dynamic Framework Filter Options with counts
  const frameworkFilterOptions = useMemo(() => {
    const unique = Array.from(new Set(reports.map((r) => r.framework || 'OWASP Top 10 Audit')))
    return [
      { label: 'All Frameworks', value: 'all', count: reports.length },
      ...unique.map((fw) => ({
        label: fw,
        value: fw,
        count: reports.filter((r) => (r.framework || 'OWASP Top 10 Audit') === fw).length,
      })),
    ]
  }, [reports])

  // Filter & Sort Logic (PDF reports only)
  const filteredReports = useMemo(() => {
    let result = [...reports]

    if (!frameworkFilters.includes('all') && frameworkFilters.length > 0) {
      result = result.filter((r) =>
        frameworkFilters.includes(r.framework || 'OWASP Top 10 Audit')
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.target.toLowerCase().includes(q) ||
          (r.framework && r.framework.toLowerCase().includes(q)) ||
          r.scanId.toLowerCase().includes(q)
      )
    }

    if (sortField) {
      result.sort((a, b) => {
        let valA: unknown = (a as unknown as Record<string, unknown>)[sortField]
        let valB: unknown = (b as unknown as Record<string, unknown>)[sortField]

        if (sortField === 'createdAt') {
          valA = new Date(a.createdAt || 0).getTime()
          valB = new Date(b.createdAt || 0).getTime()
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
  }, [reports, frameworkFilters, searchQuery, sortField, sortDirection])

  const pagedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredReports.slice(start, start + pageSize)
  }, [filteredReports, currentPage, pageSize])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleDownloadPdf = (_report: EnrichedReport) => {
    setIsDownloadDrawerOpen(true)
  }

  // Column definitions for Security Evaluation PDF Reports
  const columns: DataTableColumn<EnrichedReport>[] = [
    {
      id: 'id',
      header: 'ID',
      width: '100px',
      sortable: true,
      cell: (report) => (
        <button
          type="button"
          onClick={() => handleInspectReport(report)}
          className="font-mono text-xs font-semibold text-status-blue hover:text-heading hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors group text-left"
          title={`Preview Report #${report.id}`}
        >
          <span>#{report.id}</span>
          <ArrowUpRight className="size-icon-xs opacity-0 group-hover:opacity-100 transition-opacity text-status-blue shrink-0" />
        </button>
      ),
    },
    {
      id: 'title',
      header: 'Report Title & Target',
      sortable: true,
      cell: (report) => (
        <div
          onClick={() => handleInspectReport(report)}
          className="flex flex-col min-w-0 cursor-pointer group"
        >
          <span className="text-xs font-semibold text-heading truncate group-hover:underline">
            {report.title}
          </span>
          <span className="text-[11px] text-caption truncate mt-0.5">
            {report.target}
          </span>
        </div>
      ),
    },
    {
      id: 'framework',
      header: 'Framework',
      width: '240px',
      sortable: true,
      cell: (report) => (
        <span className="text-xs text-desc font-medium truncate block">
          {report.framework || 'OWASP Top 10 Audit'}
        </span>
      ),
    },
    {
      id: 'scanId',
      header: 'Scan ID',
      width: '110px',
      sortable: true,
      cell: (report) => (
        <span className="font-mono text-xs text-desc">
          #{report.scanId}
        </span>
      ),
    },
    {
      id: 'findingIds',
      header: 'Included Finding IDs',
      sortable: false,
      cell: (report) => {
        const ids = report.findingIds && report.findingIds.length > 0
          ? report.findingIds
          : findings.filter((f) => f.scanId === report.scanId).slice(0, 5).map((f) => f.id)

        if (ids.length === 0) {
          return <span className="text-caption text-xs font-mono">—</span>
        }

        return (
          <div className="flex flex-wrap items-center gap-1.5 max-w-[280px]">
            {ids.map((id) => (
              <button
                key={id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/findings?findingId=${id}`)
                }}
                className="font-mono text-[11px] font-semibold text-status-blue hover:text-heading hover:underline cursor-pointer inline-flex items-center gap-0.5 group/fnd"
                title={`Navigate to Finding #${id}`}
              >
                <span>#{id}</span>
                <ArrowUpRight className="size-2.5 opacity-0 group-hover/fnd:opacity-100 transition-opacity text-status-blue shrink-0" />
              </button>
            ))}
          </div>
        )
      },
    },
    {
      id: 'createdAt',
      header: 'Generated Date',
      width: '130px',
      sortable: true,
      cell: (report) => (
        <span className="text-desc font-mono text-[11px]">
          {new Date(report.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '80px',
      align: 'center',
      cell: (report) => (
        <TableRowActions
          actions={[
            {
              label: 'Generate report',
              icon: <Download className="size-icon-xs text-desc" />,
              onClick: () => handleDownloadPdf(report),
            },
            {
              label: 'Delete Report',
              icon: <Trash2 className="size-icon-xs text-status-red" />,
              danger: true,
              onClick: () => deleteReport(report.id),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="w-full">
      <DataTable<EnrichedReport>
        columns={columns}
        data={pagedReports}
        keyExtractor={(item) => item.id}
        maxHeight="max-h-table-view"
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search reports by ID, title, target, or framework..."
        totalRecords={reports.length}
        recordsLabel="reports"
        filters={[
          {
            id: 'framework',
            label: 'Framework',
            selectedValues: frameworkFilters,
            onChange: (val) => {
              const selected = Array.isArray(val) ? val : [val]
              setFrameworkFilters(selected)
              const nextParams = new URLSearchParams(searchParams)
              const lastPicked = selected.find((v) => v !== 'all')
              if (lastPicked && !selected.includes('all') && selected.length === 1) {
                nextParams.set('framework', lastPicked)
              } else {
                nextParams.delete('framework')
              }
              setSearchParams(nextParams)
              setCurrentPage(1)
            },
            options: frameworkFilterOptions,
          },
        ]}
        onResetFilters={() => {
          setSearchQuery('')
          setFrameworkFilters(['all'])
          setSearchParams({})
          setCurrentPage(1)
        }}
        pagination={{
          currentPage,
          pageSize: 10,
          totalItems: filteredReports.length,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Download / Generate Custom PDF Report Drawer */}
      <DownloadReportDrawer
        isOpen={isDownloadDrawerOpen}
        onClose={() => setIsDownloadDrawerOpen(false)}
        findings={findings as any}
      />

      {/* Right Sidebar PDF Live Preview Drawer */}
      <ReportDetailDrawer
        report={activeInspectedReport}
        isOpen={Boolean(activeInspectedReport)}
        onClose={handleCloseInspect}
      />
    </div>
  )
}
