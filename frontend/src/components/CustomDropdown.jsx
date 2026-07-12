import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomDropdown({ label, options, value, onChange, width }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value) || options[0] || { label: '', value: '' };

  return (
    <div ref={ref} style={{ position: 'relative', display: width === '100%' ? 'block' : 'inline-block', width: width || 'auto' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.55rem 0.75rem',
          background: 'var(--bg-secondary)',
          border: `1px solid ${open ? 'var(--accent-gold)' : 'var(--border-color)'}`,
          borderRadius: '6px',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: open ? '0 0 0 2px var(--accent-gold-glow)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          minWidth: width ? '0' : '160px',
          width: '100%',
          justifyContent: 'space-between',
          textAlign: 'left'
        }}
      >
        <span>
          {label ? (
            <>
              {label}: <span style={{ color: '#7a668c' }}>{selected.label}</span>
            </>
          ) : (
            <span style={{ color: selected.value === '' ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 500 }}>
              {selected.label}
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          color="var(--text-secondary)"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 100,
          minWidth: '100%',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
          padding: '2px',
        }}>
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.8rem',
                  fontSize: '0.82rem',
                  border: 'none',
                  borderRadius: '6px',
                  background: isActive ? '#FFE2E2' : 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  marginBottom: '2px',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FBEFEF'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{option.label}</span>
                {isActive && <Check size={13} color="#7a668c" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
