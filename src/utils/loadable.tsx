import React, { lazy, ReactNode, Suspense } from 'react';

const loadable = (
  importFunc: any,
  { fallback }: { fallback?: ReactNode } = {},
) => {
  const LazyComponent: React.FC = lazy(importFunc);

  return (props: any) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default loadable;
