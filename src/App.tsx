import { ArrowRight, ImageOff, MoveRight } from 'lucide-react'
import { useDeferredValue, useEffect, useState } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { ArchiveControls } from './components/ArchiveControls'
import { EmptyState } from './components/EmptyState'
import { Hero } from './components/Hero'
import { Lightbox } from './components/Lightbox'
import { MasonryGrid } from './components/MasonryGrid'
import { Navbar } from './components/Navbar'
import { Reveal } from './components/Reveal'
import { ScrollProgress } from './components/ScrollProgress'
import { Timeline } from './components/Timeline'
import { siteConfig } from './data/site-config'
import type { Photo, PhotoManifest, SortOrder } from './types/photo'
import { groupPhotosByYearAndMonth, searchablePhotoText, sortPhotos } from './utils/photos'
import { assetUrl } from './utils/url'

function App() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetch(assetUrl('photos.json'), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`照片清单读取失败 (${response.status})`)
        return response.json() as Promise<PhotoManifest>
      })
      .then((manifest) => setPhotos(manifest.photos))
      .catch((error: unknown) => {
        if ((error as Error).name !== 'AbortError') setLoadError((error as Error).message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  return (
    <HashRouter>
      <Navbar />
      <ScrollProgress />
      {loading ? <LoadingScreen /> : loadError ? <LoadError message={loadError} /> : <Routes>
        <Route path="/" element={<HomePage photos={photos} />} />
        <Route path="/gallery" element={<ArchivePage photos={photos} mode="gallery" />} />
        <Route path="/timeline" element={<ArchivePage photos={photos} mode="timeline" />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<HomePage photos={photos} />} />
      </Routes>}
      <footer className="site-footer container"><span>{siteConfig.footer}</span><span>EST. 2026</span></footer>
    </HashRouter>
  )
}

function HomePage({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<Photo | null>(null)
  const featured = photos.slice(0, 8)
  return <>
    <Hero photos={photos} />
    <main className="container home-content">
      <Reveal className="section-intro">
        <div><p className="eyebrow">RECENT OBSERVATIONS</p><h2>最近收录</h2></div>
        <Link className="text-link" to="/gallery">全部影像 <ArrowRight size={16} aria-hidden="true" /></Link>
      </Reveal>
      {featured.length ? <MasonryGrid photos={featured} onOpen={setSelected} /> : <EmptyState />}
    </main>
    {selected && <Lightbox photos={featured} selected={selected} onClose={() => setSelected(null)} onSelect={setSelected} />}
  </>
}

function ArchivePage({ photos, mode }: { photos: Photo[]; mode: 'gallery' | 'timeline' }) {
  const [year, setYear] = useState<number | null>(null)
  const [month, setMonth] = useState<number | null>(null)
  const [album, setAlbum] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [selected, setSelected] = useState<Photo | null>(null)
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase('zh-CN'))
  const years = [...new Set(photos.map((photo) => photo.year))].sort((left, right) => right - left)
  const months = [...new Set(photos.map((photo) => photo.month))].sort((left, right) => right - left)
  const albums = [...new Set(photos.map((photo) => photo.album))].sort((left, right) => left.localeCompare(right, 'zh-CN'))
  const filtered = sortPhotos(photos.filter((photo) => (
    (!year || photo.year === year)
    && (!month || photo.month === month)
    && (!album || photo.album === album)
    && (!deferredQuery || searchablePhotoText(photo).includes(deferredQuery))
  )), sortOrder)
  const groupCount = groupPhotosByYearAndMonth(filtered).length
  const reset = () => { setYear(null); setMonth(null); setAlbum(null); setQuery(''); setSortOrder('newest') }

  return <main className="archive-page container">
    <Reveal className="archive-header">
      <p className="eyebrow">{mode === 'gallery' ? 'THE COMPLETE COLLECTION' : 'CHRONOLOGICAL RECORD'}</p>
      <h1>{mode === 'gallery' ? '全部影像' : '时间坐标'}</h1>
      <p>{mode === 'gallery' ? '每一次停留，都是一个可被重新抵达的瞬间。' : '顺着时间往回走，所有画面都在这里留下坐标。'}</p>
      <div className="archive-header__stat"><strong>{filtered.length}</strong> FRAMES <span /> <strong>{groupCount}</strong> YEARS</div>
    </Reveal>
    <Reveal delay={80}><ArchiveControls years={years} months={months} albums={albums} year={year} month={month} album={album} query={query} sortOrder={sortOrder} onYearChange={setYear} onMonthChange={setMonth} onAlbumChange={setAlbum} onQueryChange={setQuery} onSortOrderChange={setSortOrder} /></Reveal>
    {filtered.length ? mode === 'gallery' ? <GallerySections photos={filtered} onOpen={setSelected} /> : <Timeline photos={filtered} onOpen={setSelected} /> : <EmptyState filtered onReset={reset} />}
    {selected && <Lightbox photos={filtered} selected={selected} onClose={() => setSelected(null)} onSelect={setSelected} />}
  </main>
}

function GallerySections({ photos, onOpen }: { photos: Photo[]; onOpen: (photo: Photo) => void }) {
  return <div className="gallery-sections">
    {groupPhotosByYearAndMonth(photos).map(({ year, months }, index) => <Reveal className="gallery-year" key={year} delay={index * 60}>
      <div className="gallery-year__label"><span>{year}</span><i /></div>
      {months.map(({ month, photos: monthPhotos }) => <div className="gallery-month" key={`${year}-${month}`}>
        <div className="gallery-month__heading"><h2>{month} 月</h2><span>{monthPhotos.length} FRAMES</span></div>
        <MasonryGrid photos={monthPhotos} onOpen={onOpen} />
      </div>)}
    </Reveal>)}
  </div>
}

function AboutPage() {
  return <main className="about-page container">
    <p className="eyebrow">ABOUT THE ARCHIVE</p>
    <h1>不是照片的堆叠，<br />是时间的显影。</h1>
    <div className="about-page__grid">
      <p>这是一个持续生长的个人影像档案。它不试图解释每一个瞬间，只为画面留出足够安静的空间。</p>
      <p>每张照片按拍摄日期整理，在静态网页中保存。没有后端、没有数据库，只有被认真保留的光线与记忆。</p>
    </div>
    <Link className="round-link" to="/gallery">进入档案 <MoveRight aria-hidden="true" /></Link>
  </main>
}

function LoadingScreen() {
  return <main className="loading-screen"><p className="eyebrow">LOADING ARCHIVE</p><span /></main>
}

function LoadError({ message }: { message: string }) {
  return <main className="load-error"><ImageOff size={32} aria-hidden="true" /><h1>档案暂时无法读取</h1><p>{message}</p><p>请先运行 <code>npm run generate:photos</code> 后重新启动网站。</p></main>
}

export default App
