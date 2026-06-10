import { chromium, Browser, BrowserContext, Page } from "playwright";

class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private launchPromise: Promise<Browser> | null = null;

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  public async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.launchPromise) {
      return this.launchPromise;
    }

    this.launchPromise = chromium.launch({
      headless: true,
      channel: 'chrome', 
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    }).then(browser => {
      this.browser = browser;
      this.launchPromise = null;

      this.browser.on("disconnected", () => {
        console.warn("[BrowserManager] Browser disconnected.");
        this.browser = null;
      });

      return browser;
    });

    return this.launchPromise;
  }

  public async newContext(options?: any): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    const context = await browser.newContext(options);

    if (options?.optimizeForScanning) {
      await context.route("**/*", (route) => {
        const resourceType = route.request().resourceType();
        if (["image", "font", "media", "stylesheet"].includes(resourceType)) {
          if (resourceType === "stylesheet") {
            return route.continue();
          }
          return route.abort();
        }
        return route.continue();
      });
    }

    return context;
  }

  public async newPage(options?: any): Promise<Page> {
    const context = await this.newContext(options);
    return await context.newPage();
  }

  public async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const browserManager = BrowserManager.getInstance();