import { lazy, Suspense } from 'react';

const withLazyLoading = (importFunc, fallback = <div>Loading...</div>) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default withLazyLoading;