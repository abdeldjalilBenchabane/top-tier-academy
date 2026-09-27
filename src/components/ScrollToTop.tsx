import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Starts every new page at the top.
 *
 * React Router replaces the page without touching the scroll position, so
 * following a link from halfway down a long page dropped you into the middle
 * of the next one — picking a subject at the bottom of the landing page
 * landed on the courses page level with the footer, and you had to scroll up
 * to find the very list you had just asked for.
 *
 * Back and forward are left alone: returning to a page should put you back
 * where you were reading, not at the top.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
}
