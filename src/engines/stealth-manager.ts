import type { BrowserContext } from 'playwright'

export interface StealthConfig {
  webdriver: boolean
  chrome: boolean
  permissions: boolean
  plugins: boolean
  languages: boolean
}

export class StealthManager {
  private config: StealthConfig
  
  constructor(config: Partial<StealthConfig> = {}) {
    this.config = {
      webdriver: true,
      chrome: true,
      permissions: true,
      plugins: true,
      languages: true,
      ...config
    }
  }
  
  async apply(context: BrowserContext): Promise<void> {
    if (this.config.webdriver) {
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false })
      })
    }
    
    if (this.config.chrome) {
      await context.addInitScript(() => {
        (window as any).chrome = {
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
          app: {}
        }
      })
    }
    
    if (this.config.permissions) {
      await context.addInitScript(() => {
        const originalQuery = window.navigator.permissions.query
        window.navigator.permissions.query = (parameters: any) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
            : originalQuery(parameters)
      })
    }
    
    if (this.config.plugins) {
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        })
      })
    }
    
    if (this.config.languages) {
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        })
      })
    }
  }
}
