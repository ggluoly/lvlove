import { ArrowRight, ImageOff, MoveRight } from 'lucide-react'
import { useDeferredValue, useEffect, useState } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { ArchiveControls } from './components/ArchiveControls'
import { EmptyState } from './components/EmptyState'
import { Hero } from './components/Hero'
import { LetterCard } from './components/LetterCard'
import { LetterViewer } from './components/LetterViewer'
import { Lightbox } from './components/Lightbox'
import { MasonryGrid } from './components/MasonryGrid'
import { Navbar } from './components/Navbar'
import { Reveal } from './components/Reveal'
import { ScrollProgress } from './components/ScrollProgress'
import { Timeline } from './components/Timeline'
import { siteConfig } from './data/site-config'
import type { Letter, LetterManifest } from './types/letter'
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
        <Route path="/letters" element={<LettersPage />} />
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
        <div><p className="eyebrow">THE DAYS WE KEPT</p><h2>靠近的片段</h2></div>
        <Link className="text-link" to="/gallery">人间小满 <ArrowRight size={16} aria-hidden="true" /></Link>
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
      <p className="eyebrow">{mode === 'gallery' ? 'THE DAYS WE KEPT' : 'A WALK THROUGH TIME'}</p>
      <h1>{mode === 'gallery' ? '人间小满' : '沿途的光'}</h1>
      <p>{mode === 'gallery' ? '那些不必解释的瞬间，都被好好留在这里。' : '顺着走过的日子，把每一次回头都变成坐标。'}</p>
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

function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Letter | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(assetUrl('letters.json'), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`信件清单读取失败 (${response.status})`)
        return response.json() as Promise<LetterManifest>
      })
      .then((manifest) => { if (!controller.signal.aborted) setLetters(manifest.letters) })
      .catch((error: unknown) => {
        if ((error as Error).name !== 'AbortError') setLoadError((error as Error).message)
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  return <main className="letters-page container">
    <Reveal className="archive-header">
      <p className="eyebrow">WORDS KEPT FOR YOU</p>
      <h1>纸短情长</h1>
      <p>有些话不急着说出口，就先放在这里，等一个安静的时刻被你拆开。</p>
    </Reveal>
    {loading ? <p role="status" className="letters-page__error">正在整理写给你的话…</p> : loadError ? (
      <p className="letters-page__error">{loadError}，请先运行 <code>npm run generate:letters</code>。</p>
    ) : letters.length ? (
      <div className="letters-list">
        {letters.map((letter, index) => (
          <LetterCard key={letter.id} letter={letter} index={index} onOpen={setSelected} />
        ))}
      </div>
    ) : (
      <section className="letters-page__empty"><h2>有些话，正在落笔</h2><p>下一封信，会在这里等你。</p></section>
    )}
    {selected && <LetterViewer key={selected.id} letter={selected} onClose={() => setSelected(null)} />}
  </main>
}

function AboutPage() {
  return <main className="about-page container">
    <p className="eyebrow">ABOUT THE ARCHIVE</p>
    <h1>不是照片的堆叠，<br />是日子慢慢发亮。</h1>
    <div className="about-page__grid">
      <p>这里收着一些无需解释的瞬间。它不急着讲述，只让画面留出足够安静的空间。</p>
      <p>有些日子不必反复回望，也会在某个安静的时刻重新发亮。愿路过的风、落下的晚霞和说过的话，都替我们好好记得。</p>
    </div>
    <Link className="round-link" to="/gallery">翻看片段 <MoveRight aria-hidden="true" /></Link>
  </main>
}

function LoadingScreen() {
  return <main className="loading-screen"><p className="eyebrow">LOADING ARCHIVE</p><span /></main>
}

function LoadError({ message }: { message: string }) {
  return <main className="load-error"><ImageOff size={32} aria-hidden="true" /><h1>档案暂时无法读取</h1><p>{message}</p><p>请先运行 <code>npm run generate:photos</code> 后重新启动网站。</p></main>
}

export default App
