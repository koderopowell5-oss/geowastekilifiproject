import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  visible?: boolean;
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
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const visibleTabs = tabs.filter((tab) => tab.visible !== false);

  const updatePill = useCallback(() => {
    const idx = visibleTabs.findIndex((t) => t.id === currentTab);
    const btn = buttonRefs.current[idx];
    const container = containerRef.current;
    if (!btn || !container) return;

    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setPillStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
      top: '5px',
      height: 'calc(100% - 10px)',
    });
  }, [currentTab, visibleTabs]);

  useEffect(() => {
    // Small delay so DOM has painted before we measure
    const t = setTimeout(updatePill, 10);
    return () => clearTimeout(t);
  }, [updatePill]);

  useEffect(() => {
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [updatePill]);

  return (
    <>
      <style>{css}</style>

      {/* ── Mobile: bottom-center floating pill ── */}
      <div className="ftb-wrap ftb-mobile">
        <div ref={containerRef} className="ftb-container">
          {/* Sliding active pill */}
          <div
            className="ftb-pill"
            style={{
              position: 'absolute',
              background: '#329D9C',
              borderRadius: '9999px',
              pointerEvents: 'none',
              zIndex: 0,
              transition: [
                'left 0.38s cubic-bezier(0.34,1.56,0.64,1)',
                'width 0.38s cubic-bezier(0.34,1.56,0.64,1)',
                'top 0.38s cubic-bezier(0.34,1.56,0.64,1)',
                'height 0.38s cubic-bezier(0.34,1.56,0.64,1)',
              ].join(', '),
              ...pillStyle,
            }}
          />
          {visibleTabs.map((tab, i) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { buttonRefs.current[i] = el; }}
                onClick={() => onTabChange(tab.id)}
                className={`ftb-btn ${isActive ? 'ftb-btn--active' : ''}`}
                title={tab.label}
              >
                <span className="ftb-icon">{tab.icon}</span>
                <span className="ftb-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Desktop: top-right icon-only pill ── */}
      <div className="ftb-wrap ftb-desktop">
        <div className="ftb-container">
          <div
            className="ftb-pill"
            style={{
              position: 'absolute',
              background: '#329D9C',
              borderRadius: '9999px',
              pointerEvents: 'none',
              zIndex: 0,
              transition: [
                'left 0.38s cubic-bezier(0.34,1.56,0.64,1)',
                'width 0.38s cubic-bezier(0.34,1.56,0.64,1)',
                'top 0.38s cubic-bezier(0.34,1.56,0.64,1)',
                'height 0.38s cubic-bezier(0.34,1.56,0.64,1)',
              ].join(', '),
              ...pillStyle,
            }}
          />
          {visibleTabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`ftb-btn ftb-btn--icon ${isActive ? 'ftb-btn--active' : ''}`}
                title={tab.label}
              >
                <span className="ftb-icon">{tab.icon}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="ftb-content">
        {tabs.find((tab) => tab.id === currentTab)?.content}
      </div>
    </>
  );
};

const css = `
  /* ── Wrapper positioning ── */
  .ftb-wrap {
    position: fixed;
    z-index: 50;
  }
  .ftb-mobile {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
  }
  .ftb-desktop {
    top: 88px;
    right: 20px;
    display: none;
  }
  @media (min-width: 640px) {
    .ftb-mobile  { display: none; }
    .ftb-desktop { display: block; }
  }

  /* ── Pill container ── */
  .ftb-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 2px;
    width: max-content;
    padding: 5px;
    border-radius: 9999px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(50,157,156,0.18);
    box-shadow:
      0 8px 32px rgba(50,157,156,0.14),
      0 2px 8px rgba(0,0,0,0.07),
      inset 0 1px 0 rgba(255,255,255,0.9);
  }

  /* ── Buttons ── */
  .ftb-btn {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 8px 16px;
    min-width: 64px;
    border: none;
    border-radius: 9999px;
    background: transparent;
    cursor: pointer;
    color: rgba(100,140,130,0.6);
    transition: color 0.22s ease;
    font-family: inherit;
    white-space: nowrap;
  }
  .ftb-btn--icon {
    padding: 10px;
    min-width: unset;
    flex-direction: row;
    gap: 0;
  }
  .ftb-btn--active {
    color: #ffffff;
  }
  .ftb-btn:not(.ftb-btn--active):hover {
    color: #329D9C;
  }

  /* ── Icon ── */
  .ftb-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: inherit;
    fill: currentColor;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .ftb-btn--active .ftb-icon {
    transform: scale(1.18);
  }

  /* ── Label ── */
  .ftb-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1;
    color: inherit;
    white-space: nowrap;
  }

  /* ── Content area ── */
  .ftb-content {
    padding-bottom: 100px;
  }
  @media (min-width: 640px) {
    .ftb-content { padding-bottom: 32px; }
  }
`;