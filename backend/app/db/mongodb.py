from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.core.config import settings
from backend.app.logs.logger import get_logger

logger = get_logger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_config = MongoDB()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db_config.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_config.db = db_config.client[settings.DATABASE_NAME]
    logger.info("Connected to MongoDB")

async def close_mongo_connection():
    if db_config.client:
        logger.info("Closing MongoDB connection...")
        db_config.client.close()
        logger.info("MongoDB connection closed")

def get_db():
    return db_config.db

