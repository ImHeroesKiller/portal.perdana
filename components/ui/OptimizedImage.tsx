import React from 'react';
import { resolveWebpSrc } from '../../lib/hero-assets';

type OptimizedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** High priority for LCP (hero first slide, logo above fold) */
  priority?: boolean;
};

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

  const webp = resolveWebpSrc(typeof src === 'string' ? src : undefined);
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