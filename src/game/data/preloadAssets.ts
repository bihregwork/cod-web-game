import { ASSETS } from "./assets";

const IMAGE_ASSET_URLS = uniqueAssetUrls(collectAssetUrls(ASSETS));

let preloadPromise: Promise<void> | null = null;

export function preloadGameAssets(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = Promise.all(IMAGE_ASSET_URLS.map(preloadImage)).then(() => undefined);
  }

  return preloadPromise;
}

export function gameAssetUrls(): string[] {
  return IMAGE_ASSET_URLS;
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (!image.decode) {
        resolve();
        return;
      }

      image.decode().then(resolve).catch(resolve);
    };
    image.onerror = () => resolve();
    image.src = src;
  });
}

function collectAssetUrls(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.values(value as Record<string, unknown>).flatMap(collectAssetUrls);
}

function uniqueAssetUrls(urls: string[]): string[] {
  return [...new Set(urls)];
}
