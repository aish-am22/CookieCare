import { pool } from "../config/database.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CookieDefinition {
  id: string;
  category: string;
  cookie: string;
  domain: string;
  description: string;
  retentionPeriod: string;
  dataController: string;
  privacyLink: string;
  wildcardMatch: string;
}

interface CookieDatabase {
  [provider: string]: CookieDefinition[];
}

export class ScannerService {
  private cookieDb: CookieDatabase | null = null;

  private async loadCookieDb() {
    if (this.cookieDb) return this.cookieDb;
    try {
      const dbPath = path.resolve(__dirname, "../config/open-cookie-database.json");
      const data = await fs.readFile(dbPath, "utf-8");
      this.cookieDb = JSON.parse(data);
      return this.cookieDb;
    } catch (err) {
      console.error("Failed to load cookie database:", err);
      return {};
    }
  }

  async scanCookie(url: string, userId: string, scanDepth: string = "Deep") {
    const db = await this.loadCookieDb();
    const allDefinitions: (CookieDefinition & { provider: string })[] = [];

    for (const [provider, cookies] of Object.entries(db)) {
      cookies.forEach(c => allDefinitions.push({ ...c, provider }));
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const detectedCookies: any[] = [];
    const matchedCookies = new Set<string>();

    page.on('response', async response => {
      try {
        const setCookie = await response.headerValue('set-cookie');
        if (setCookie) {
          const parts = setCookie.split(';');
          const nameValue = parts[0].split('=');
          if (nameValue[0]) matchedCookies.add(nameValue[0].trim());
        }
      } catch (e) {
        // Response might be closed
      }
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

      const browserCookies = await context.cookies();
      browserCookies.forEach(c => matchedCookies.add(c.name));

      // DOM-based Heuristics for Banner Detection
      const bannerDetection = await page.evaluate(() => {
        const selectors = [
          '[id*="cookie"]', '[class*="cookie"]', '[id*="consent"]', '[class*="consent"]',
          '[id*="banner"]', '[class*="banner"]', '[id*="notice"]', '[class*="notice"]',
          '.trustarc-banner', '#onetrust-banner-sdk', '.cc-banner', '.qc-cmp-ui-container'
        ];

        const keywords = ['cookie', 'consent', 'accept all', 'privacy policy', 'manage choices', 'strictly necessary'];

        let found = false;
        let visible = false;

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            found = true;
            // Check if any of these elements are visible
            for (const el of Array.from(elements)) {
              const style = window.getComputedStyle(el);
              if (style.display !== 'none' && style.visibility !== 'hidden' && el.getBoundingClientRect().height > 0) {
                visible = true;
                break;
              }
            }
          }
          if (visible) break;
        }

        if (!found) {
          const bodyText = document.body.innerText.toLowerCase();
          found = keywords.some(k => bodyText.includes(k));
        }

        return { found, visible };
      });

      const pageContent = await page.content();
      const lowerContent = pageContent.toLowerCase();

      for (const def of allDefinitions) {
        if (matchedCookies.has(def.cookie) || (def.cookie && lowerContent.includes(def.cookie.toLowerCase())) || (def.domain && lowerContent.includes(def.domain.toLowerCase()))) {
          detectedCookies.push({
            name: def.cookie || def.domain,
            provider: def.provider,
            category: def.category,
            description: def.description,
            privacyLink: def.privacyLink,
            matchedBy: matchedCookies.has(def.cookie) ? "network_intercept" : "content_match"
          });
        }
      }

      const highRiskCount = detectedCookies.filter(c => c.category === "Marketing" || c.category === "Analytics").length;
      const score = Math.max(0, 100 - (highRiskCount * 15) - (detectedCookies.length * 2));
      const risk = score > 75 ? "Low" : score > 45 ? "Medium" : "High";

      const result = {
        scanSummary: {
          url,
          level: scanDepth,
          overallScore: score,
          riskLevel: risk,
          hasConsentBanner: bannerDetection.found,
          isBannerVisible: bannerDetection.visible,
          loadsBeforeConsent: highRiskCount > 0,
          totalCookiesCount: detectedCookies.length,
          scannedAt: new Date().toISOString()
        },
        cookiesDetected: detectedCookies.map(c => ({
          name: c.name,
          category: c.category,
          domain: c.provider,
          retention: "1 year",
          severity: (c.category === "Marketing" || c.category === "Analytics") ? "HIGH" : "LOW",
          description: c.description
        })),
        complianceGaps: [
          {
            regulation: "GDPR",
            severity: highRiskCount > 0 ? "RED" : "GREEN",
            issue: highRiskCount > 0 ? "Potential marketing trackers detected." : "No critical GDPR gaps detected.",
            remediation: highRiskCount > 0 ? "Implement strict prior consent." : "Maintain current compliance."
          },
          (!bannerDetection.found ? {
            regulation: "ePrivacy",
            severity: "RED",
            issue: "No cookie consent banner detected via DOM heuristics.",
            remediation: "Implement a visible consent management platform (CMP)."
          } : null)
        ].filter(Boolean)
      };

      await this.saveScanResult(userId, url, "cookie", score, risk, result);
      return result;

    } catch (err) {
      console.error("Cookie scan failed:", err);
      throw err;
    } finally {
      await browser.close();
    }
  }

  async scanVulnerability(url: string, userId: string) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    const vulnerabilities = [];

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      const headers = response?.headers() || {};

      if (!headers['content-security-policy']) {
        vulnerabilities.push({ name: "Missing CSP", severity: "High", description: "No Content Security Policy detected." });
      }
      if (!headers['strict-transport-security']) {
        vulnerabilities.push({ name: "Missing HSTS", severity: "Medium", description: "HTTP Strict Transport Security header is missing." });
      }
      if (!headers['x-content-type-options'] || headers['x-content-type-options'].toLowerCase() !== 'nosniff') {
        vulnerabilities.push({ name: "Missing X-Content-Type-Options", severity: "Low", description: "X-Content-Type-Options: nosniff is missing." });
      }

      const scripts = await page.evaluate(() => {
        return Array.from(document.scripts).map(s => s.src);
      });

      for (const src of scripts) {
        if (src.includes("jquery/1.") || src.includes("jquery/2.")) {
          vulnerabilities.push({ name: "Outdated jQuery", severity: "Medium", description: `Potentially vulnerable jQuery version detected: ${src}` });
        }
        if (src.includes("bootstrap/3.")) {
          vulnerabilities.push({ name: "Outdated Bootstrap", severity: "Medium", description: `Outdated Bootstrap 3 detected: ${src}` });
        }
      }

      const score = Math.max(0, 100 - (vulnerabilities.length * 20));
      const risk = score > 80 ? "Low" : score > 50 ? "Medium" : "High";

      const result = {
        url,
        overallScore: score,
        riskLevel: risk,
        vulnerabilities: vulnerabilities.length > 0 ? vulnerabilities : [{ name: "No critical vulnerabilities", severity: "Low", description: "Initial scan found no major issues." }]
      };

      await this.saveScanResult(userId, url, "vulnerability", score, risk, result);
      return result;

    } catch (err) {
      console.error("Vulnerability scan failed:", err);
      throw err;
    } finally {
      await browser.close();
    }
  }

  private async saveScanResult(userId: string, url: string, type: string, score: number, risk: string, payload: any) {
    let client;
    try {
      client = await pool.connect();
      await client.query(
        "INSERT INTO website_scans (user_id, url, scan_type, overall_score, risk_level, payload) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, url, type, score, risk, JSON.stringify(payload)]
      );
    } finally {
      if (client) client.release();
    }
  }
}
