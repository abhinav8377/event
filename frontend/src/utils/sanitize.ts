import DOMPurify from "dompurify"

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4",
      "p", "br", "strong", "em", "u", "s",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "hr",
      "span",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
  })
}
