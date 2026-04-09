"""
MongoDB connection setup
"""
from motor.motor_asyncio import AsyncClient, AsyncDatabase
from app.core.config import settings

client: AsyncClient = None
db: AsyncDatabase = None

async def connect_db():
    """Connect to MongoDB"""
    global client, db
    client = AsyncClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    # Verify connection
    await db.command("ping")
    print("Connected to MongoDB")

async def close_db():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")

def get_database() -> AsyncDatabase:
    """Get database instance"""
    return db
