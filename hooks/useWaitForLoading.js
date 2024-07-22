import { useEffect, useRef } from 'react';

// Custom hook to wait for isLoading to become false
export const useWaitForLoading = (isLoading) => {
  const resolveRef = useRef(null);

  useEffect(() => {
    if (!isLoading && resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, [isLoading]);

  const waitForLoading = () => {
    return new Promise((resolve) => {
      if (!isLoading) {
        resolve();
      } else {
        resolveRef.current = resolve;
      }
    });
  };

  return waitForLoading;
};
