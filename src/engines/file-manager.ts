import type { Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

export class FileManager {
  private page: Page
  private downloadPath: string
  
  constructor(page: Page, downloadPath: string = './downloads') {
    this.page = page
    this.downloadPath = downloadPath
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true })
    }
  }
  
  async downloadFile(selector: string): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click(selector)
    ])
    const filePath = path.join(this.downloadPath, download.suggestedFilename())
    await download.saveAs(filePath)
    return filePath
  }
  
  async uploadFile(selector: string, filePaths: string[]): Promise<void> {
    const input = await this.page.$(selector)
    if (!input) throw new Error(`Element not found: ${selector}`)
    await input.setInputFiles(filePaths)
  }
  
  async saveAsPDF(filePath: string): Promise<void> {
    await this.page.pdf({ path: filePath, format: 'A4' })
  }
}
