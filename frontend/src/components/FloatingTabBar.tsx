import React, { useRef, useEffect, useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface FloatingTabBarProps {
  tabs: Tab[];
  currentTab: string;
  onTabChange: (tabId: string) => void;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  tabs,
  currentTab,
  onTabChange,
}) => {
  const activeIndexRef = useRef<number>(tabs.findIndex((t) => t.id === currentTab));
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const idx = tabs.findIndex((t) => t.id === currentTab);
    activeIndexRef.current = idx;
    const btn = buttonRefs.current[idx];
    const container = containerRef.current;
    if (!btn || !container) return;

    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setPillStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, [currentTab, tabs]);

  return (
    <>
      {/* ── Mobile: bottom floating pill bar ── */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
        }}
        className="sm:hidden"
      >
        <div
          ref={containerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '9999px',
            padding: '6px',
            boxShadow:
              '0 8px 32px rgba(50,157,156,0.18), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            border: '1px solid rgba(207,244,210,0.5)',
            position: 'relative',
          }}
        >
          {/* Gliding active pill */}
          <div
            style={{
              position: 'absolute',
              top: '6px',
              height: 'calc(100% - 12px)',
              background: 'linear-gradient(135deg, #329D9C 0%, #2b8a89 100%)',
              borderRadius: '9999px',
              boxShadow: '0 4px 12px rgba(50,157,156,0.45), 0 1px 3px rgba(0,0,0,0.1)',
              transition: 'left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents: 'none',
              ...pillStyle,
            }}
          />

          {tabs.map((tab, i) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => (buttonRefs.current[i] = el)}
                onClick={() => onTabChange(tab.id)}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: isActive ? '#fff' : '#94a3b8',
                  transition: 'color 0.25s ease, transform 0.2s ease',
                  transform: isActive ? 'scale(1.0)' : 'scale(1)',
                  minWidth: '64px',
                }}
                title={tab.label}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {tab.icon}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    lineHeight: 1,
                    opacity: isActive ? 1 : 0.7,
                    transition: 'opacity 0.25s ease',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Desktop: top-right floating pill bar ── */}
      <div
        style={{
          position: 'fixed',
          top: '88px',
          right: '20px',
          zIndex: 40,
        }}
        className="hidden sm:block"
      >
        <div
          ref={containerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '9999px',
            padding: '5px',
            boxShadow:
              '0 12px 40px rgba(50,157,156,0.15), 0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)',
            border: '1px solid rgba(207,244,210,0.55)',
            position: 'relative',
          }}
        >
          {/* Gliding active pill */}
          <div
            style={{
              position: 'absolute',
              top: '5px',
              height: 'calc(100% - 10px)',
              background: 'linear-gradient(135deg, #329D9C 0%, #2b8a89 100%)',
              borderRadius: '9999px',
              boxShadow: '0 4px 14px rgba(50,157,156,0.5), 0 1px 4px rgba(0,0,0,0.12)',
              transition:
                'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents: 'none',
              ...pillStyle,
            }}
          />

          {tabs.map((tab, i) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => (buttonRefs.current[i] = el)}
                onClick={() => onTabChange(tab.id)}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: isActive ? '#fff' : '#94a3b8',
                  transition: 'color 0.25s ease',
                }}
                title={tab.label}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  }}
                >
                  {tab.icon}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="pb-32 sm:pb-8">
        {tabs.find((tab) => tab.id === currentTab)?.content}
      </div>
    </>
  );
};