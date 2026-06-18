/**
 * PortalStandalone - A minimal, always-on-top portal widget.
 *
 * This component renders in popout windows (Document PiP, popup, or standalone PWA).
 * It communicates with the main GhostWriter window via BroadcastChannel.
 *
 * Features:
 *  - Toggle capture on/off
 *  - Show live status (active, mode, fps)
 *  - Open vault in main window
 *  - Lock/unlock vault
 *  - Draggable within the popout window
 *  - Compact design for small window / always-on-top
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  sendPortalMessage,
  onPortalMessage,
  type PortalState,
  type PortalMessage,
} from '@/lib/portal-channel'
import { useCaptureLog } from '@/hooks/use-capture-log'
import { clearCaptureEntries } from '@/lib/capture-store'
import { Logo } from './Logo'

const DEFAULT_STATE: PortalState = {
  isActive: false,
  vaultUnlocked: true,
}

export function PortalStandalone() {
  const [state, setState] = useState<PortalState>(DEFAULT_STATE)
  const [connected, setConnected] = useState(false)
  const [showExpanded, setShowExpanded] = useState(false)
  const captureEntries = useCaptureLog()
  const logEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll the capture log to the top when new entries arrive
  useEffect(() => {
    // no-op: newest entries are at the top, so no scroll needed
  }, [captureEntries.length])

  // Listen for state updates from the main window
  useEffect(() => {
    const unsubscribe = onPortalMessage((msg: PortalMessage) => {
      if (msg.type === 'STATE_UPDATE') {
        setState(msg.payload)
        setConnected(true)
      }
    })

    // Let the main window know we're ready
    sendPortalMessage({ type: 'PORTAL_READY' })

    // Request current state
    const timer = setTimeout(() => {
      sendPortalMessage({ type: 'REQUEST_STATE' })
    }, 300)

    // Notify main window on close
    const handleUnload = () => {
      sendPortalMessage({ type: 'PORTAL_CLOSED' })
    }
    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)

    return () => {
      unsubscribe()
      clearTimeout(timer)
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('pagehide', handleUnload)
    }
  }, [])

  const handleToggle = useCallback(() => {
    sendPortalMessage({ type: 'TOGGLE_PORTAL' })
    // Optimistic update
    setState(prev => ({ ...prev, isActive: !prev.isActive }))
  }, [])

  const handleOpenVault = useCallback(() => {
    sendPortalMessage({ type: 'OPEN_VAULT' })
  }, [])

  const handleToggleVault = useCallback(() => {
    sendPortalMessage({ type: 'TOGGLE_VAULT' })
    setState(prev => ({ ...prev, vaultUnlocked: !prev.vaultUnlocked }))
  }, [])

  return (
    <div
      className="portal-standalone"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, oklch(0.08 0.03 260), oklch(0.10 0.04 280))',
        color: 'oklch(0.95 0.01 200)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        overflow: 'hidden',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Ambient glow background */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: '-30%',
          width: '160%',
          height: '160%',
          background: state.isActive
            ? 'radial-gradient(ellipse at 50% 40%, oklch(0.72 0.22 160 / 0.06), transparent 60%)'
            : 'none',
          pointerEvents: 'none',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Header */}
      <div
        style={
          {
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid oklch(0.22 0.03 270 / 0.5)',
            background: 'oklch(0.10 0.03 265 / 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitAppRegion: 'drag', // Allow dragging the PiP window from the header
            cursor: 'move',
            position: 'relative',
            zIndex: 1,
          } as React.CSSProperties
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo size={28} animated={state.isActive} />
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #00F5A0, #00D1FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              GhostWriter
            </div>
            <div style={{ fontSize: '10px', color: 'oklch(0.50 0.02 220)', fontWeight: 500 }}>
              {connected ? 'Connected' : 'Connecting...'}
            </div>
          </div>
        </div>

        {/* Connection indicator */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: connected ? 'oklch(0.72 0.22 160)' : 'oklch(0.50 0.18 75)',
            boxShadow: connected
              ? '0 0 8px oklch(0.72 0.22 160 / 0.6)'
              : '0 0 8px oklch(0.50 0.18 75 / 0.6)',
          }}
        />
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
          zIndex: 1,
          overflowY: 'auto',
        }}
      >
        {/* Big toggle button */}
        <button
          onClick={handleToggle}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'inherit',
            transition: 'all 0.3s ease',
            background: state.isActive
              ? 'linear-gradient(135deg, oklch(0.72 0.22 160 / 0.2), oklch(0.62 0.20 200 / 0.2))'
              : 'oklch(0.16 0.02 265)',
            color: state.isActive ? 'oklch(0.85 0.18 160)' : 'oklch(0.60 0.02 220)',
            border: state.isActive
              ? '2px solid oklch(0.72 0.22 160 / 0.3)'
              : '2px solid oklch(0.25 0.02 270)',
            boxShadow: state.isActive
              ? '0 0 20px oklch(0.72 0.22 160 / 0.15), inset 0 0 20px oklch(0.72 0.22 160 / 0.05)'
              : 'none',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: state.isActive ? 'oklch(0.72 0.22 160)' : 'oklch(0.40 0.02 260)',
              boxShadow: state.isActive ? '0 0 10px oklch(0.72 0.22 160 / 0.5)' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
          {state.isActive ? 'Widget highlighted' : 'Widget inactive'}
        </button>

        {/* Status pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <StatusPill label="Portal" active={state.isActive} color="oklch(0.72 0.22 160)" />
          <StatusPill label="Vault" active={state.vaultUnlocked} color="oklch(0.75 0.18 195)" />
        </div>

        {/* ── Live Capture Log ── */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '10px',
            border: '1px solid oklch(0.22 0.03 270 / 0.5)',
            background: 'oklch(0.10 0.02 265)',
            overflow: 'hidden',
          }}
        >
          {/* Log header */}
          <div
            style={{
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid oklch(0.22 0.03 270 / 0.3)',
              background: 'oklch(0.12 0.025 265)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: state.isActive ? 'oklch(0.72 0.22 160)' : 'oklch(0.40 0.02 260)',
                  boxShadow: state.isActive ? '0 0 6px oklch(0.72 0.22 160 / 0.5)' : 'none',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'oklch(0.70 0.02 220)' }}>
                Capture Log
              </span>
              <span style={{ fontSize: '10px', color: 'oklch(0.45 0.02 220)' }}>
                ({captureEntries.length})
              </span>
            </div>
            {captureEntries.length > 0 && (
              <button
                onClick={() => clearCaptureEntries()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'oklch(0.50 0.02 220)',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'oklch(0.60 0.24 25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'oklch(0.50 0.02 220)'
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Scrollable log entries */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            {captureEntries.length === 0 ? (
              <div
                style={{
                  padding: '20px 12px',
                  textAlign: 'center',
                  color: 'oklch(0.40 0.02 220)',
                  fontSize: '11px',
                }}
              >
                Add text from the main app (paste, screenshot OCR, extension). Entries sync here.
              </div>
            ) : (
              captureEntries.slice(0, 50).map(entry => (
                <div
                  key={entry.id}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'oklch(0.14 0.025 265)',
                    border: '1px solid oklch(0.20 0.02 270 / 0.3)',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    animation: 'fadeIn 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '3px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        color: 'oklch(0.72 0.22 160)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'oklch(0.72 0.22 160 / 0.1)',
                      }}
                    >
                      {entry.sourceApp}
                    </span>
                    <span style={{ fontSize: '9px', color: 'oklch(0.40 0.02 220)' }}>
                      {entry.capturedAt}
                    </span>
                  </div>
                  <div
                    style={{
                      color: 'oklch(0.80 0.01 200)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {entry.content}
                  </div>
                  {entry.tags.length > 0 && (
                    <div
                      style={{ display: 'flex', gap: '3px', marginTop: '3px', flexWrap: 'wrap' }}
                    >
                      {entry.tags.map(tag => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '8px',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: 'oklch(0.18 0.03 270)',
                            color: 'oklch(0.55 0.02 220)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Expandable controls */}
        <button
          onClick={() => setShowExpanded(!showExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: 'oklch(0.50 0.02 220)',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 0',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          {showExpanded ? '▾ Hide controls' : '▸ More controls'}
        </button>

        {showExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <ActionButton
                label={state.vaultUnlocked ? '🔓 Lock Vault' : '🔒 Unlock'}
                onClick={handleToggleVault}
              />
              <ActionButton label="📦 Open Vault" onClick={handleOpenVault} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '6px 16px',
          borderTop: '1px solid oklch(0.22 0.03 270 / 0.3)',
          background: 'oklch(0.08 0.03 260 / 0.8)',
          fontSize: '10px',
          color: 'oklch(0.40 0.02 220)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {captureEntries.length} entries captured
      </div>
    </div>
  )
}

function StatusPill({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '99px',
        background: active
          ? `color-mix(in oklch, ${color} 10%, transparent)`
          : 'oklch(0.14 0.02 265)',
        border: `1px solid ${active ? `color-mix(in oklch, ${color} 25%, transparent)` : 'oklch(0.22 0.02 270 / 0.5)'}`,
        fontSize: '10px',
        fontWeight: 600,
        color: active ? color : 'oklch(0.45 0.02 220)',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: active ? color : 'oklch(0.35 0.02 260)',
          boxShadow: active ? `0 0 6px ${color}` : 'none',
          transition: 'all 0.3s ease',
        }}
      />
      {label}
    </div>
  )
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 12px',
        border: '1px solid oklch(0.25 0.03 270)',
        borderRadius: '10px',
        background: 'oklch(0.14 0.025 265)',
        color: 'oklch(0.75 0.02 220)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'oklch(0.18 0.03 270)'
        e.currentTarget.style.borderColor = 'oklch(0.35 0.03 270)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'oklch(0.14 0.025 265)'
        e.currentTarget.style.borderColor = 'oklch(0.25 0.03 270)'
      }}
    >
      {label}
    </button>
  )
}
