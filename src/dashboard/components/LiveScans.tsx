import ScansView from '../../scans/ScansView'

export default function LiveScans() {
  return (
    <div className="w-full">
      <ScansView
        title="Active Scans Monitor"
        subtitle="Live running and queued scans in progress"
        initialStatusFilter={['running', 'queued']}
        hideFilterBar={true}
        hidePagination={true}
        maxHeight="max-h-[360px]"
      />
    </div>
  )
}
