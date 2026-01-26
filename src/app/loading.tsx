import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-arena-darker flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-arena-cyan animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  )
}
