import React from 'react';

type OptimizedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** High priority for LCP (hero first slide, logo above fold) */
  priority?: boolean;
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  priority = false,
  loading,
  decoding = 'async',
  alt,
  ...props
}) => (
  <img
    alt={alt ?? ''}
    loading={loading ?? (priority ? 'eager' : 'lazy')}
    decoding={decoding}
    fetchPriority={priority ? 'high' : 'auto'}
    {...props}
  />
);