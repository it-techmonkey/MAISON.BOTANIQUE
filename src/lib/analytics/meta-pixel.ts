const PIXEL_ID = '1111065858477795';
let initialized = false;

type Fbq = ((...args: string[]) => void) & {
  callMethod?: (...args: string[]) => void;
  queue: string[][];
  loaded: boolean;
  version: string;
  push: (...args: string[]) => void;
};

/** Called only after Shopify allows marketing and data sharing. */
export function metaPageView() {
  const browser = window as Window & { fbq?: Fbq; _fbq?: Fbq };
  if (!initialized) {
    if (!browser.fbq) {
      const fbq = ((...args: string[]) => fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args)) as Fbq;
      fbq.queue = [];
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.push = fbq;
      browser.fbq = browser._fbq = fbq;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }
    browser.fbq('init', PIXEL_ID);
    initialized = true;
  }
  browser.fbq?.('track', 'PageView');
}
