import { useEffect } from 'react';

export function Seo({ title, description, ogImage }: { title?: string; description?: string; ogImage?: string }) {
  useEffect(() => {
    if (title) document.title = title;
    const set = (attr: 'name' | 'property', key: string, value?: string) => {
      if (!value) return;
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = value;
    };
    set('name', 'description', description);
    set('property', 'og:title', title);
    set('property', 'og:description', description);
    set('property', 'og:image', ogImage);
  }, [title, description, ogImage]);
  return null;
}
