'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { MessageSquare, Send, CheckCircle } from 'lucide-react'

const categories = [
  { id: 'bug', label: 'Bug Report' },
  { id: 'feature', label: 'Feature Request' },
  { id: 'improvement', label: 'Improvement' },
  { id: 'other', label: 'Other' },
]

export default function FeedbackPage() {
  const [category, setCategory] = useState('feature')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: message.trim() }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to submit feedback. Please try again.')
        return
      }

      setIsSubmitted(true)
      setMessage('')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-arena-cyan/20 flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-arena-cyan" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Thank you!</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Your feedback has been submitted. We read every single submission and it directly shapes what we build next.
            </p>
            <Button variant="primary" onClick={() => setIsSubmitted(false)}>
              Submit More Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-6 h-6 text-arena-cyan" />
          <h1 className="text-2xl font-bold text-white">Submit Feedback</h1>
        </div>
        <p className="text-gray-400">
          Help us make DegenArena HQ better. Bug reports, feature requests, ideas — we want to hear it all.
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      category === cat.id
                        ? 'bg-gradient-to-r from-arena-purple to-arena-cyan text-white'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your feedback
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={6}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-arena-purple/50 focus:border-arena-purple/50 resize-none transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
              Submit Feedback
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
