export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function jitter(baseMs: number, variance = 0.3): number {
  const delta = baseMs * variance;
  return baseMs + (Math.random() * delta * 2 - delta);
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export async function smoothScroll(targetY: number, durationMs = 1000): Promise<void> {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();
  
  return new Promise(resolve => {
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      
      window.scrollTo(0, startY + distance * ease);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(animate);
  });
}

export function createRateLimiter(rate: number, perMs: number) {
  let tokens = rate;
  let lastRefill = Date.now();
  
  return {
    async consume(): Promise<void> {
      const now = Date.now();
      const elapsed = now - lastRefill;
      const refill = Math.floor((elapsed / perMs) * rate);
      tokens = Math.min(rate, tokens + refill);
      lastRefill = now;
      
      if (tokens <= 0) {
        const wait = perMs / rate;
        await new Promise(r => setTimeout(r, wait));
        return this.consume();
      }
      
      tokens--;
    },
    
    canConsume(): boolean {
      const now = Date.now();
      const elapsed = now - lastRefill;
      const refill = Math.floor((elapsed / perMs) * rate);
      return (tokens + refill) > 0;
    },
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = waitMs - (now - lastCall);
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, waitMs);
  };
}
