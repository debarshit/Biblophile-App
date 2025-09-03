import sanitizeHtml from 'sanitize-html';

export const ALLOWED_TAGS = [
  'b','strong','i','em','s','strike','del',
  'p','br','div','span','blockquote','ul','ol','li','h1','h2'
];

export const ALLOWED_ATTR = ['data-spoiler', 'class'];

export function sanitizeHTML(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      span: ['data-spoiler', 'class'],
      '*': ['class'] // allow class globally if needed
    },
    disallowedTagsMode: 'discard',
  });
}