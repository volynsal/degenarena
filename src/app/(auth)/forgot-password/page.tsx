'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { FlowField } from '@/components/landing/FlowField'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      })

      if (error) throw error
      setIsSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-arena-darker relative">
      <FlowField />
      <div className="absolute inset-0 grid-pattern" style={{ zIndex: 1 }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-arena-purple/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-arena-cyan/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold gradient-text font-brand">DegenArena HQ</span>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            {isSent ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-arena-cyan mx-auto mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
                <p className="text-gray-400 mb-6">
                  We sent a password reset link to <strong className="text-white">{email}</strong>.
                  Click the link in the email to reset your password.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Didn&apos;t receive it? Check your spam folder or try again.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => { setIsSent(false); setEmail('') }}
                    className="w-full"
                  >
                    Try another email
                  </Button>
                  <Link href="/login">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-white mb-2">Reset your password</h1>
                  <p className="text-gray-400 text-sm">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send reset link
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to login
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
