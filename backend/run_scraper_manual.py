import asyncio
import logging
from app.scraper.scheduler import run_scrape_cycle

# Setup basic logging to see the output in the console
logging.basicConfig(level=logging.INFO)

async def main():
    print("Starting manual scrape cycle...")
    await run_scrape_cycle()
    print("Manual scrape cycle finished.")

if __name__ == "__main__":
    asyncio.run(main())
