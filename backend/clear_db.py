import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("backend"))
from app.database import async_session
from app.models import Article
from sqlalchemy import delete

async def clear():
    async with async_session() as db:
        await db.execute(delete(Article))
        await db.commit()
    print("Cleared articles")

asyncio.run(clear())
