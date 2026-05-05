import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

/**
 * Get encryption key from env or derive a default.
 * For production, set ENCRYPT_KEY in .env (32-char hex or base64).
 */
function getKey(): Buffer {
  const envKey = process.env.ENCRYPT_KEY
  if (envKey) {
    // Support hex (64 chars) or raw (32 chars)
    if (envKey.length === 64) return Buffer.from(envKey, 'hex')
    return crypto.createHash('sha256').update(envKey).digest()
  }
  // Fallback: derive from DATABASE_URL + static salt
  const seed = (process.env.DATABASE_URL || '') + 'portal-ai-config-salt-2026'
  return crypto.createHash('sha256').update(seed).digest()
}

/**
 * Encrypt plaintext with AES-256-CBC.
 * Returns: iv:ciphertext (both hex-encoded)
 */
export function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt ciphertext produced by encrypt().
 * Input: iv:ciphertext (hex-encoded)
 */
export function decrypt(text: string): string {
  const key = getKey()
  const [ivHex, encryptedHex] = text.split(':')
  if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted format')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Check if a string looks like it was encrypted by encrypt()
 */
export function isEncrypted(text: string): boolean {
  if (!text || !text.includes(':')) return false
  const [ivHex] = text.split(':')
  return ivHex.length === IV_LENGTH * 2 && /^[0-9a-f]+$/.test(ivHex)
}
