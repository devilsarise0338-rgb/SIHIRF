import asyncio
from playwright.async_api import async_playwright
import pandas as pd
import json

async def scrape():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Navigating to https://sih.gov.in/sih2026PS...")
        
        try:
            # Let's use wait_until="networkidle" to make sure dynamic content loads
            response = await page.goto("https://sih.gov.in/sih2026PS", wait_until="networkidle", timeout=30000)
            if not response or response.status >= 400:
                print(f"Failed to load page. Status: {response.status if response else 'Unknown'}")
                await browser.close()
                return
            
            # Since the structure is unknown but usually a table with tr/td
            # We will extract all rows from tables.
            # Typical SIH portal has a datatable or similar.
            # We can run JS to grab text from the table.
            data = await page.evaluate('''() => {
                const rows = Array.from(document.querySelectorAll('table tbody tr'));
                return rows.map(tr => {
                    const cells = Array.from(tr.querySelectorAll('td'));
                    return cells.map(td => td.innerText.trim());
                });
            }''')
            
            if not data:
                # sometimes they use divs or cards
                print("No table data found, trying to find cards or datatable...")
                # Try getting all text to see what we have
                text_content = await page.evaluate("() => document.body.innerText.substring(0, 500)")
                print("Page content snippet:", text_content)
                await browser.close()
                return

            # Let's save the raw data for inspection
            with open('raw_scraped_data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f)
            print(f"Scraped {len(data)} raw rows.")

        except Exception as e:
            print(f"Error scraping: {e}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape())
