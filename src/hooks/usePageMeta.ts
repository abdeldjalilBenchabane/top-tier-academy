import { useEffect } from 'react';

/**
 * Per-page title, description and canonical URL.
 *
 * This is a single-page app: index.html is served for every route, so its
 * <title> and <meta description> were the only ones that ever existed. Those
 * tags describe the homepage, which meant /TTHCourses, /TTHLanguages and
 * /TTHLiveClasses all told Google they were the homepage. Duplicate titles and
 * descriptions across a site are one of the things a search engine actively
 * penalises, and without a canonical link it cannot tell which page to rank.
 *
 * No library: react-helmet would be a dependency for something the DOM already
 * does. Each page calls this once and the tags follow the route.
 */

const SITE = 'https://top-tier.academy';
const SITE_NAME = 'Top Tier Academy';
const DEFAULT_IMAGE = `${SITE}/2.svg`;

export interface PageMeta {
  /** Shown in the browser tab and as the search result headline. */
  title: string;
  /** The snippet under the search result. Aim for 120-160 characters. */
  description: string;
  /** Canonical path, starting with a slash — e.g. '/TTHCourses'. */
  path: string;
  /** Keep this page out of search results (dashboards, checkout callbacks). */
  noindex?: boolean;
  /** Absolute URL of the social preview image. */
  image?: string;
}

/** Create the tag if it is missing, then set its content. */
function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function usePageMeta({ title, description, path, noindex, image }: PageMeta) {
  useEffect(() => {
    const url = `${SITE}${path}`;
    const img = image || DEFAULT_IMAGE;
    // The tab shows the page first; the brand is the tail, as search engines
    // truncate from the right.
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    document.title = fullTitle;

    setMeta('meta[name="title"]', 'name', 'title', fullTitle);
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[name="robots"]', 'name', 'robots',
      noindex ? 'noindex, nofollow' : 'index, follow');

    setCanonical(url);

    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:image"]', 'property', 'og:image', img);

    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', img);
  }, [title, description, path, noindex, image]);
}

export default usePageMeta;
