'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/AuthProvider'

function ShieldIcon() {
  return (
    <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

interface HeaderProps {
  lastDeployAt?: string | null
  lastDeployPassed?: boolean
  showBack?: boolean
}

export default function Header({ lastDeployAt, lastDeployPassed, showBack = false }: HeaderProps) {
  const { user, logout } = useAuth()

  const formatDate = (d: string | Date) => {
    const date = new Date(d)
    return date.toUTCString().replace(/:\d{2} GMT/, ' UTC').replace(/\w+, /, '')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A] border-b border-[#1E293B] h-14">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {showBack && (
            <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span className="text-sm">Dashboard</span>
            </Link>
          )}
          <Image
            src="/chainguard-logo-transparent.svg"
            alt="ChainGuard"
            width={140}
            height={32}
            priority
          />
        </div>

        {/* Center section */}
        {lastDeployAt && (
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs">Last deploy:</span>
            <span className="text-white text-xs font-medium">{formatDate(lastDeployAt)}</span>
            {typeof lastDeployPassed === 'boolean' && (
              <div className={`px-2 py-0.5 rounded text-xs font-medium border ${
                lastDeployPassed
                  ? 'bg-[#22C55E20] text-[#22C55E] border-[#22C55E40]'
                  : 'bg-[#EF444420] text-[#EF4444] border-[#EF444440]'
              }`}>
                {lastDeployPassed ? 'PASS' : 'FAIL'}
              </div>
            )}
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-4">
          {user && (
            <>
              {user.avatar && (
                <img src={user.avatar} alt={user.login} className="w-7 h-7 rounded-full" />
              )}
              <span className="text-white text-sm">{user.name || user.login}</span>
              <button
                onClick={logout}
                className="text-slate-400 text-sm hover:text-white transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
