import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'

export const API_ENDPOINT_STORAGE_KEY = 'api_configuration_endpoint'

export function loadApiEndpoint(): string {
  try {
    return localStorage.getItem(API_ENDPOINT_STORAGE_KEY) || 'https://api.scanner.internal/v1'
  } catch {
    return 'https://api.scanner.internal/v1'
  }
}

export function saveApiEndpoint(endpoint: string): void {
  try {
    localStorage.setItem(API_ENDPOINT_STORAGE_KEY, endpoint)
  } catch (err) {
    console.error('Failed to save API endpoint', err)
  }
}

export default function ApiSettingsView() {
  const [endpoint, setEndpoint] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEndpoint(loadApiEndpoint())
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!endpoint.trim()) {
      setError('Please provide a valid API endpoint URL.')
      return
    }

    saveApiEndpoint(endpoint.trim())
    setError(null)
    setIsSaved(true)

    setTimeout(() => {
      setIsSaved(false)
    }, 2500)
  }

  return (
    <div className="w-full space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-heading">
            API Configuration
          </h1>
          <p className="text-base text-desc mt-1">
            Configure the engine connection endpoint
          </p>
        </div>
      </div>

      {/* API Configuration Form */}
      <div className="w-full max-w-xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="w-full sm:w-80 md:w-96">
            <label
              htmlFor="api-endpoint-input"
              className="block text-xs font-semibold text-heading mb-2"
            >
              API Endpoint URL
            </label>
            <Input
              id="api-endpoint-input"
              type="text"
              value={endpoint}
              onChange={(e) => {
                setEndpoint(e.target.value)
                if (error) setError(null)
                if (isSaved) setIsSaved(false)
              }}
              placeholder="https://api.scanner.internal/v1"
              className="py-2.5 text-xs font-mono"
            />
          </div>

          {/* Plain text status error matching design */}
          {error && (
            <p className="text-xs font-semibold text-status-red">
              {error}
            </p>
          )}

          {/* Save Action Button */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="cursor-pointer"
            >
              <span>Save</span>
            </Button>

            {isSaved && (
              <span className="inline-flex items-center gap-1.5 text-xs text-status-green font-medium">
                <CheckCircle2 className="size-icon-xs" />
                <span>Saved successfully</span>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
