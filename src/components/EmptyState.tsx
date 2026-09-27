import { Images, RotateCcw } from 'lucide-react'

interface EmptyStateProps {
  filtered?: boolean
  onReset?: () => void
}

export function EmptyState({ filtered = false, onReset }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <Images size={30} aria-hidden="true" />
      <p className="eyebrow">{filtered ? 'NO MATCHES' : 'ARCHIVE WAITING'}</p>
      <h2>{filtered ? '没有符合条件的照片' : '等待第一段照片记忆'}</h2>
      <p>{filtered ? '尝试更换关键词或清除当前筛选条件。' : '将命名规范的照片放进 public/photos/ 后重新构建。'}</p>
      {filtered && onReset && <button className="text-button" type="button" onClick={onReset}><RotateCcw size={15} aria-hidden="true" /> 清除筛选</button>}
    </section>
  )
}
