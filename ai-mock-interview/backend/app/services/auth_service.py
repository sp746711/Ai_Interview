"""
Authentication service
"""
from app.models.user_model import UserModel
from app.schemas.user_schema import UserRegister, UserLogin, TokenResponse, UserResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.db.mongodb import get_database

async def register_user(user_data: UserRegister) -> TokenResponse:
    """Register a new user"""
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise ValueError("User already exists")
    
    # Create new user
    user = UserModel(
        email=user_data.email,
        username=user_data.username,
        password_hash=hash_password(user_data.password)
    )
    
    result = await db.users.insert_one(user.dict(exclude={"_id"}))
    user._id = str(result.inserted_id)
    
    # Generate token
    access_token = create_access_token({"sub": str(user._id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            _id=str(user._id),
            email=user.email,
            username=user.username,
            role=user.role.value,
            created_at=user.created_at
        )
    )

async def login_user(user_data: UserLogin) -> TokenResponse:
    """Login user"""
    db = get_database()
    
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise ValueError("Invalid credentials")
    
    # Generate token
    access_token = create_access_token({"sub": str(user["_id"])})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            _id=str(user["_id"]),
            email=user["email"],
            username=user["username"],
            role=user.get("role", "candidate"),
            created_at=user.get("created_at")
        )
    )

async def refresh_token(token: str):
    """Refresh access token"""
    # TODO: Implement token refresh logic
    pass
