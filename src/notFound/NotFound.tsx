import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-full bg-canvas flex flex-col items-center justify-center p-6 text-center select-none">
      {/* 404 Header and Description matching design wireframe */}
      <div className="max-w-md flex flex-col items-center">
        <h1 className="text-h1 text-heading tracking-tight mb-3">
          This page doesn&#39;t exist
        </h1>
        <p className="text-base text-desc leading-relaxed mb-6">
          It may have been moved, removed, or never existed.
        </p>

        {/* Action Button: Return to Dashboard */}
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/dashboard')}
        >
          Back to dashboard
        </Button>
      </div>
    </div>
  )
}