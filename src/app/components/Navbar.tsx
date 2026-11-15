'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const navLinks = [
  { label: 'Home',        href: '#home' },
  { label: 'About',       href: '#about' },
  { label: 'Portfolio',   href: '#portfolio', dropdown: [
    { label: 'Logo Folio',          href: '#logo' },
    { label: 'Branding',            href: '#branding' },
    { label: 'Social Media',        href: '#socialmedia' },
    { label: 'Packaging',           href: '#packaging' },
    { label: 'Print Media',         href: '#printmedia' },
    { label: 'UI/UX',              href: '#uiux' },
    { label: 'Vector Graphics',     href: '#vector' },
    { label: 'Presentation Design', href: '#presentation' },
    { label: 'AI Video',            href: '#aivideo' },
  ]},
  { label: 'Testimonial', href: '#testimonials' },
  { label: 'Payment',     href: '#payment' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen]             = useState(false)
  const [dropOpen, setDropOpen]             = useState(false)
  const [mobileDropOpen, setMobileDropOpen] = useState(false)
  const [scrolled, setScrolled]             = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeAll = () => {
    setMenuOpen(false)
    setDropOpen(false)
    setMobileDropOpen(false)
  }

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        zIndex: 1000,
        background: scrolled ? 'rgba(11,11,11,0.97)' : 'rgba(11,11,11,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.3s',
      }}>

        {/* ── Logo ── */}
        <Link href="#home" onClick={closeAll}
          style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/images/vixen-solution-logo.svg"
            alt="Vixen Solution"
            width={130} height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
        </Link>

        {/* ── Desktop Links ── */}
        <ul className="desktop-nav"
          style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>

          {navLinks.map((link) =>
            link.dropdown ? (
              <li key={link.label} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropOpen(o => !o)}
                  style={{
                    background: 'none', border: 'none', cursor: 'none',
                    color: dropOpen ? '#fff' : '#aaa',
                    fontFamily: 'var(--font-body)', fontSize: '13px',
                    fontWeight: 500, letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    transition: 'color 0.2s',
                  }}>
                  {link.label} <span style={{ fontSize: '10px' }}>▾</span>
                </button>

                {dropOpen && (
                  <ul style={{
                    position: 'absolute', top: 'calc(100% + 14px)', left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#161616',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', padding: '8px 0',
                    minWidth: '210px', listStyle: 'none',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    zIndex: 100,
                  }}>
                    {link.dropdown.map(d => (
                      <li key={d.label}>
                        <a href={d.href} onClick={() => setDropOpen(false)}
                          style={{
                            display: 'block', padding: '9px 20px',
                            color: '#aaa', fontSize: '12px',
                            fontWeight: 500, letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            transition: 'color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={e => {
                            (e.target as HTMLElement).style.color = '#fff'
                            ;(e.target as HTMLElement).style.background = 'rgba(244,130,24,0.08)'
                          }}
                          onMouseLeave={e => {
                            (e.target as HTMLElement).style.color = '#aaa'
                            ;(e.target as HTMLElement).style.background = 'transparent'
                          }}>
                          {d.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ) : (
              <li key={link.label}>
                <a href={link.href}
                  style={{
                    color: '#aaa', fontSize: '13px', fontWeight: 500,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#aaa'}>
                  {link.label}
                </a>
              </li>
            )
          )}

          {/* CTA Button */}
          <li>
            <a href="#contact"
              style={{
                background: 'var(--orange)', color: '#000',
                padding: '8px 22px', borderRadius: '2px',
                fontSize: '13px', fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.target as HTMLElement).style.background = 'var(--orange-dark)'}
              onMouseLeave={e => (e.target as HTMLElement).style.background = 'var(--orange)'}>
              Let&apos;s Talk
            </a>
          </li>
        </ul>

        {/* ── Hamburger ── */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="hamburger-btn"
          aria-label="Menu"
          style={{
            display: 'none', flexDirection: 'column', gap: '5px',
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
          }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              display: 'block', width: '24px', height: '2px', background: '#fff',
              transform: menuOpen
                ? i === 0 ? 'translateY(7px) rotate(45deg)'
                  : i === 1 ? 'scaleX(0)'
                  : 'translateY(-7px) rotate(-45deg)'
                : 'none',
              transition: 'all 0.3s',
            }} />
          ))}
        </button>
      </nav>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, top: '70px',
          background: 'rgba(11,11,11,0.98)',
          backdropFilter: 'blur(16px)',
          zIndex: 999,
          display: 'flex', flexDirection: 'column',
          padding: '32px',
          gap: '4px',
          overflowY: 'auto',
        }}>
          {navLinks.map(link =>
            link.dropdown ? (
              <div key={link.label}>
                <button
                  onClick={() => setMobileDropOpen(o => !o)}
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '14px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: '#fff', fontFamily: 'var(--font-body)',
                    fontSize: '15px', fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}>
                  {link.label}
                  <span style={{ fontSize: '18px', color: 'var(--orange)' }}>
                    {mobileDropOpen ? '−' : '+'}
                  </span>
                </button>
                {mobileDropOpen && (
                  <div style={{ paddingLeft: '16px' }}>
                    {link.dropdown.map(d => (
                      <a key={d.label} href={d.href} onClick={closeAll}
                        style={{
                          display: 'block', padding: '10px 0',
                          color: '#aaa', fontSize: '13px',
                          fontWeight: 500, letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}>
                        {d.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a key={link.label} href={link.href} onClick={closeAll}
                style={{
                  display: 'block', padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  color: '#fff', fontSize: '15px',
                  fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                {link.label}
              </a>
            )
          )}

          <a href="#contact" onClick={closeAll}
            style={{
              marginTop: '24px', display: 'block', textAlign: 'center',
              padding: '14px', background: 'var(--orange)',
              color: '#000', fontWeight: 700, fontSize: '14px',
              letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '2px',
            }}>
            Let&apos;s Talk
          </a>
        </div>
      )}

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav   { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}