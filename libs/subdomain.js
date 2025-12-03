/**
 * Subdomain Generator
 * Generates unique adjective-noun combinations for Alfred instances
 */

const { getDb } = require('./mongo');

// ~100 adjectives for subdomain generation
const ADJECTIVES = [
  'agile', 'azure', 'bold', 'brave', 'bright', 'calm', 'clear', 'clever',
  'cosmic', 'cozy', 'crisp', 'daring', 'deft', 'eager', 'epic', 'fair',
  'fancy', 'fast', 'fierce', 'fine', 'fleet', 'fluffy', 'fresh', 'gentle',
  'gleam', 'gold', 'grand', 'great', 'green', 'happy', 'hardy', 'hasty',
  'humble', 'icy', 'jade', 'jolly', 'keen', 'kind', 'lemon', 'light',
  'lime', 'lively', 'lucky', 'magic', 'merry', 'mild', 'mint', 'misty',
  'neat', 'nice', 'noble', 'novel', 'olive', 'orange', 'pale', 'peace',
  'pearl', 'perky', 'pine', 'pink', 'plum', 'polar', 'prime', 'proud',
  'pure', 'quick', 'quiet', 'rapid', 'rare', 'red', 'rich', 'rocky',
  'rosy', 'royal', 'ruby', 'rusty', 'sage', 'sandy', 'sharp', 'shiny',
  'silent', 'silver', 'sleek', 'slim', 'smart', 'smooth', 'snowy', 'soft',
  'solar', 'solid', 'spicy', 'spring', 'steel', 'still', 'stone', 'stormy',
  'sunny', 'super', 'sweet', 'swift', 'teal', 'tender', 'tidy', 'tiny',
  'vivid', 'warm', 'wavy', 'wild', 'wise', 'witty', 'young', 'zesty',
];

// ~100 nouns for subdomain generation
const NOUNS = [
  'acorn', 'apple', 'arrow', 'badge', 'beach', 'bear', 'bee', 'bell',
  'berry', 'bird', 'bloom', 'boat', 'book', 'brook', 'bunny', 'cake',
  'candle', 'cave', 'cedar', 'cherry', 'cliff', 'cloud', 'clover', 'coral',
  'crane', 'creek', 'crown', 'daisy', 'dawn', 'deer', 'delta', 'dew',
  'dove', 'dream', 'dune', 'eagle', 'elm', 'ember', 'falcon', 'fawn',
  'fern', 'finch', 'flame', 'flare', 'flora', 'forest', 'fox', 'frost',
  'gem', 'glade', 'grove', 'harbor', 'hawk', 'heart', 'heron', 'hill',
  'honey', 'island', 'ivy', 'jade', 'jay', 'jewel', 'lake', 'lark',
  'leaf', 'lily', 'lotus', 'maple', 'marsh', 'meadow', 'moon', 'moss',
  'nest', 'nova', 'oak', 'ocean', 'olive', 'otter', 'owl', 'palm',
  'panda', 'peach', 'peak', 'peanut', 'pearl', 'pebble', 'phoenix', 'pine',
  'planet', 'pond', 'rain', 'raven', 'reef', 'ridge', 'river', 'robin',
  'rose', 'sage', 'seed', 'shore', 'sky', 'snow', 'spark', 'spring',
  'star', 'stone', 'storm', 'stream', 'sun', 'swan', 'thunder', 'tiger',
  'trail', 'tree', 'tulip', 'valley', 'wave', 'willow', 'wind', 'wolf',
];

/**
 * Generates a random adjective-noun subdomain combination
 * @returns {string} Subdomain like 'cozy-peanut'
 */
function generateRandomSubdomain() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}-${noun}`;
}

/**
 * Checks if a subdomain is available (not already in use)
 * @param {string} subdomain - Subdomain to check
 * @returns {Promise<boolean>} True if available, false if taken
 */
async function isSubdomainAvailable(subdomain) {
  if (!subdomain) {
    throw new Error('Subdomain is required');
  }

  const db = await getDb();
  const existing = await db.collection('instances').findOne({
    subdomain: subdomain,
    status: { $nin: ['deleted', 'failed'] },
  });

  return !existing;
}

/**
 * Generates a unique subdomain that is not already in use
 * Retries with different combinations until an available one is found
 * @param {number} maxAttempts - Maximum attempts before giving up (default: 100)
 * @returns {Promise<string>} Unique available subdomain
 */
async function generateSubdomain(maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const subdomain = generateRandomSubdomain();
    const available = await isSubdomainAvailable(subdomain);

    if (available) {
      return subdomain;
    }
  }

  // If we couldn't find a unique combo, add a random suffix
  const subdomain = generateRandomSubdomain();
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${subdomain}-${suffix}`;
}

/**
 * Validates a subdomain format
 * @param {string} subdomain - Subdomain to validate
 * @returns {boolean} True if valid format
 */
function isValidSubdomainFormat(subdomain) {
  // Must be lowercase alphanumeric with hyphens, 3-63 chars
  const regex = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/;
  return regex.test(subdomain) && !subdomain.includes('--');
}

/**
 * Gets the total number of possible combinations
 * @returns {number} Total possible unique combinations
 */
function getTotalCombinations() {
  return ADJECTIVES.length * NOUNS.length;
}

module.exports = {
  generateSubdomain,
  isSubdomainAvailable,
  isValidSubdomainFormat,
  generateRandomSubdomain,
  getTotalCombinations,
  ADJECTIVES,
  NOUNS,
};
