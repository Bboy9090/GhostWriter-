import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export interface WebVitalsReport {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Initialize Web Vitals monitoring
 * Reports Core Web Vitals to console in development
 * Can be extended to send to analytics service in production
 */
export function initWebVitals(onReport?: (metric: WebVitalsReport) => void) {
  const reportMetric = (metric: WebVitalsReport) => {
    if (import.meta.env.DEV) {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }

    // Send to analytics service in production
    if (onReport) {
      onReport(metric);
    }
  };

  onCLS(reportMetric);
  onFID(reportMetric);
  onFCP(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
  onINP(reportMetric);
}

/**
 * Measure component render performance
 */
export function measureRender(componentName: string) {
  if (import.meta.env.DEV) {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
    };
  }

  return () => {};
}

/**
 * Measure async operation performance
 */
export async function measureAsync<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - start;

    if (import.meta.env.DEV) {
      console.log(`[Performance] ${operationName} completed in ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}
