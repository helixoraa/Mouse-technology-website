import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { mediaUrl, useSite } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SHARE_IMAGE } from '@/lib/seo-defaults';

interface SeoProps {
  title?: string;
  description?: string;
  ogImage?: string;
}

/** Find or create <meta name|property="key"> and set its content. */
function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

function removeMeta(attr: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

/** Path without a trailing slash (except "/"), no query or hash: the URL we want shared and indexed. */
const cleanPath = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/');

/**
 * Per-page title, description and link-preview tags. Every tag is always written (falling back to the CMS
 * site defaults, then to src/lib/seo-defaults.ts), so nothing from the previous page survives a client-side navigation.
 */
export function Seo({ title, description, ogImage }: SeoProps) {
  const { pathname } = useLocation();
  const { data: site } = useSite();
  const defaults = site?.seo?.default;

  useEffect(() => {
    const t = title || defaults?.title || DEFAULT_TITLE;
    const d = description || defaults?.description || DEFAULT_DESCRIPTION;
    const cmsImage = ogImage || defaults?.ogImage;
    const image = cmsImage ? absoluteUrl(mediaUrl(cmsImage)) : absoluteUrl(SHARE_IMAGE.path);
    const url = absoluteUrl(cleanPath(pathname));

    document.title = t;
    setMeta('name', 'description', d);
    setMeta('property', 'og:title', t);
    setMeta('property', 'og:description', d);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:title', t);
    setMeta('name', 'twitter:description', d);
    setMeta('name', 'twitter:image', image);
    // Size/type/alt describe the built-in share image only; drop them for a CMS image of unknown size.
    if (cmsImage) {
      ['og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt'].forEach((k) => removeMeta('property', k));
      removeMeta('name', 'twitter:image:alt');
    } else {
      setMeta('property', 'og:image:type', 'image/jpeg');
      setMeta('property', 'og:image:width', String(SHARE_IMAGE.width));
      setMeta('property', 'og:image:height', String(SHARE_IMAGE.height));
      setMeta('property', 'og:image:alt', SHARE_IMAGE.alt);
      setMeta('name', 'twitter:image:alt', SHARE_IMAGE.alt);
    }
  }, [title, description, ogImage, defaults?.title, defaults?.description, defaults?.ogImage, pathname]);

  return null;
}
