from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.schemas.user_schema import (
    UserCreate,
    UserLogin,
    ProfileUpdate,
    ChangePassword,
)

from backend.app.models.user_model import UserModel

from backend.app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)


class AuthController:

    # ======================================================
    # REGISTER
    # ======================================================

    @staticmethod
    async def register(
        user: UserCreate,
        db: AsyncIOMotorDatabase
    ):
        existing_user = await db["users"].find_one(
            {"email": user.email}
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        hashed_password = get_password_hash(
            user.password
        )

        new_user = UserModel(
            name=user.name,
            email=user.email,
            hashed_password=hashed_password
        )

        result = await db["users"].insert_one(
            new_user.model_dump()
        )

        return {
            "id": str(result.inserted_id),
            "name": user.name,
            "email": user.email
        }

    # ======================================================
    # LOGIN
    # ======================================================

    @staticmethod
    async def login(
        user: UserLogin,
        db: AsyncIOMotorDatabase
    ):
        db_user = await db["users"].find_one(
            {"email": user.email}
        )

        if not db_user or not verify_password(
            user.password,
            db_user["hashed_password"]
        ):
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

    # ======================================================
    # UPDATE PROFILE
    # ======================================================

    @staticmethod
    async def update_profile(
        profile: ProfileUpdate,
        current_user: dict,
        db: AsyncIOMotorDatabase
    ):
        name = profile.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Name cannot be empty"
            )

        result = await db["users"].update_one(
            {
                "email": current_user["email"]
            },
            {
                "$set": {
                    "name": name
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        updated_user = await db["users"].find_one(
            {
                "email": current_user["email"]
            }
        )

        return {
            "id": str(updated_user["_id"]),
            "name": updated_user["name"],
            "email": updated_user["email"]
        }

    # ======================================================
    # CHANGE PASSWORD
    # ======================================================

    @staticmethod
    async def change_password(
        password_data: ChangePassword,
        current_user: dict,
        db: AsyncIOMotorDatabase
    ):
        db_user = await db["users"].find_one(
            {
                "email": current_user["email"]
            }
        )

        if not db_user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Verify current password
        if not verify_password(
            password_data.current_password,
            db_user["hashed_password"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect"
            )

        # Prevent using the same password
        if verify_password(
            password_data.new_password,
            db_user["hashed_password"]
        ):
            raise HTTPException(
                status_code=400,
                detail="New password must be different from current password"
            )

        if len(password_data.new_password) < 6:
            raise HTTPException(
                status_code=400,
                detail="New password must contain at least 6 characters"
            )

        new_hashed_password = get_password_hash(
            password_data.new_password
        )

        result = await db["users"].update_one(
            {
                "email": current_user["email"]
            },
            {
                "$set": {
                    "hashed_password": new_hashed_password
                }
            }
        )

        if result.modified_count == 0:
            raise HTTPException(
                status_code=400,
                detail="Password was not changed"
            )

        return {
            "message": "Password changed successfully"
        }