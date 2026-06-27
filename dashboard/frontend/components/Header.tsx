'use client'

import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { LogoSVG } from '@/components/LogoSVG'

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A] border-b border-[#1E293B] h-[56px]">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-0">
          {showBack && (
            <>
              <Link href="/" className="text-[#64748B] hover:text-[#94A3B8] flex items-center gap-2 text-[13px]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Dashboard</span>
              </Link>
              <div className="border-r border-[#1E293B] pr-3 mr-3"></div>
            </>
          )}
          <LogoSVG height={44} />
        </div>

        {/* Center section */}
        {lastDeployAt && (
          <div className="flex items-center gap-3">
            <span className="text-[#94A3B8] text-[13px]">Last deploy:</span>
            <span className="text-[#94A3B8] text-[13px]">{formatDate(lastDeployAt)}</span>
            {typeof lastDeployPassed === 'boolean' && (
              <div style={{
                background: lastDeployPassed ? '#22C55E15' : '#EF444415',
                border: `1px solid ${lastDeployPassed ? '#22C55E40' : '#EF444440'}`,
                color: lastDeployPassed ? '#22C55E' : '#EF4444',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600
              }}>
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
