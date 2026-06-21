import React from 'react';
import { COMPANY_LOGO_PNG, COMPANY_LOGO_WEBP } from '../../lib/brand-assets';

type OptimizedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** High priority for LCP (hero first slide, logo above fold) */
  priority?: boolean;
};

function webpSrc(src: string | undefined): string | null {
  if (!src || src.startsWith('data:') || src.startsWith('blob:') || /^https?:\/\//i.test(src)) {
    return null;
  }
  if (src === COMPANY_LOGO_PNG) {
    return COMPANY_LOGO_WEBP;
  }
  if (!/\.(jpe?g|png)$/i.test(src)) return null;
  return src.replace(/\.(jpe?g|png)$/i, '.webp');
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  priority = false,
  loading,
  decoding = 'async',
  alt,
  src,
  ...props
}) => {
  const imgProps: React.ImgHTMLAttributes<HTMLImageElement> = {
    alt: alt ?? '',
    src,
    loading: loading ?? (priority ? 'eager' : 'lazy'),
    decoding,
    fetchPriority: priority ? 'high' : 'auto',
    ...props,
  };

  const webp = webpSrc(typeof src === 'string' ? src : undefined);
  if (!webp) {
    return <img {...imgProps} />;
  }

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img {...imgProps} />
    </picture>
  );
};