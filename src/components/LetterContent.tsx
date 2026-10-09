import Markdown, { defaultUrlTransform } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { assetUrl } from '../utils/url'

export function LetterContent({ content }: { content: string }) {
  return <div className="letter-viewer__body">
    <Markdown
      skipHtml
      remarkPlugins={[remarkBreaks]}
      urlTransform={(url, key) => {
        const safeUrl = defaultUrlTransform(url)
        if (key === 'src' && safeUrl && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(safeUrl)) {
          return assetUrl(safeUrl.replace(/^\.\//, ''))
        }
        return safeUrl
      }}
      components={{
        h1: 'h3', h2: 'h3',
        img: ({ src, alt, title }) => <img src={src} alt={alt ?? ''} title={title} loading="lazy" decoding="async" />,
      }}
    >{content}</Markdown>
  </div>
}
