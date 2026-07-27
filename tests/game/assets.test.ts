import { describe, expect, it } from "vitest";

import { ASSETS } from "../../src/game/data/assets";
import { gameAssetUrls } from "../../src/game/data/preloadAssets";

describe("runtime assets", () => {
  it("lists every image once for startup preload", () => {
    const urls = gameAssetUrls();

    expect(urls).toContain(ASSETS.backgrounds.desktop);
    expect(urls).toContain(ASSETS.characters.heroineCar);
    expect(urls).toContain(ASSETS.items.contract);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
