from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.schemas.user_schema import UserCreate, UserLogin
from backend.app.models.user_model import UserModel
from backend.app.core.security import get_password_hash, verify_password, create_access_token

class AuthController:
    @staticmethod
    async def register(user: UserCreate, db: AsyncIOMotorDatabase):
        existing_user = await db["users"].find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = get_password_hash(user.password)
        new_user = UserModel(name=user.name, email=user.email, hashed_password=hashed_password)
        
        result = await db["users"].insert_one(new_user.model_dump())
        return {"id": str(result.inserted_id), "name": user.name, "email": user.email}

    @staticmethod
    async def login(user: UserLogin, db: AsyncIOMotorDatabase):
        db_user = await db["users"].find_one({"email": user.email})
        if not db_user or not verify_password(user.password, db_user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"sub": db_user["email"], "user_id": str(db_user["_id"])})
        return {"access_token": access_token, "token_type": "bearer"}

@staticmethod
async def login(user: UserLogin, db: AsyncIOMotorDatabase):
    db_user = await db["users"].find_one({"email": user.email})

    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={
            "sub": db_user["email"],
            "user_id": str(db_user["_id"])
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "name": db_user["name"],
        "email": db_user["email"]
    }