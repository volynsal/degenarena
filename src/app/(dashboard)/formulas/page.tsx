'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useFormulas } from '@/lib/hooks/use-formulas'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, MoreVertical, TrendingUp, Target, Eye, EyeOff, Play, Pause, Trash2, Loader2 } from 'lucide-react'

export default function FormulasPage() {
  const { formulas, isLoading, error, toggleActive, deleteFormula } = useFormulas()
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await toggleActive(id, !currentActive)
    setMenuOpen(null)
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this formula?')) return
    setDeletingId(id)
    await deleteFormula(id)
    setDeletingId(null)
    setMenuOpen(null)
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">My Formulas</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">Create and manage your token-finding strategies</p>
        </div>
        <Link href="/formulas/new" className="block sm:w-fit">
          <Button variant="primary" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Formula
          </Button>
        </Link>
      </div>
      
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}
      
      {/* Formula cards */}
      {formulas.length > 0 && (
        <div className="grid gap-4">
          {formulas.map((formula) => (
            <Card key={formula.id} hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      formula.is_active 
                        ? 'bg-arena-cyan/20' 
                        : 'bg-white/5'
                    }`}>
                      {formula.is_active ? (
                        <Play className="w-5 h-5 text-arena-cyan" fill="currentColor" />
                      ) : (
                        <Pause className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{formula.name}</h3>
                        {formula.is_public ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-arena-purple/20 text-arena-purple text-xs">
                            <Eye className="w-3 h-3" />
                            Public
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-gray-400 text-xs">
                            <EyeOff className="w-3 h-3" />
                            Private
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {formula.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setMenuOpen(menuOpen === formula.id ? null : formula.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {menuOpen === formula.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-arena-dark border border-white/10 rounded-lg shadow-xl py-1 z-10">
                        <button
                          onClick={() => handleToggleActive(formula.id, formula.is_active)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5"
                        >
                          {formula.is_active ? (
                            <>
                              <Pause className="w-4 h-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(formula.id)}
                          disabled={deletingId === formula.id}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingId === formula.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Target className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Matches</p>
                      <p className="text-white font-mono">{formula.total_matches}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Win Rate</p>
                      <p className="text-white font-mono">{formula.win_rate}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-arena-cyan/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-arena-cyan" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Avg Return</p>
                      <p className={`font-mono ${formula.avg_return >= 0 ? 'text-arena-cyan' : 'text-red-400'}`}>
                        {formula.avg_return >= 0 ? '+' : ''}{formula.avg_return}%
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
                  <Link href={`/formulas/${formula.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Edit Formula
                    </Button>
                  </Link>
                  <Link href={`/formulas/${formula.id}/matches`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full">
                      View Matches
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Empty state */}
      {formulas.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No formulas yet</h3>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto">
            Create your first formula to start finding tokens that match your criteria.
          </p>
          <Link href="/formulas/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Formula
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
