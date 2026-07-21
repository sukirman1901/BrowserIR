import type { Page } from 'playwright'

export interface VisualDiffResult {
  screenshot1: string
  screenshot2: string
  similarity: number
  pixelDiff?: number
}

export class VisualDiffEngine {
  async captureScreenshot(page: Page): Promise<string> {
    const buffer = await page.screenshot({ type: 'png', fullPage: true })
    return buffer.toString('base64')
  }

  async compareScreenshots(before: string, after: string): Promise<VisualDiffResult> {
    return {
      screenshot1: before,
      screenshot2: after,
      similarity: before === after ? 1.0 : 0.5,
      pixelDiff: before !== after ? 1000 : 0,
    }
  }

  async diffPage(page: Page, url1: string, url2: string): Promise<VisualDiffResult> {
    await page.goto(url1, { waitUntil: 'domcontentloaded' })
    const screenshot1 = await this.captureScreenshot(page)
    await page.goto(url2, { waitUntil: 'domcontentloaded' })
    const screenshot2 = await this.captureScreenshot(page)
    return this.compareScreenshots(screenshot1, screenshot2)
  }

  async highlightChanges(page: Page): Promise<string> {
    await page.evaluate(() => {
      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,0,0,0.1);pointer-events:none;z-index:999999'
      document.body.appendChild(overlay)
    })
    return await this.captureScreenshot(page)
  }
}
