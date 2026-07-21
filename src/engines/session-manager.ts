import type Database from 'better-sqlite3'
import { createHash, randomBytes } from 'crypto'

export interface SessionConfig {
  idleTimeout: number
  autoSaveInterval: number
  stateExpirationDays: number
  encryptionKey?: string
}

export class SessionManager {
  private lastActivity: number = Date.now()
  private idleTimer?: ReturnType<typeof setTimeout>
  private autoSaveTimer?: ReturnType<typeof setInterval>
  
  constructor(
    private db: Database.Database,
    private config: Partial<SessionConfig> = {}
  ) {
    this.config = {
      idleTimeout: 300000,
      autoSaveInterval: 30000,
      stateExpirationDays: 30,
      ...config
    }
  }
  
  startActivity(): void {
    this.lastActivity = Date.now()
  }
  
  checkIdle(onIdle: () => void): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => {
      onIdle()
    }, this.config.idleTimeout!)
  }
  
  startAutoSave(saveFn: () => Promise<void>): void {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer)
    this.autoSaveTimer = setInterval(async () => {
      await saveFn()
    }, this.config.autoSaveInterval!)
  }
  
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = undefined
    }
  }
  
  async expireOldStates(): Promise<number> {
    const cutoff = Date.now() - (this.config.stateExpirationDays! * 24 * 60 * 60 * 1000)
    const result = this.db.prepare('DELETE FROM session_memory WHERE last_visit < ?').run(cutoff)
    return result.changes
  }
  
  encrypt(data: string): string {
    if (!this.config.encryptionKey) return data
    const key = createHash('sha256').update(this.config.encryptionKey).digest()
    const iv = randomBytes(16)
    const cipher = require('crypto').createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  }
  
  decrypt(data: string): string {
    if (!this.config.encryptionKey) return data
    const [ivHex, encrypted] = data.split(':')
    const key = createHash('sha256').update(this.config.encryptionKey).digest()
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = require('crypto').createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
}
