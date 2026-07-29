import { ASSETS } from "./assets";

const IMAGE_ASSET_URLS = uniqueAssetUrls(collectAssetUrls(ASSETS));

let preloadPromise: Promise<void> | null = null;
let loadedAssetCount = 0;

type PreloadProgressCallback = (progress: number) => void;

const progressSubscribers = new Set<PreloadProgressCallback>();

export function preloadGameAssets(onProgress?: PreloadProgressCallback): Promise<void> {
  if (onProgress) {
    progressSubscribers.add(onProgress);
    onProgress(assetLoadProgress());
  }

  if (!preloadPromise) {
    preloadPromise = Promise.all(
      IMAGE_ASSET_URLS.map((src) =>
        preloadImage(src).finally(() => {
          loadedAssetCount += 1;
          notifyProgress();
        }),
      ),
    ).then(() => {
      loadedAssetCount = IMAGE_ASSET_URLS.length;
      notifyProgress();
    });
  }

  return preloadPromise.then(() => {
    onProgress?.(100);
  }).finally(() => {
    if (onProgress) {
      progressSubscribers.delete(onProgress);
    }
  });
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

function assetLoadProgress(): number {
  if (IMAGE_ASSET_URLS.length === 0) {
    return 100;
  }

  return Math.round((loadedAssetCount / IMAGE_ASSET_URLS.length) * 100);
}

function notifyProgress(): void {
  const progress = assetLoadProgress();
  for (const subscriber of progressSubscribers) {
    subscriber(progress);
  }
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
