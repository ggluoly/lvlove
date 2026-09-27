import { Search, SlidersHorizontal } from 'lucide-react'
import type { SortOrder } from '../types/photo'

interface ArchiveControlsProps {
  years: number[]
  months: number[]
  albums: string[]
  year: number | null
  month: number | null
  album: string | null
  query: string
  sortOrder: SortOrder
  onYearChange: (value: number | null) => void
  onMonthChange: (value: number | null) => void
  onAlbumChange: (value: string | null) => void
  onQueryChange: (value: string) => void
  onSortOrderChange: (value: SortOrder) => void
}

export function ArchiveControls({
  years, months, albums, year, month, album, query, sortOrder,
  onYearChange, onMonthChange, onAlbumChange, onQueryChange, onSortOrderChange,
}: ArchiveControlsProps) {
  return (
    <section className="archive-controls" aria-label="相册筛选和排序">
      <div className="control-label"><SlidersHorizontal size={16} aria-hidden="true" /> FILTER ARCHIVE</div>
      <div className="control-row">
        <label className="search-control">
          <Search size={17} aria-hidden="true" />
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索标题、日期、标签..." aria-label="搜索照片" />
        </label>
        <select value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value as SortOrder)} aria-label="照片排序">
          <option value="newest">最新在前</option>
          <option value="oldest">最早在前</option>
        </select>
      </div>
      <div className="filter-groups">
        <FilterGroup label="年份" values={years.map(String)} selected={year ? String(year) : null} onChange={(value) => onYearChange(value ? Number(value) : null)} />
        <FilterGroup label="月份" values={months.map(String)} selected={month ? String(month) : null} format={(value) => `${value} 月`} onChange={(value) => onMonthChange(value ? Number(value) : null)} />
        <FilterGroup label="分类" values={albums} selected={album} onChange={onAlbumChange} />
      </div>
    </section>
  )
}

interface FilterGroupProps {
  label: string
  values: string[]
  selected: string | null
  format?: (value: string) => string
  onChange: (value: string | null) => void
}

function FilterGroup({ label, values, selected, format = (value) => value, onChange }: FilterGroupProps) {
  return (
    <div className="filter-group">
      <span>{label}</span>
      <div className="filter-pills">
        <button className={!selected ? 'is-active' : ''} type="button" onClick={() => onChange(null)}>全部</button>
        {values.map((value) => <button className={selected === value ? 'is-active' : ''} key={value} type="button" onClick={() => onChange(value)}>{format(value)}</button>)}
      </div>
    </div>
  )
}
