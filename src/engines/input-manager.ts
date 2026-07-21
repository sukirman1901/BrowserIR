import type { Page, Locator } from 'playwright'

export class InputManager {
  private page: Page
  
  constructor(page: Page) {
    this.page = page
  }
  
  async mouseMove(x: number, y: number): Promise<void> {
    await this.page.mouse.move(x, y)
  }
  
  async mouseClick(x: number, y: number, button: 'left' | 'right' | 'middle' = 'left'): Promise<void> {
    await this.page.mouse.click(x, y, { button })
  }
  
  async mouseDown(button: 'left' | 'right' | 'middle' = 'left'): Promise<void> {
    await this.page.mouse.down({ button })
  }
  
  async mouseUp(button: 'left' | 'right' | 'middle' = 'left'): Promise<void> {
    await this.page.mouse.up({ button })
  }
  
  async mouseWheel(deltaX: number, deltaY: number): Promise<void> {
    await this.page.mouse.wheel(deltaX, deltaY)
  }
  
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key)
  }
  
  async typeText(text: string): Promise<void> {
    await this.page.keyboard.type(text)
  }
  
  async keyDown(key: string): Promise<void> {
    await this.page.keyboard.down(key)
  }
  
  async keyUp(key: string): Promise<void> {
    await this.page.keyboard.up(key)
  }
  
  async handleDialog(action: 'accept' | 'dismiss', text?: string): Promise<void> {
    this.page.on('dialog', async dialog => {
      if (action === 'accept') await dialog.accept(text)
      else await dialog.dismiss()
    })
  }
  
  async switchToFrame(selector: string): Promise<Locator> {
    return this.page.frameLocator(selector).owner()
  }
  
  async switchToMainFrame(): Promise<void> {
    // Playwright auto-resets to main frame
  }
}
