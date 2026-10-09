import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { NavLink } from 'react-router-dom'
import { siteConfig } from '../data/site-config'

const links = [
  { to: '/', label: '首页' },
  { to: '/gallery', label: '相册' },
  { to: '/timeline', label: '时间轴' },
  { to: '/letters', label: '信' },
  { to: '/about', label: '关于' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 24)
    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })
    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <NavLink className="brand" to="/" onClick={() => setOpen(false)} aria-label={`${siteConfig.title} 首页`}>
        <span className="brand__mark">LV</span>
        <span>{siteConfig.title}</span>
      </NavLink>
      <nav className="navbar__links" aria-label="主导航">
        {links.map((link) => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}
      </nav>
      <button className="menu-button" type="button" aria-label={open ? '关闭导航菜单' : '打开导航菜单'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <div className={`mobile-menu ${open ? 'mobile-menu--open' : ''}`} aria-hidden={!open}>
        <nav aria-label="移动端主导航">
          {links.map((link, index) => (
            <NavLink key={link.to} to={link.to} tabIndex={open ? 0 : -1} style={{ '--menu-index': index } as CSSProperties} onClick={() => setOpen(false)}>
              <span>0{index + 1}</span>{link.label}
            </NavLink>
          ))}
        </nav>
        <p>{siteConfig.footer}</p>
      </div>
    </header>
  )
}
