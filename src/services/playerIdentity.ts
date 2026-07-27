const PLAYER_ID_KEY = "cod-web-game:playerId";
const PLAYER_NAME_KEY = "cod-web-game:playerName";
const PLAYER_PROFILES_KEY = "cod-web-game:playerProfiles";
const DEFAULT_PLAYER_NAME = "Игрок";
const PLAYER_NAME_MAX_LENGTH = 20;
const PLAYER_NAME_PATTERN = /^[\p{L}\p{N} _-]+$/u;

export type PlayerProfile = {
  playerId: string;
  name: string;
  profileKey: string;
  updatedAt: string;
};

export function getPlayerId(storage: Storage = window.localStorage): string {
  return getCurrentPlayerProfile(storage).playerId;
}

export function getCurrentPlayerProfile(storage: Storage = window.localStorage): PlayerProfile {
  return getOrCreatePlayerProfile(getPlayerName(storage), storage);
}

export function getOrCreatePlayerProfile(name: string, storage: Storage = window.localStorage): PlayerProfile {
  const validation = validatePlayerName(name);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const normalizedName = validation.name;
  const key = profileKey(normalizedName);
  const profiles = readPlayerProfiles(storage);
  const existing = profiles.find((profile) => profile.profileKey === key);
  const now = new Date().toISOString();

  if (existing) {
    const nextProfile = existing.name === normalizedName ? existing : { ...existing, name: normalizedName, updatedAt: now };
    if (nextProfile !== existing) {
      writePlayerProfiles(
        profiles.map((profile) => (profile.profileKey === key ? nextProfile : profile)),
        storage,
      );
    }
    storage.setItem(PLAYER_NAME_KEY, nextProfile.name);
    return nextProfile;
  }

  const profile = {
    playerId: createPlayerId(),
    name: normalizedName,
    profileKey: key,
    updatedAt: now,
  };
  writePlayerProfiles([...profiles, profile], storage);
  storage.setItem(PLAYER_NAME_KEY, profile.name);
  return profile;
}

export function readPlayerProfiles(storage: Storage = window.localStorage): PlayerProfile[] {
  const raw = storage.getItem(PLAYER_PROFILES_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isPlayerProfile);
      }
    } catch {
      return [];
    }
  }

  const legacyPlayerId = storage.getItem(PLAYER_ID_KEY);
  const legacyName = getPlayerName(storage);
  if (!legacyPlayerId || !validatePlayerName(legacyName).valid) {
    return [];
  }

  return [
    {
      playerId: legacyPlayerId,
      name: legacyName,
      profileKey: profileKey(legacyName),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getPlayerName(storage: Storage = window.localStorage): string {
  const existing = storage.getItem(PLAYER_NAME_KEY);
  return existing && validatePlayerName(existing).valid ? existing : DEFAULT_PLAYER_NAME;
}

export function savePlayerName(name: string, storage: Storage = window.localStorage): string {
  return getOrCreatePlayerProfile(name, storage).name;
}

export function normalizePlayerName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, PLAYER_NAME_MAX_LENGTH);
}

export function validatePlayerName(name: string): { valid: true; name: string } | { valid: false; message: string } {
  const normalized = normalizePlayerName(name);
  if (normalized.length < 1) {
    return { valid: false, message: "Введите имя" };
  }
  if (!PLAYER_NAME_PATTERN.test(normalized)) {
    return { valid: false, message: "Имя: буквы, цифры, пробел, дефис или underscore" };
  }
  return { valid: true, name: normalized };
}

function writePlayerProfiles(profiles: PlayerProfile[], storage: Storage): void {
  storage.setItem(PLAYER_PROFILES_KEY, JSON.stringify(profiles));
}

function profileKey(name: string): string {
  return normalizePlayerName(name).toLocaleLowerCase("ru-RU");
}

function isPlayerProfile(value: unknown): value is PlayerProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Partial<PlayerProfile>;
  return (
    typeof profile.playerId === "string" &&
    typeof profile.name === "string" &&
    typeof profile.profileKey === "string" &&
    typeof profile.updatedAt === "string" &&
    validatePlayerName(profile.name).valid
  );
}

function createPlayerId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) =>
    (Number(character) ^ (Math.random() * 16) >> (Number(character) / 4)).toString(16),
  );
}
