import { SeoHead } from './SeoHead';
import { usePageSeo } from '../../hooks/usePageSeo';

/** Mount once inside HashRouter to apply per-route meta tags. */
export function RouteSeo() {
  const config = usePageSeo();
  return <SeoHead config={config} />;
}