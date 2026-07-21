import type { Page } from 'playwright'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

export interface VisualDiffOptions {
  threshold?: number
  includeAA?: boolean
  alpha?: number
  diffColor?: [number, number, number]
}

export interface VisualDiffResult {
  screenshot1: string
  screenshot2: string
  diff?: string
  similarity: number
  pixelDiff: number
  totalPixels: number
  diffPercentage: number
}

export class VisualDiffEngine {
  async captureScreenshot(page: Page, options?: { fullPage?: boolean }): Promise<Buffer> {
    return page.screenshot({ 
      type: 'png', 
      fullPage: options?.fullPage ?? true 
    })
  }
  
  async compareScreenshots(
    before: Buffer, 
    after: Buffer, 
    options: VisualDiffOptions = {}
  ): Promise<VisualDiffResult> {
    const img1 = PNG.sync.read(before)
    const img2 = PNG.sync.read(after)
    
    if (img1.width !== img2.width || img1.height !== img2.height) {
      throw new Error(`Image dimensions mismatch: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`)
    }
    
    const { width, height } = img1
    const diff = new PNG({ width, height })
    
    const pixelDiff = pixelmatch(
      img1.data, 
      img2.data, 
      diff.data, 
      width, 
      height, 
      {
        threshold: options.threshold ?? 0.1,
        includeAA: options.includeAA ?? false,
        alpha: options.alpha ?? 0.3,
        diffColor: options.diffColor ?? [255, 0, 0]
      }
    )
    
    const totalPixels = width * height
    const diffPercentage = (pixelDiff / totalPixels) * 100
    const similarity = 1 - (pixelDiff / totalPixels)
    
    const diffBuffer = PNG.sync.write(diff)
    
    return {
      screenshot1: before.toString('base64'),
      screenshot2: after.toString('base64'),
      diff: diffBuffer.toString('base64'),
      similarity,
      pixelDiff,
      totalPixels,
      diffPercentage
    }
  }
  
  async diffPage(
    page: Page, 
    url1: string, 
    url2: string, 
    options?: VisualDiffOptions
  ): Promise<VisualDiffResult> {
    await page.goto(url1, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    const screenshot1 = await this.captureScreenshot(page)
    
    await page.goto(url2, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    const screenshot2 = await this.captureScreenshot(page)
    
    return this.compareScreenshots(screenshot1, screenshot2, options)
  }
  
  async diffCurrentPage(
    page: Page,
    baseline: Buffer,
    options?: VisualDiffOptions
  ): Promise<VisualDiffResult> {
    const current = await this.captureScreenshot(page)
    return this.compareScreenshots(baseline, current, options)
  }
  
  async highlightChanges(page: Page, diffBase64: string): Promise<string> {
    const diffBuffer = Buffer.from(diffBase64, 'base64')
    
    await page.evaluate((diffSrc) => {
      const img = document.createElement('img')
      img.src = `data:image/png;base64,${diffSrc}`
      img.style.cssText = 'position:fixed;top:0;left:0;z-index:999999;pointer-events:none;opacity:0.5'
      document.body.appendChild(img)
    }, diffBuffer.toString('base64'))
    
    return (await this.captureScreenshot(page)).toString('base64')
  }
}