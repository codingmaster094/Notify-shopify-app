export function getRequiredEnv(key) {
  const value = process.env[key];

  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function requireEnv(keys) {
  keys.forEach(getRequiredEnv);
}
