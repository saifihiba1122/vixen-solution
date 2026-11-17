'use client'
import { useEffect, useState, useRef, FormEvent } from 'react'
import Lenis from 'lenis'

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const [mobilePortfolioOpen, setMobilePortfolioOpen] = useState(false)
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) {
      const navH = 70
      const top = el.getBoundingClientRect().top + window.scrollY - navH - 12
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }
  }

  function navClick(id: string, close = false) {
    if (close) setMenuOpen(false)
    setPortfolioOpen(false)
    scrollTo(id)
  }

  // Scroll reveal
  useEffect(() => {
    const run = () => {
      const els = document.querySelectorAll('.reveal:not(.visible)')
      if (!els.length) return
      if (!('IntersectionObserver' in window)) {
        els.forEach(el => el.classList.add('visible'))
        return
      }
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } })
      }, { threshold: 0.05, rootMargin: '50px' })
      els.forEach(el => observer.observe(el))
      return () => observer.disconnect()
    }
    const cleanup = run()
    const fallback = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => el.classList.add('visible'))
    }, 1500)
    return () => { cleanup?.(); clearTimeout(fallback) }
  }, [])

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  // Stacking sections — set sticky `top` from each section's height so tall
  // sections scroll through their content, then pin while the next slides over.
  useEffect(() => {
    const ids = [
      'page-portfolio', 'client-testimonials',
      'page-logofio', 'page-branding', 'page-socialmedia', 'page-packaging',
      'page-printmedia', 'page-uiux', 'page-vectorgraphics',
      'page-presentationdesign', 'page-aivideo', 'page-contact',
    ]
    const els = ids.map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    const apply = () => {
      const vh = window.innerHeight
      els.forEach(el => {
        const h = el.offsetHeight
        el.style.top = h > vh ? `${vh - h}px` : '0px'
      })
    }
    apply()
    const ro = new ResizeObserver(apply)
    els.forEach(el => ro.observe(el))
    window.addEventListener('resize', apply)
    return () => { ro.disconnect(); window.removeEventListener('resize', apply) }
  }, [])

  // Custom cursor
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!fine.matches) return
    let mx = 0, my = 0, rx = 0, ry = 0
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      if (cursorRef.current) { cursorRef.current.style.left = mx + 'px'; cursorRef.current.style.top = my + 'px' }
    }
    document.addEventListener('mousemove', onMove, { passive: true })
    let frame = 0
    const animate = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12
      if (ringRef.current) { ringRef.current.style.left = rx + 'px'; ringRef.current.style.top = ry + 'px' }
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(frame) }
  }, [])

  // Testimonials auto-scroll
  useEffect(() => {
    const viewport = document.getElementById('testimonialsCarousel')
    if (!viewport) return
    const track = viewport.querySelector('.testimonials-track') as HTMLElement
    const originalSet = track?.querySelector('.testimonial-set') as HTMLElement
    if (!track || !originalSet) return
    track.classList.add('visible')

    let inView = false
    let frameId = 0
    let lastTime = 0
    let wrapPoint = 0
    const speed = 34

    function refresh() {
      const gap = parseFloat(getComputedStyle(track).columnGap || '0') || parseFloat(getComputedStyle(track).gap || '0') || 0
      wrapPoint = originalSet.scrollWidth + gap
    }

    function loop(now: number) {
      if (!inView || document.hidden) { frameId = 0; return }
      if (!lastTime) lastTime = now
      const dt = now - lastTime
      lastTime = now
      viewport!.scrollLeft += speed * (dt / 1000)
      if (wrapPoint && viewport!.scrollLeft >= wrapPoint) viewport!.scrollLeft %= wrapPoint
      frameId = requestAnimationFrame(loop)
    }

    function start() { if (!frameId && inView) { lastTime = 0; frameId = requestAnimationFrame(loop) } }
    function stop() { if (frameId) { cancelAnimationFrame(frameId); frameId = 0 } }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        inView = e.isIntersecting
        if (inView) { refresh(); start() } else stop()
      })
    }, { threshold: 0.01, rootMargin: '220px' })
    obs.observe(viewport)

    refresh()
    viewport.scrollLeft = 0

    let hoverPaused = false
    const onEnter = () => { hoverPaused = true; stop() }
    const onLeave = () => { hoverPaused = false; if (inView) start() }
    viewport.addEventListener('mouseenter', onEnter)
    viewport.addEventListener('mouseleave', onLeave)

    return () => { stop(); obs.disconnect(); viewport.removeEventListener('mouseenter', onEnter); viewport.removeEventListener('mouseleave', onLeave) }
  }, [])

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const group = document.getElementById('desktopPortfolioGroup')
      if (group && !group.contains(e.target as Node)) setPortfolioOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  // Contact form
  const [formStatus, setFormStatus] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [projectType, setProjectType] = useState('Logo Design')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    if (!form.reportValidity()) return
    setFormSubmitting(true)
    setFormStatus('Sending your message...')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || 'Failed')
      setFormStatus('Thanks! Your message has been sent successfully.')
      form.reset()
      setProjectType('Logo Design')
    } catch {
      setFormStatus('Sorry, your message was not sent. Please try again or email agency@vixensolution.com.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const portfolioCategories = [
    { id: 'page-logofio', label: 'Logo Folio' },
    { id: 'page-branding', label: 'Branding' },
    { id: 'page-socialmedia', label: 'Social Media' },
    { id: 'page-packaging', label: 'Packaging' },
    { id: 'page-printmedia', label: 'Print Media' },
    { id: 'page-uiux', label: 'UI/UX' },
    { id: 'page-vectorgraphics', label: 'Vector Graphics' },
    { id: 'page-presentationdesign', label: 'Presentation Design' },
    { id: 'page-aivideo', label: 'AI Video' },
  ]

  return (
    <>
      {/* Cursor */}
      <div className="cursor" ref={cursorRef}></div>
      <div className="cursor-ring" ref={ringRef}></div>

      {/* NAV */}
      <nav id="mainNav">
        <a className="nav-logo" href="#page-home" onClick={(e) => { e.preventDefault(); navClick('page-home') }}>
          <img alt="Vixen Solution Logo" className="nav-logo-img" src="/images/vixen-solution-logo.svg" width={766} height={252} />
        </a>
        <ul className="nav-links" id="navLinks">
          <li><a href="#page-home" onClick={(e) => { e.preventDefault(); navClick('page-home') }}>Home</a></li>
          <li><a href="#page-about" onClick={(e) => { e.preventDefault(); navClick('page-about') }}>About</a></li>
          <li className={`nav-dropdown${portfolioOpen ? ' submenu-open' : ''}`} id="desktopPortfolioGroup">
            <a className="nav-dropdown-trigger" href="#page-portfolio" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPortfolioOpen(!portfolioOpen) }}>
              Portfolio <span className="nav-dropdown-icon">▾</span>
            </a>
            <ul className="nav-dropdown-menu">
              {portfolioCategories.map(c => (
                <li key={c.id}><a href={`#${c.id}`} onClick={(e) => { e.preventDefault(); setPortfolioOpen(false); navClick(c.id) }}>{c.label}</a></li>
              ))}
            </ul>
          </li>
          <li><a href="#client-testimonials" onClick={(e) => { e.preventDefault(); navClick('client-testimonials') }}>Testimonial</a></li>
          <li><a href="#payment-options" onClick={(e) => { e.preventDefault(); navClick('payment-options') }}>Payment</a></li>
          <li><a href="/privacy-policy.html">Privacy Policy</a></li>
          <li><a className="nav-cta" href="#contactForm" onClick={(e) => { e.preventDefault(); navClick('contactForm') }}>Let&apos;s Talk</a></li>
        </ul>
        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)} role="button" tabIndex={0}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <button className="mobile-close" onClick={() => setMenuOpen(false)}>✕</button>
        <a href="#page-home" onClick={(e) => { e.preventDefault(); navClick('page-home', true) }}>Home</a>
        <a href="#page-about" onClick={(e) => { e.preventDefault(); navClick('page-about', true) }}>About</a>
        <div className={`mobile-menu-group${mobilePortfolioOpen ? ' submenu-open' : ''}`}>
          <button className="mobile-menu-parent" onClick={() => setMobilePortfolioOpen(!mobilePortfolioOpen)}>
            <span>Portfolio</span><span className="mobile-submenu-icon">{mobilePortfolioOpen ? '−' : '＋'}</span>
          </button>
          <div className="mobile-submenu">
            {portfolioCategories.map(c => (
              <a key={c.id} href={`#${c.id}`} onClick={(e) => { e.preventDefault(); navClick(c.id, true) }}>{c.label}</a>
            ))}
          </div>
        </div>
        <a href="#client-testimonials" onClick={(e) => { e.preventDefault(); navClick('client-testimonials', true) }}>Testimonial</a>
        <a href="#payment-options" onClick={(e) => { e.preventDefault(); navClick('payment-options', true) }}>Payment</a>
        <a href="#contactForm" onClick={(e) => { e.preventDefault(); navClick('contactForm', true) }}>Contact</a>
        <a href="/privacy-policy.html">Privacy Policy</a>
      </div>

      {/* ══════════════════════════════════════════ HOME ══════════════════════════════════════════ */}
      <div className="page active noise" id="page-home">
        <section id="home">
          <div className="bg-grid"></div>
          <div className="home-hero">
            <div className="welcome-cartoon reveal">
              <span className="welcome-bg-text">Welcome to Vixen Solution</span>
              <span className="welcome-fox" role="img" aria-label="Vixen fox mascot">🦊</span>
            </div>
            <span className="home-tag reveal">Agency Portfolio</span>
            <div className="home-title-box reveal reveal-delay-1">
              <div className="dashed-corner tl"></div>
              <div className="dashed-corner tr"></div>
              <div className="dashed-corner bl"></div>
              <div className="dashed-corner br"></div>
              <div className="home-main-title">
                <span className="hero-brand-name">Vixen Solution</span>
              </div>
              <span className="home-name-sig">Portfolio</span>
            </div>
            <div className="home-stats reveal reveal-delay-2">
              {[{ num: '6', label: 'Years Exp.' }, { num: '10k+', label: 'Projects' }, { num: '8', label: 'Disciplines' }, { num: '6k+', label: 'Happy Clients' }].map(s => (
                <div className="stat-item" key={s.label}>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="home-actions reveal reveal-delay-3">
              <a className="btn-orange" href="#page-portfolio" onClick={(e) => { e.preventDefault(); scrollTo('page-portfolio') }}>View Portfolio →</a>
              <a className="btn-outline" href="#page-about" onClick={(e) => { e.preventDefault(); scrollTo('page-about') }}>About Us</a>
            </div>
          </div>
          <div className="home-scroll-hint" onClick={() => scrollTo('page-about')}>
            <div className="line"></div>
            Scroll
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════ ABOUT ══════════════════════════════════════════ */}
      <div className="page" id="page-about">
        <section id="about">
          <div className="about-hero">
            <div className="about-left">
              <div className="about-hello reveal"><span>Hello! We&apos;re</span><span>Vixen Solution</span></div>
              <div className="about-iam reveal reveal-delay-1">A Creative Agency for Bold, Modern Brands</div>
              <div className="about-script-label reveal reveal-delay-1">About Us ↓</div>
              <p className="about-greeting reveal reveal-delay-2">Welcome to Vixen Solution.</p>
              <p className="about-bio reveal reveal-delay-2">We are a creative agency dedicated to helping businesses build strong and memorable brands. Through strategic thinking, compelling visuals, and innovative digital solutions, we transform ideas into meaningful experiences.</p>
              <p className="about-bio reveal reveal-delay-2" style={{ marginTop: 14 }}>From branding and graphic design to digital content, we combine creativity with purpose to deliver work that connects with audiences and supports business growth.</p>
              <div className="about-actions reveal reveal-delay-3">
                <a className="btn-orange" href="#client-testimonials" onClick={(e) => { e.preventDefault(); scrollTo('client-testimonials') }} style={{ color: '#000' }}>Testimonials</a>
                <a className="btn-outline" href="#contactForm" onClick={(e) => { e.preventDefault(); scrollTo('contactForm') }} style={{ borderColor: '#33333360', color: '#333' }}>Start a Project</a>
              </div>
            </div>
          </div>
        </section>
        <section className="skills-section">
          <div className="skills-title">Skills &amp; <span>Expertise</span></div>
          <div className="skills-grid">
            {[
              { name: 'Logo Design', w: '95%' }, { name: 'Brand Identity', w: '92%' }, { name: 'Social Media Design', w: '90%' },
              { name: 'Packaging Design', w: '85%' }, { name: 'Print Media', w: '88%' }, { name: 'UI/UX Design', w: '82%' },
              { name: 'Vector Graphics', w: '95%' }, { name: 'Presentation Design', w: '93%' },
            ].map((s, i) => (
              <div className={`skill-item reveal${i % 3 === 1 ? ' reveal-delay-1' : i % 3 === 2 ? ' reveal-delay-2' : ''}`} key={s.name}>
                <div className="skill-name">{s.name}</div>
                <div className="skill-bar"><div className="skill-fill" style={{ width: s.w, background: 'var(--orange)' }}></div></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════ PORTFOLIO OVERVIEW ══════════════════════════════════════════ */}
      <div className="page" id="page-portfolio">
        <div className="portfolio-hero">
          <p className="tag reveal">Vixen Solution</p>
          <h1 className="reveal reveal-delay-1">FEATURED <span>WORK</span></h1>
          <p className="reveal reveal-delay-2">A collection of selected projects built with strategy, creativity, and visual impact.</p>
        </div>
        <div className="portfolio-grid">
          {/* Card 01 - Logo Folio */}
          <div className="portfolio-card card-logofio reveal" onClick={() => scrollTo('page-logofio')}>
            <div className="card-num">01</div>
            <div className="card-bg-shape" style={{ background: 'linear-gradient(135deg,#111 0%,#1a1a1a 100%)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: 24, width: '100%', opacity: 0.3 }}>
                {['#F48218','#2a4d9b','#2d7a3a','#8b2fc9','#c93030','#1a8a8a'].map((c,i) => (
                  <div key={i} style={{ background: c, borderRadius: 6, aspectRatio: '4/3' }}></div>
                ))}
              </div>
            </div>
            <div className="card-arrow">→</div>
            <div className="card-content">
              <div className="card-category">01 — Identity</div>
              <div className="card-title">Logo <span className="card-title-script">Folio</span></div>
            </div>
          </div>

          {/* Card 02 - Branding */}
          <div className="portfolio-card card-branding reveal reveal-delay-1" onClick={() => scrollTo('page-branding')}>
            <div className="card-num">02</div>
            <div className="card-bg-shape">
              <div style={{ padding: 24, width: '100%', opacity: 0.35 }}>
                <div style={{ background: '#F48218', borderRadius: 6, height: 48, display: 'flex', alignItems: 'center', padding: '0 12px', marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 900, color: '#000' }}>Live Gadget</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#211D2B', borderRadius: 4, height: 60 }}></div>
                  <div style={{ background: '#F48218', borderRadius: 4, height: 60 }}></div>
                </div>
              </div>
            </div>
            <div className="card-arrow">→</div>
            <div className="card-content">
              <div className="card-category">02 — Brand Identity</div>
              <div className="card-title">Branding <span className="card-title-script">Design</span></div>
            </div>
          </div>

          {/* Card 03 - Social Media */}
          <div className="portfolio-card card-social reveal reveal-delay-2" onClick={() => scrollTo('page-socialmedia')}>
            <div className="card-num">03</div>
            <div className="card-bg-shape">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, padding: 20, width: '100%', opacity: 0.4 }}>
                <div style={{ background: 'linear-gradient(135deg,#1a0a2e,#3d1a6e)', borderRadius: 6, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>INSTAGRAM</div>
                <div style={{ background: 'linear-gradient(135deg,#0a1a2e,#1a4d7a)', borderRadius: 6, aspectRatio: '1' }}></div>
                <div style={{ background: 'linear-gradient(135deg,#1a2e0a,#2d5a1a)', borderRadius: 6, aspectRatio: '1' }}></div>
                <div style={{ background: 'linear-gradient(135deg,#2e1a0a,#6e3d1a)', borderRadius: 6, aspectRatio: '1' }}></div>
              </div>
            </div>
            <div className="card-arrow">→</div>
            <div className="card-content">
              <div className="card-category">03 — Digital Content</div>
              <div className="card-title">Social Media <span className="card-title-script">Post</span></div>
            </div>
          </div>

          {/* Card 04 - Packaging */}
          <div className="portfolio-card card-packaging reveal" onClick={() => scrollTo('page-packaging')}>
            <div className="card-num">04</div>
            <div className="card-bg-shape">
              <div style={{ padding: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                <div style={{ background: 'linear-gradient(135deg,#f5f0e8,#fff)', borderRadius: 8, width: 80, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,.3)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 900, color: '#333', lineHeight: 1 }}>ARABIA<br />PURE</div>
                    <div style={{ width: 20, height: 1, background: '#F48218', margin: '4px auto' }}></div>
                    <div style={{ fontSize: 7, color: '#888' }}>DATES</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-arrow">→</div>
            <div className="card-content">
              <div className="card-category">04 — Product Design</div>
              <div className="card-title">Packaging <span className="card-title-script">Design</span></div>
            </div>
          </div>

          {/* Card 05 - Print Media */}
          <div className="portfolio-card card-print reveal reveal-delay-1" onClick={() => scrollTo('page-printmedia')}>
            <div className="card-num">05</div>
            <div className="card-bg-shape">
              <div style={{ padding: 20, width: '100%', display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'center', opacity: 0.4 }}>
                {[{ bg: 'linear-gradient(to bottom,#1a2e4a,#0d1a2e)', h: 90 }, { bg: 'linear-gradient(to bottom,#2e1a0d,#1a0d06)', h: 70 }, { bg: 'linear-gradient(to bottom,#1a3a1a,#0d1a0d)', h: 80 }, { bg: 'linear-gradient(to bottom,#3a1a0d,#1a0d06)', h: 100 }].map((b, i) => (
                  <div key={i} style={{ background: b.bg, borderRadius: 4, width: 40, height: b.h }}></div>
                ))}
              </div>
            </div>
            <div className="card-arrow">→</div>
            <div className="card-content">
              <div className="card-category">05 — Offline Presence</div>
              <div className="card-title">Print Media <span className="card-title-script">Design</span></div>
            </div>
          </div>

          {/* Card 06 - UI/UX */}
          <div className="portfolio-card card-uiux reveal reveal-delay-2" onClick={() => scrollTo('page-uiux')}>
            <div className="card-num">06</div>
            <div className="card-bg-shape">
              <div style={{ padding: 16, width: '100%', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', opacity: 0.45 }}>
                <div style={{ background: '#0d1120', borderRadius: 14, width: 52, height: 90, border: '1.5px solid #333', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 10, background: '#060a14' }}></div>
                  <div style={{ flex: 1, padding: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ background: '#F48218', borderRadius: 2, height: 8 }}></div>
                    <div style={{ background: '#222', borderRadius: 2, height: 8 }}></div>
                    <div style={{ background: '#222', borderRadius: 2, height: 8 }}></div>
                  </div>
                </div>
                <div style={{ background: '#111', borderRadius: 6, width: 80, height: 56, border: '1.5px solid #222', overflow: 'hidden' }}>
                  <div style={{ height: 12, background: '#1a1a1a', display: 'flex', alignItems: 'center', padding: '0 4px', gap: 3 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5f57' }}></div>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#febc2e' }}></div>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#28c840' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-arrow">→</div>
            <div className="card-content">
              <div className="card-category">06 — Digital Design</div>
              <div className="card-title">UI UX <span className="card-title-script">Design</span></div>
            </div>
          </div>

          {/* Card 07 - Vector Graphics */}
          <div className="portfolio-card card-vector reveal" onClick={() => scrollTo('page-vectorgraphics')}>
            <div className="card-num">07</div>
            <div className="card-bg-shape">
              <div style={{ padding: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.45 }}>
                <div style={{ position: 'relative', width: 160, height: 110 }}>
                  <div style={{ position: 'absolute', left: 8, top: 18, width: 46, height: 46, border: '2px solid #F48218', borderRadius: '50%' }}></div>
                  <div style={{ position: 'absolute', right: 8, top: 8, width: 54, height: 54, background: '#1a4d7a', borderRadius: 12, transform: 'rotate(12deg)' }}></div>
                  <div style={{ position: 'absolute', left: 48, bottom: 8, width: 66, height: 38, background: '#2d7a3a', borderRadius: '40px 40px 12px 12px' }}></div>
                  <div style={{ position: 'absolute', left: 34, top: 40, width: 92, height: 2, background: '#fff', transform: 'rotate(-22deg)', opacity: 0.8 }}></div>
                  <div style={{ position: 'absolute', left: 78, top: 34, width: 10, height: 10, background: '#F48218', borderRadius: '50%', boxShadow: '36px 20px 0 #F48218' }}></div>
                </div>
              </div>
            </div>
            <div className="card-arrow">→</div>
            <div className="card-content">
              <div className="card-category">07 — Graphics</div>
              <div className="card-title">Vector <span className="card-title-script">Graphics</span></div>
            </div>
          </div>

          {/* Card 08 - Presentation */}
          <div className="portfolio-card card-presentation reveal reveal-delay-1" onClick={() => scrollTo('page-presentationdesign')}>
            <div className="card-num">08</div>
            <div className="card-bg-shape">
              <div style={{ padding: 18, width: '100%', display: 'grid', gridTemplateColumns: '1.25fr .85fr', gap: 10, opacity: 0.45 }}>
                <div style={{ background: '#101218', border: '1px solid #ffffff14', borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 12, background: '#F48218', borderRadius: 2, width: '70%' }}></div>
                  <div style={{ height: 8, background: '#ffffff22', borderRadius: 2, width: '92%' }}></div>
                  <div style={{ height: 8, background: '#ffffff18', borderRadius: 2, width: '74%' }}></div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 'auto' }}>
                    <div style={{ background: '#2a4d9b', borderRadius: 3, height: 24, flex: 1 }}></div>
                    <div style={{ background: '#2d7a3a', borderRadius: 3, height: 24, flex: 1 }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ background: '#211D2B', border: '1px solid #dedede', borderRadius: 5, height: 48 }}></div>
                  <div style={{ background: '#3a1a0d', border: '1px solid #dedede', borderRadius: 5, height: 48 }}></div>
                </div>
              </div>
            </div>
            <div className="card-arrow">→</div>
            <div className="card-content">
              <div className="card-category">08 — Deck Design</div>
              <div className="card-title">Presentation <span className="card-title-script">Design</span></div>
            </div>
          </div>

          {/* Card 09 - AI Video */}
          <div className="portfolio-card card-aivideo reveal reveal-delay-2" onClick={() => scrollTo('page-aivideo')}>
            <div className="card-num">09</div>
            <div className="card-bg-shape">
              <div className="ai-card-visual">
                <div className="ai-card-frame"><div className="ai-card-film"></div></div>
                <div className="ai-card-play">▶</div>
              </div>
            </div>
            <div className="card-arrow">→</div>
            <div className="card-content">
              <div className="card-category">09 — Motion &amp; AI</div>
              <div className="card-title">AI Video <span className="card-title-script">Creation</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════ TESTIMONIALS ══════════════════════════════════════════ */}
      <section className="testimonials-section noise" id="client-testimonials">
        <div className="testimonials-head reveal">
          <div className="testimonials-kicker">Client feedback</div>
          <div className="testimonials-title">Client <span>Testimonials</span></div>
          <div className="testimonials-rating">
            <span className="testimonials-stars">★ ★ ★ ★ ★</span>
            <span>Selected client feedback · 5/5 average</span>
          </div>
        </div>
        <div className="testimonials-grid" id="testimonialsCarousel">
          <div className="testimonials-track">
            {[0, 1].map(setIdx => (
              <div className="testimonial-set" key={setIdx} aria-hidden={setIdx === 1 ? true : undefined}>
                {[
                  { name: 'Hassan Ali', loc: 'Sialkot, Pakistan', text: 'Working with this Lahore-based agency has been a delight. Their creativity and professionalism rival top international firms.' },
                  { name: 'Ayesha Imran', loc: 'Lahore, Pakistan', text: 'From our logo to packaging design, everything was done perfectly. Our products now look more premium, catchy and professional.' },
                  { name: 'Garry Tan', loc: 'Los Angeles, USA', text: 'Super responsive and creative team. They designed our entire campaign in record time and nailed the visual tone perfectly.' },
                  { name: 'Maria Gonzalez', loc: 'Madrid, Spain', text: 'The team understood our brief immediately and turned a rough idea into a clear, memorable identity. The process felt effortless.' },
                  { name: 'Omar Khalid', loc: 'Dubai, UAE', text: 'Every revision was thoughtful and fast. The final brand system gave our launch the polish and confidence it was missing.' },
                  { name: 'Sophie Laurent', loc: 'Paris, France', text: 'Excellent visual judgment and communication from start to finish. Our presentation now looks sharp, modern, and easy to follow.' },
                  { name: 'Daniel Brooks', loc: 'Toronto, Canada', text: 'They brought consistency to a very complex campaign and delivered assets that worked beautifully across web, print, and social.' },
                  { name: 'Fatima Noor', loc: 'Islamabad, Pakistan', text: 'The packaging concepts were fresh, practical, and perfectly aligned with our audience. We received positive feedback right away.' },
                  { name: 'Kenji Sato', loc: 'Tokyo, Japan', text: 'Creative direction was precise and collaborative. The final visuals feel distinctive without losing clarity or usability.' },
                ].map((r, i) => (
                  <article className="testimonial-card" key={i}>
                    <div className="testimonial-quote">
                      <span className="quote-mark">&ldquo;</span>
                      <p className="testimonial-text">{r.text}</p>
                    </div>
                    <div className="testimonial-author">
                      <div className="testimonial-name">{r.name}</div>
                      <div className="testimonial-location">{r.loc}</div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ LOGO FOLIO ══════════════════════════════════════════ */}
      <div className="page cat-page" id="page-logofio">
        <button className="back-btn" onClick={() => scrollTo('page-portfolio')}>← Back to Portfolio</button>
        <div className="cat-hero noise">
          <div className="cat-border-box"><div className="cat-title cat-hero-content">Logo Folio</div></div>
          <p className="cat-sub">Custom logos I designed to align with clients&apos; visions — each mark crafted to communicate identity, values, and purpose.</p>
        </div>
        <div className="logo-cards-grid">
          <div className="logo-carousel-track">
            {[...Array(2)].map((_, setIdx) => {
              const logos = [
                { bg: '#e8f5f0', icon: '✿', iconColor: '#2a8a6a', name: 'Aquaura\nWellness', nameColor: '#2a8a6a' },
                { bg: '#eef3f9', icon: '⛓', iconColor: '#2a4d9b', name: 'NEXUS\nNetworks', nameColor: '#1a3d7b' },
                { bg: '#f5f5f5', icon: '▲', iconColor: '#555', name: 'VANGUARD\nConsulting', nameColor: '#444', tagline: true },
                { bg: '#f8f8f8', icon: '', iconColor: '', name: 'MONOLITH\nDESIGN', nameColor: '#888', nameStyle: { fontSize: 16, letterSpacing: '.08em' } as React.CSSProperties },
                { bg: '#f0f5ec', icon: 'Verdant', iconColor: '#4a8a2a', iconStyle: { fontFamily: "'Dancing Script',cursive", fontSize: 28 } as React.CSSProperties, name: 'Harvest', nameColor: '#4a8a2a' },
                { bg: '#fdf8ee', icon: '∞', iconColor: '', iconStyle: { background: 'linear-gradient(135deg,#c8a830,#8a6010)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 42 } as React.CSSProperties, name: 'Asset Infinity\nFinancial Strategy', nameColor: '#7a5000', tagline: true },
                { bg: '#fdf0f5', icon: '☽', iconColor: '#c06080', iconStyle: { fontSize: 32 } as React.CSSProperties, name: 'LUNARIA\nBeauty', nameColor: '#c06080', tagline: true },
                { bg: '#edf5ec', icon: 'K', iconColor: '#2a7a3a', iconStyle: { fontSize: 40 } as React.CSSProperties, name: 'KAIROS\nNatural', nameColor: '#2a5a2a', tagline: true },
                { bg: '#fff8ee', icon: '⚙', iconColor: '#F48218', iconStyle: { fontSize: 36 } as React.CSSProperties, name: 'LUMINA\nPOWER', nameColor: '#1a3a6a' },
                { bg: '#f5f5f5', icon: 'M', iconColor: '#555', iconStyle: { fontSize: 40, fontWeight: 900 } as React.CSSProperties, name: 'MERIDIAN\nArchitects', nameColor: '#333', tagline: true },
                { bg: '#eef3ff', icon: '', iconColor: '', name: 'DATALYSTIX✦', nameColor: '#1a4d9b', nameStyle: { fontSize: 18, letterSpacing: '.06em' } as React.CSSProperties },
                { bg: '#fff0f8', icon: 'CP', iconColor: '#d0208a', iconStyle: { fontFamily: "'Dancing Script',cursive", fontSize: 48, fontWeight: 700, lineHeight: 1 } as React.CSSProperties, name: 'CHROMA\nPULSE', nameColor: '#d0208a' },
              ];
              return logos.map((logo, i) => (
                <div className="logo-card" key={`${setIdx}-${i}`} style={{ background: logo.bg }} aria-hidden={setIdx === 1 ? true : undefined}>
                  <div className="logo-inner">
                    {logo.icon && <div className="logo-icon" style={{ color: logo.iconColor, ...logo.iconStyle }}>{logo.icon}</div>}
                    <div className="logo-name" style={{ color: logo.nameColor, ...logo.nameStyle }}>{logo.name.split('\n').map((l, j) => <span key={j}>{j > 0 && <br />}{l}</span>)}</div>
                  </div>
                </div>
              ));
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════ BRANDING ══════════════════════════════════════════ */}
      <div className="page cat-page" id="page-branding">
        <button className="back-btn" onClick={() => scrollTo('page-portfolio')}>← Back to Portfolio</button>
        <div className="cat-hero noise">
          <div className="cat-border-box"><div className="cat-title">Branding</div></div>
          <p className="cat-sub">These Brand Identity design projects involve creating impactful visual identifying marks of their Mission and Goals.</p>
        </div>
        <div className="branding-project-section" style={{ padding: '60px 48px', background: 'var(--black)' }}>
          <div className="reveal branding-project-intro" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 48, alignItems: 'center', marginBottom: 80, maxWidth: 1100, marginInline: 'auto' }}>
            <div className="branding-project-copy">
              <div style={{ fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 12 }}>Brand Identity</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 42, fontWeight: 900, lineHeight: 1, marginBottom: 16 }}>Brand: Live Gadget</div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 24, fontStyle: 'italic' }}>Industry: Technology : Retail</div>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: '#aaa', marginBottom: 24 }}>Live Gadget is a dynamic, next-generation technology retailer dedicated to curating the finest gadgets and consumer electronics. We believe in empowering lives through seamless tech integration, prioritizing innovation, accessibility, and exceptional customer experience.</p>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Key features</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Target Audience: Tech Enthusiasts 18–35', 'Geometric logo concept', 'Innovation & Forward-thinking', 'Seamless Experience'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--orange)' }}>•</span> {f}</li>
                ))}
              </ul>
            </div>
            <div className="branding-project-assets" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--orange)', borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 2' }}>
                <div style={{ background: '#000', borderRadius: 4, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 14 }}>G</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 900, color: '#000' }}>Live Gadget</div>
              </div>
              <div style={{ background: '#211D2B', borderRadius: 8, padding: 20 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 36, fontWeight: 900, lineHeight: 1 }}>Aura</div>
                <div style={{ fontSize: 12, color: '#888', margin: '4px 0 12px', letterSpacing: '.06em', textTransform: 'uppercase' }}>Regular</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>Aa</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 8, lineHeight: 1.6 }}>Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['#F48218','#A24D11','#211D2B'].map(c => <div key={c} style={{ background: c, height: 40, borderRadius: 6 }}></div>)}
                <div style={{ background: '#FFFFFF', height: 40, borderRadius: 6, border: '1px solid #eee' }}></div>
              </div>
              <div style={{ background: 'var(--orange)', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gridColumn: 'span 2' }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 900, color: '#000', textShadow: '0 0 20px rgba(0,0,0,.3)' }}>Live Gadget</div>
              </div>
            </div>
          </div>
          <div className="branding-showcase reveal reveal-delay-1">
            <div className="branding-showcase-head">
              <div>
                <div className="branding-showcase-kicker">Complete Identity System</div>
                <div className="branding-showcase-title">Full Branding</div>
              </div>
              <p className="branding-showcase-copy">A complete presentation of the Live Gadget identity across logo applications, typography, color, signage, patterns, and consumer technology touchpoints.</p>
            </div>
            <div className="branding-board-card">
              <img alt="Live Gadget complete brand identity presentation board" loading="lazy" src="/images/live-gadget-complete-brand-identity-presentation-board.webp" width={1600} height={893} />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════ SOCIAL MEDIA ══════════════════════════════════════════ */}
      <div className="page cat-page" id="page-socialmedia">
        <button className="back-btn" onClick={() => scrollTo('page-portfolio')}>← Back to Portfolio</button>
        <div className="cat-hero noise">
          <div className="cat-border-box"><div className="cat-title">Social Media</div></div>
          <p className="cat-sub">Visual content I crafted for social networks such as Instagram and Facebook — diverse industries, bold designs.</p>
        </div>
        <div className="social-gallery">
          <div className="social-gallery-track">
            {[0, 1].map(setIdx => (
              <div className="social-gallery-set" key={setIdx} aria-hidden={setIdx === 1 ? true : undefined}>
                {['nexora-tech-summit','nexora-pro-laptop','smartnest-appliances','lumera-skincare','velora-coffee','pulse-forge-shoe','aurelia-fashion','skyhaven-travel','firecrust-pizza'].map(name => (
                  <div className="social-shot-card" key={`${setIdx}-${name}`}>
                    <img alt={`${name} Instagram ad`} loading="lazy" src={`/images/${name}-instagram-ad.webp`} width={1086} height={1448} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════ PACKAGING ══════════════════════════════════════════ */}
      <div className="page cat-page" id="page-packaging">
        <button className="back-btn" onClick={() => scrollTo('page-portfolio')}>← Back to Portfolio</button>
        <div className="cat-hero noise">
          <div className="cat-border-box"><div className="cat-title">Package Design</div></div>
          <p className="cat-sub">Designed innovative and visually appealing product packaging that effectively communicates brand identity and enhances customer engagement.</p>
        </div>
        <div className="package-photo-grid">
          {[
            { img: 'arabia-pure-packaging-showcase', title: 'Arabia Pure', sub: 'Handpicked Saudi Dates' },
            { img: 'butter-chicken-masala-packaging-showcase', title: 'Butter Chicken Masala', sub: 'Spice Blend Pouch' },
            { img: 'vanilla-bean-latte-packaging-showcase', title: 'Vanilla Bean Latte', sub: 'Premium Cold Brew' },
            { img: 'pure-glow-packaging-showcase', title: 'Pure Glow', sub: 'Vitamin C Face Wash' },
            { img: 'reload-packaging-showcase', title: 'Reload', sub: 'Protein Cookie' },
            { img: 'the-morning-grind-packaging-showcase', title: 'The Morning Grind', sub: 'Premium Cold Brew' },
          ].map((p, i) => (
            <div className={`package-photo-card reveal${i % 3 === 1 ? ' reveal-delay-1' : i % 3 === 2 ? ' reveal-delay-2' : ''}`} key={p.img}>
              <img alt={`${p.title} packaging showcase`} loading="lazy" src={`/images/${p.img}.webp`} width={1100} height={825} />
              <div className="package-photo-caption">
                <h3 className="package-photo-title">{p.title}</h3>
                <p className="package-photo-sub">{p.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════ PRINT MEDIA ══════════════════════════════════════════ */}
      <div className="page cat-page" id="page-printmedia">
        <button className="back-btn" onClick={() => scrollTo('page-portfolio')}>← Back to Portfolio</button>
        <div className="cat-hero noise">
          <div className="cat-border-box"><div className="cat-title">Print Media</div></div>
          <p className="cat-sub">High-quality print designs I crafted to enhance offline brand presence — brochures, billboards, standees, and more.</p>
        </div>
        {/* Brochures */}
        <div style={{ padding: '60px 48px 0' }}>
          <div className="reveal" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 900, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            Brochure <span style={{ fontFamily: "'Dancing Script',cursive", color: 'var(--orange)', fontSize: 24 }}>Design</span>
          </div>
          <div className="work-grid cols-3 brochure-original-grid" style={{ padding: '0 0 60px', gap: 20 }}>
            {['luxury-interior-brochure-design','corporate-services-brochure-design','wellness-spa-brochure-design'].map((img, i) => (
              <div className={`work-item reveal brochure-original-card${i === 1 ? ' reveal-delay-1' : i === 2 ? ' reveal-delay-2' : ''}`} key={img}>
                <img alt={img.replace(/-/g,' ')} loading="lazy" src={`/images/${img}.webp`} width={1448} height={1086} />
              </div>
            ))}
          </div>
        </div>
        {/* Billboards */}
        <div style={{ padding: '0 48px 60px' }}>
          <div className="reveal" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 900, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            Bill Board <span style={{ fontFamily: "'Dancing Script',cursive", color: 'var(--orange)', fontSize: 24 }}>Design</span>
          </div>
          <div className="work-grid cols-2 billboard-original-grid" style={{ padding: 0, gap: 20 }}>
            {['aura-luxury-residences-billboard-design','chronos-watches-billboard-design'].map((img, i) => (
              <div className={`work-item reveal billboard-original-card${i === 1 ? ' reveal-delay-1' : ''}`} key={img}>
                <img alt={img.replace(/-/g,' ')} loading="lazy" src={`/images/${img}.webp`} width={1448} height={1086} />
              </div>
            ))}
          </div>
        </div>
        {/* Standees */}
        <div style={{ padding: '0 48px 100px' }}>
          <div className="reveal" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 900, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            Standee <span style={{ fontFamily: "'Dancing Script',cursive", color: 'var(--orange)', fontSize: 24 }}>Design</span>
          </div>
          <div className="work-grid cols-4 standee-original-grid" style={{ padding: 0, gap: 20 }}>
            {['skyview-residences-real-estate-standee-design','quantum-learning-education-standee-design','serenity-weddings-and-events-standee-design','artisan-crust-restaurant-standee-design'].map((img, i) => (
              <div className={`work-item reveal standee-original-card${i > 0 ? ` reveal-delay-${i}` : ''}`} key={img}>
                <img alt={img.replace(/-/g,' ')} loading="lazy" src={`/images/${img}.webp`} width={948} height={1659} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════ UI/UX ══════════════════════════════════════════ */}
      <div className="page cat-page" id="page-uiux">
        <button className="back-btn" onClick={() => scrollTo('page-portfolio')}>← Back to Portfolio</button>
        <div className="cat-hero noise">
          <div className="cat-border-box"><div className="cat-title">UI UX</div></div>
          <p className="cat-sub">I design seamless UI/UX for apps and websites that combine clarity, usability, and visual appeal.</p>
        </div>
        <div className="uiux-project-section" style={{ padding: '60px 48px' }}>
          {/* App Design */}
          <div className="reveal uiux-project-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 48, alignItems: 'start', maxWidth: 1100, marginInline: 'auto', marginBottom: 80 }}>
            <div className="uiux-project-copy">
              <div style={{ fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 12 }}>App Design</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 40, fontWeight: 900, marginBottom: 8 }}>Client: <span style={{ color: 'var(--orange)' }}>Poppy</span></div>
              <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 20 }}>Premium Movie &amp; TV Streaming App</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: '#aaa', marginBottom: 20 }}>Poppy is a subscription-based movie and TV streaming app designed to deliver a seamless viewing experience across mobile, tablet, and smart TV platforms.</p>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, color: 'var(--orange)' }}>Key features</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {['Minimalist, cinematic, bold visuals, immersive dark UI','Target Audience: Age 16–45, globally distributed','Home screen with personalized recommendations','Search & filter with genres, actors, and more','Watchlist and continue watching sections','Subscription management & in-app purchases'].map(f => (
                  <li key={f} style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--orange)' }}>•</span> {f}</li>
                ))}
              </ul>
            </div>
            <div className="uiux-phone-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, alignItems: 'center' }}>
              {[
                { label: 'signup screen', img: 'aether-streaming-app-signup-screen', status: '9:41' },
                { label: 'home dashboard', img: 'aether-streaming-app-home-dashboard', status: '10:30' },
                { label: 'profile dashboard', img: 'aether-streaming-app-profile-dashboard', status: '15:42' },
              ].map(phone => (
                <div className="phone-mockup app-image-phone" key={phone.img} style={{ background: '#080d1c' }}>
                  <div className="phone-status">{phone.status} <span>▣ ▣ ▓</span></div>
                  <div className="phone-notch"></div>
                  <div className="phone-screen">
                    <img alt={`Aether streaming app ${phone.label}`} className="app-screen-image" loading="lazy" src={`/images/${phone.img}.webp`} width={720} height={1440} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Web Design - Steam */}
          <div className="reveal reveal-delay-1" style={{ maxWidth: 1100, marginInline: 'auto' }}>
            <div className="uiux-web-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 48, alignItems: 'start', marginBottom: 60 }}>
              <div className="uiux-web-copy">
                <div style={{ fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 12 }}>Web Design</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Client: <span style={{ color: 'var(--orange)' }}>Steam (Redesign)</span></div>
                <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 20 }}>Digital PC game distribution platform</div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: '#aaa', marginBottom: 20 }}>The goal of this redesign is to enhance user experience, improve discoverability, and create a modern, engaging, and intuitive platform for users.</p>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, color: 'var(--orange)' }}>Key features</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <li style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ color: 'var(--orange)', flexShrink: 0 }}>•</span><span><strong style={{ color: '#ccc' }}>Improve User Experience:</strong> Smooth, intuitive navigation</span></li>
                  <li style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ color: 'var(--orange)', flexShrink: 0 }}>•</span><span><strong style={{ color: '#ccc' }}>Modernize Visual Aesthetic:</strong> Cohesive dark-mode theme</span></li>
                  <li style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ color: 'var(--orange)', flexShrink: 0 }}>•</span><span><strong style={{ color: '#ccc' }}>Performance Optimization:</strong> Speed up load times</span></li>
                </ul>
              </div>
              <div className="uiux-web-visual">
                <div className="laptop-mockup" style={{ aspectRatio: '1400/1136', background: '#0b1020', borderColor: '#3b4352', boxShadow: '0 26px 70px rgba(0,0,0,.48)', overflow: 'hidden' }}>
                  <img alt="Steam desktop client dashboard redesign" loading="lazy" src="/images/steam-desktop-client-dashboard-redesign.webp" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: 9 }} width={1920} height={1563} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════ VECTOR GRAPHICS ══════════════════════════════════════════ */}
      <div className="page cat-page" id="page-vectorgraphics">
        <button className="back-btn" onClick={() => scrollTo('page-portfolio')}>← Back to Portfolio</button>
        <div className="cat-hero noise">
          <div className="cat-border-box"><div className="cat-title">Vector Graphics</div></div>
          <p className="cat-sub">Clean, scalable vector artwork created for brands, digital campaigns, icons, illustrations, and visual systems.</p>
        </div>
        <div className="work-grid cols-4 vector-work-grid" style={{ padding: '60px 48px 100px' }}>
          {[
            { img: 'circular-brand-mark', label: 'Circular Brand Mark', bg: '#ffffff', fit: 'contain' },
            { img: 'lounge-radio-vector-illustration', label: 'Lounge Radio Illustration', bg: '#00100c', fit: 'contain' },
            { img: 'collection-of-colorful-logo-and-app-icon-concepts', label: 'Logo & Icon Collection', bg: '#edf1f5', fit: 'cover' },
            { img: 'black-monogram-logo-exploration-grid', label: 'Monogram Exploration', bg: '#f5f1e9', fit: 'contain' },
            { img: 'social-media-icon-collection', label: 'Social Icon Collection', bg: '#ffffff', fit: 'contain' },
            { img: 'geometric-portrait-vector-illustration', label: 'Geometric Illustration', bg: '#f7efeb', fit: 'cover' },
            { img: 'abstract-red-vector-pattern', label: 'Vector Pattern Element', bg: '#ffffff', fit: 'cover' },
            { img: 'start-strong-custom-lettering-artwork', label: 'Typography Vector Layout', bg: '#fff8dc', fit: 'contain' },
          ].map((v, i) => (
            <div className={`work-item reveal vector-work-card${i % 4 === 1 ? ' reveal-delay-1' : i % 4 === 2 ? ' reveal-delay-2' : i % 4 === 3 ? ' reveal-delay-3' : ''}`} key={v.img}>
              <div className="work-item-img vector-art-frame" style={{ background: v.bg }}>
                <img alt={v.label} loading="lazy" src={`/images/${v.img}.webp`} style={{ objectFit: v.fit as 'contain' | 'cover' }} width={800} height={600} />
              </div>
              <div className="work-item-label">{v.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════ PRESENTATION DESIGN ══════════════════════════════════════════ */}
      <div className="page cat-page" id="page-presentationdesign">
        <button className="back-btn" onClick={() => scrollTo('page-portfolio')}>← Back to Portfolio</button>
        <div className="cat-hero noise">
          <div className="cat-border-box"><div className="cat-title">Presentation Design</div></div>
          <p className="cat-sub">Professional pitch decks, business presentations, sales decks, and training slides designed with clear hierarchy and premium visuals.</p>
        </div>
        <div className="work-grid cols-3 presentation-project-grid" style={{ padding: '60px 48px 100px' }}>
          {[
            { img: 'city-school-presentation-deck-collage', label: 'City School Presentation' },
            { img: 'muallimi-education-platform-presentation-deck', label: 'Muallimi Education Platform' },
            { img: 'unitz-home-services-presentation-deck', label: 'Unitz Services Deck' },
            { img: 'ai-powered-tour-guide-presentation-deck', label: 'AI Tour Guide Pitch Deck' },
            { img: 'project-pendles-advisory-pitch-deck', label: 'Project Pendles Pitch Deck' },
            { img: 'beauty-and-furniture-product-presentation-deck', label: 'Product Presentation Design' },
          ].map((p, i) => (
            <div className={`work-item presentation-project-card reveal${i % 3 === 1 ? ' reveal-delay-1' : i % 3 === 2 ? ' reveal-delay-2' : ''}`} key={p.img}>
              <div className="work-item-img presentation-project-img">
                <img alt={p.label} loading="lazy" src={`/images/${p.img}.webp`} width={1024} height={768} />
              </div>
              <div className="work-item-label">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════ AI VIDEO ══════════════════════════════════════════ */}
      <div className="page cat-page" id="page-aivideo">
        <button className="back-btn" onClick={() => scrollTo('page-portfolio')}>← Back to Portfolio</button>
        <div className="cat-hero noise">
          <div className="bg-word">AI MOTION</div>
          <div className="cat-hero-content">
            <div className="cat-border-box reveal"><div className="cat-title">AI VIDEO</div></div>
            <p className="cat-sub reveal reveal-delay-1">Concept-led generative films, product cinematics, campaign motion, and short-form video built with AI-assisted creative workflows.</p>
          </div>
        </div>
        <section className="ai-video-showcase">
          <div className="ai-showreel reveal">
            <div className="ai-stage">
              <div className="ai-main-play">▶</div>
              <div className="ai-stage-copy">
                <div className="ai-stage-kicker">Featured AI showreel</div>
                <div className="ai-stage-title">Ideas transformed into <span>moving worlds.</span></div>
                <div className="ai-stage-meta"><span>Concept</span><span>Generation</span><span>Editing</span><span>Sound Design</span></div>
              </div>
            </div>
            <aside className="ai-reel-info">
              <div>
                <div className="ai-reel-num">09</div>
                <h3>Generative Video Direction</h3>
                <p>AI-assisted visual storytelling from storyboard and prompt development through scene generation, compositing, motion polish, and final edit.</p>
                <div className="ai-tags"><span>Runway</span><span>Kling</span><span>Midjourney</span><span>After Effects</span></div>
              </div>
              <div className="ai-reel-line"></div>
            </aside>
          </div>
          <div className="ai-video-grid">
            {[
              { cls: 'product', dur: '00:22', cat: 'Product film', title: 'Future Tech Cinematic', desc: 'High-impact technology storytelling with neon production environments, dynamic screens, and cinematic motion.' },
              { cls: 'fashion', dur: '00:18', cat: 'Fashion concept', title: 'Editorial Dreamscape', desc: 'Stylized editorial scenes designed for fashion campaigns, music visuals, and expressive identity films.' },
              { cls: 'social', dur: '00:15', cat: 'Social campaign', title: 'Vertical Motion Series', desc: 'Fast, scroll-stopping short-form concepts adapted for reels, stories, launches, and paid social.' },
            ].map((v, i) => (
              <article className={`ai-video-card reveal${i > 0 ? ` reveal-delay-${i}` : ''}`} key={v.title}>
                <div className={`ai-video-thumb ${v.cls}`}><div className="ai-mini-play">▶</div><span className="ai-video-duration">{v.dur}</span></div>
                <div className="ai-video-body"><small>{v.cat}</small><h3>{v.title}</h3><p>{v.desc}</p></div>
              </article>
            ))}
          </div>
          <div className="ai-workflow reveal">
            <div className="ai-workflow-head"><h2>AI Video Workflow</h2><p>A structured production process that combines creative direction with generative tools and traditional post-production.</p></div>
            <div className="ai-workflow-grid">
              {[
                { num: '01', title: 'Concept', desc: 'Creative direction, story beats, references, and visual language.' },
                { num: '02', title: 'Generate', desc: 'Prompt development, keyframes, scene iterations, and motion passes.' },
                { num: '03', title: 'Compose', desc: 'Shot selection, compositing, cleanup, transitions, and pacing.' },
                { num: '04', title: 'Finish', desc: 'Color, typography, sound, export, and platform-specific delivery.' },
              ].map(s => (
                <div className="ai-step" key={s.num}><div className="ai-step-num">{s.num}</div><h4>{s.title}</h4><p>{s.desc}</p></div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════ CONTACT PAGE ══════════════════════════════════════════ */}
      <div className="page noise" id="page-contact">
        <section id="contact">
          {/* Payment Section */}
          <section className="payment-options-section" id="payment-options">
            <div className="payment-options-head reveal">
              <div className="payment-options-kicker">Flexible &amp; Secure</div>
              <h2 className="payment-options-title">Payment Options</h2>
              <p className="payment-options-copy">We keep payments simple and transparent. There are no upfront fees or hidden charges. You only pay after the project starts, and the payment method is flexible and secure based on what works best for you and your location.</p>
            </div>
            <div className="payment-marquee reveal reveal-delay-1">
              <div className="payment-marquee-track">
                {[0, 1].map(setIdx => (
                  [
                    { img: 'payoneer-payment-option', name: 'Payoneer', light: true },
                    { img: 'binance-payment-option', name: 'Binance', light: false },
                    { img: 'upwork-payment-option', name: 'Upwork', light: false },
                    { img: 'fiverr-payment-option', name: 'Fiverr', light: false },
                    { img: 'western-union-payment-option', name: 'Western Union', light: true },
                    { img: 'moneygram-payment-option', name: 'MoneyGram', light: false },
                    { img: 'bank-transfer-payment-option', name: 'Bank Transfer', light: true },
                  ].map(p => (
                    <div className={`payment-logo-card payment-logo-card--${p.light ? 'light' : 'dark'}`} key={`${setIdx}-${p.name}`}>
                      <img alt={`${p.name} payment option`} loading="lazy" src={`/images/${p.img}.webp`} width={520} height={220} />
                      <span>{p.name}</span>
                    </div>
                  ))
                ))}
              </div>
            </div>
            <div className="payment-options-note reveal reveal-delay-2">Payment availability may vary by country and project scope.</div>
          </section>

          {/* Contact Form */}
          <div className="contact-hero">
            <div className="contact-left">
              <span className="contact-script reveal">Let&apos;s Work Together</span>
              <div className="contact-title reveal reveal-delay-1">Got a<br /><em>Project?</em><br />Let&apos;s talk.</div>
              <p className="contact-desc reveal reveal-delay-2">Available for freelance projects — logos, branding, social media, packaging, print media, UI/UX &amp; AI video production.</p>
              <div className="contact-tools reveal reveal-delay-3">
                <div className="tool-badge" style={{ background: '#FF7C00', color: '#fff', fontSize: 13, fontWeight: 900 }}>Ai</div>
                <div className="tool-badge" style={{ background: '#001d57', color: '#fff', fontSize: 13, fontWeight: 900 }}>Ps</div>
                <div className="tool-badge" style={{ background: '#2d0060', color: '#fff', fontSize: 12, fontWeight: 900 }}>Id</div>
                <div className="tool-badge" style={{ background: '#00005b', color: 'var(--orange)', fontSize: 12, fontWeight: 900 }}>Ae</div>
                <div className="tool-badge" style={{ background: '#00c8ff22', color: '#00c8ff', fontSize: 12, fontWeight: 900 }}>Fg</div>
              </div>
              <div className="reveal reveal-delay-3" style={{ marginTop: 40 }}>
                <div style={{ fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: '#555', marginBottom: 12 }}>Get in Touch</div>
                <a href="mailto:agency@vixensolution.com" style={{ fontSize: 22, fontWeight: 600, color: '#fff', fontFamily: "'Barlow',sans-serif", textDecoration: 'none' }}>agency@vixensolution.com</a>
              </div>
            </div>
            <div className="contact-right reveal reveal-delay-2">
              <form className="contact-form" id="contactForm" onSubmit={handleSubmit}>
                <input name="access_key" type="hidden" value="06892c99-b539-4d73-8786-30e57278d0e2" />
                <input name="subject" type="hidden" value="New project inquiry from the Vixen Solution website" />
                <input name="from_name" type="hidden" value="Vixen Solution Portfolio" />
                <div className="form-title">Send a Message</div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contactName">Your Name</label>
                  <input autoComplete="name" className="form-input" id="contactName" name="name" placeholder="John Doe" required type="text" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contactEmail">Email Address</label>
                  <input autoComplete="email" className="form-input" id="contactEmail" name="email" placeholder="john@example.com" required type="email" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="projectType">Project Type</label>
                  <select className="form-input" id="projectType" name="project_type" required value={projectType} onChange={e => setProjectType(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="Logo Design">Logo Design</option>
                    <option value="Brand Identity">Brand Identity</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Print Media">Print Media</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Full Branding">Full Branding</option>
                    <option value="AI Video Production">AI Video Production</option>
                    <option value="Custom">Custom — Write Your Own</option>
                  </select>
                </div>
                {projectType === 'Custom' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="customProjectType">Custom Project Type</label>
                    <input className="form-input" id="customProjectType" name="custom_project_type" placeholder="e.g. Logo design, website, animation..." type="text" />
                    <div className="form-help">Describe the exact service or project you need.</div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="contactMessage">Message</label>
                  <textarea className="form-textarea" id="contactMessage" minLength={10} name="message" placeholder="Tell me about your project..." required></textarea>
                </div>
                <button className="form-submit" type="submit" disabled={formSubmitting}>{formSubmitting ? 'Sending...' : 'Send Message →'}</button>
                <p className="form-privacy-note">By submitting this form, you acknowledge that your information will be handled as described in our <a href="/privacy-policy.html">Privacy Policy</a>.</p>
                {formStatus && <p className="form-status">{formStatus}</p>}
              </form>
            </div>
          </div>
          <div className="contact-bg-text">CONTACT</div>
        </section>
        <footer>
          <div className="footer-logo">
            <img alt="Vixen Solution Logo" className="footer-logo-img" src="/images/vixen-solution-logo.svg" width={766} height={252} loading="lazy" />
          </div>
          <div className="footer-meta">
            <div className="footer-links">
              <a href="/privacy-policy.html">Privacy Policy</a>
              <a href="mailto:agency@vixensolution.com?subject=Privacy%20Request">Privacy Request</a>
            </div>
            <div className="footer-copy">© 2026 Vixen Solution — Agency. All rights reserved.</div>
          </div>
        </footer>
      </div>

      {/* Floating WhatsApp */}
      <a className="whatsapp-float" href="https://wa.me/923466633870?text=Hello%20Vixen%20Solution%2C%20I%27d%20like%20to%20discuss%20a%20project." rel="noopener noreferrer" target="_blank" title="WhatsApp: +92 346 6633870">
        <span className="whatsapp-float-label">Chat on WhatsApp</span>
        <svg viewBox="0 0 32 32">
          <path d="M19.11 17.21c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.59.13-.17.26-.67.85-.83 1.02-.15.17-.3.2-.56.07-.26-.13-1.1-.4-2.09-1.29-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.46.13-.15.17-.26.26-.44.09-.17.04-.33-.02-.46-.07-.13-.59-1.41-.8-1.93-.21-.51-.43-.44-.59-.45h-.5c-.17 0-.46.07-.7.33-.24.26-.91.89-.91 2.17s.94 2.52 1.07 2.69c.13.17 1.84 2.81 4.46 3.94.62.27 1.11.43 1.49.55.63.2 1.2.17 1.65.1.5-.07 1.54-.63 1.76-1.24.22-.61.22-1.13.15-1.24-.06-.11-.23-.17-.49-.3zM16.03 3.2c-7.07 0-12.82 5.74-12.82 12.81 0 2.26.59 4.46 1.71 6.4L3.1 29.06l6.8-1.78a12.78 12.78 0 0 0 6.12 1.56h.01c7.06 0 12.81-5.75 12.81-12.82 0-3.42-1.33-6.64-3.75-9.06A12.72 12.72 0 0 0 16.03 3.2zm0 23.47h-.01c-1.93 0-3.83-.52-5.48-1.5l-.39-.23-4.04 1.06 1.08-3.94-.25-.4a10.59 10.59 0 0 1-1.62-5.65c0-5.91 4.81-10.72 10.73-10.72 2.86 0 5.55 1.12 7.57 3.14a10.65 10.65 0 0 1 3.14 7.58c0 5.92-4.81 10.73-10.73 10.73z"></path>
        </svg>
      </a>
    </>
  )
}
