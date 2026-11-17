import Input from '../ui/Input'

export default function ApiSettingsView() {
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

      {/* API Key Form Field */}
      <div className="w-full max-w-xl">
        <div className="space-y-4">
          <div className="w-full sm:w-80 md:w-96">
            <label
              htmlFor="api-key-input"
              className="block text-xs font-semibold text-heading mb-2"
            >
              API key
            </label>
            <div title="Currently in demo mode. No key is stored.">
              <Input
                id="api-key-input"
                type="text"
                value=""
                readOnly
                disabled
                placeholder="Available with a connected backend"
                className="py-2.5 text-xs font-mono opacity-60 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-desc mt-1.5">
              Not connected in this demo. No key is stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
