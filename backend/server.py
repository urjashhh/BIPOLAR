from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="/app/frontend_web/static"), name="static")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Helper function to convert ObjectId to string
def str_object_id(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj


# Define Models
class MoodEntryCreate(BaseModel):
    mood: str
    user: str = "default_user"

class MoodEntryUpdate(BaseModel):
    racing_thoughts: Optional[bool] = False
    no_sleep: Optional[bool] = False
    over_interest: Optional[bool] = False
    lack_control: Optional[bool] = False
    anxiety: Optional[bool] = False
    ordering: Optional[bool] = False
    over_planning: Optional[bool] = False
    self_harm: Optional[bool] = False
    angry: Optional[bool] = False
    depressed_anxiety: Optional[bool] = False

class MoodEntry(BaseModel):
    id: str
    mood: str
    date: datetime
    user: str
    racing_thoughts: bool = False
    no_sleep: bool = False
    over_interest: bool = False
    lack_control: bool = False
    anxiety: bool = False
    ordering: bool = False
    over_planning: bool = False
    self_harm: bool = False
    angry: bool = False
    depressed_anxiety: bool = False

class GratitudeEntryCreate(BaseModel):
    title: str
    description: str
    user: str = "default_user"

class GratitudeEntry(BaseModel):
    id: str
    title: str
    description: str
    date: datetime
    user: str

class RoutineTaskCreate(BaseModel):
    taskName: str
    user: str = "default_user"

class RoutineTask(BaseModel):
    id: str
    taskName: str
    points: int = 10
    user: str

class DailyRoutineScoreCreate(BaseModel):
    total_points: int
    user: str = "default_user"

class DailyRoutineScore(BaseModel):
    id: str
    total_points: int
    score_date: datetime
    user: str

class ChatMessageCreate(BaseModel):
    message: str
    user: str = "default_user"

class ChatMessage(BaseModel):
    id: str
    user_message: str
    ai_response: str
    timestamp: datetime
    user: str


# Mood Endpoints
@api_router.post("/moods", response_model=MoodEntry)
async def create_mood_entry(input: MoodEntryCreate):
    mood_dict = {
        "mood": input.mood,
        "date": datetime.utcnow(),
        "user": input.user,
        "racing_thoughts": False,
        "no_sleep": False,
        "over_interest": False,
        "lack_control": False,
        "anxiety": False,
        "ordering": False,
        "over_planning": False,
        "self_harm": False,
        "angry": False,
        "depressed_anxiety": False
    }
    result = await db.mood_entries.insert_one(mood_dict)
    mood_dict["id"] = str(result.inserted_id)
    mood_dict.pop("_id", None)
    return MoodEntry(**mood_dict)

@api_router.put("/moods/{mood_id}")
async def update_mood_symptoms(mood_id: str, symptoms: MoodEntryUpdate):
    try:
        update_data = symptoms.dict(exclude_unset=True)
        result = await db.mood_entries.update_one(
            {"_id": ObjectId(mood_id)},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Mood entry not found")
        return {"status": "success", "message": "Symptoms updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/moods", response_model=List[MoodEntry])
async def get_mood_entries(user: str = "default_user"):
    moods = await db.mood_entries.find({"user": user}).sort("date", -1).to_list(1000)
    for mood in moods:
        mood["id"] = str(mood["_id"])
        mood.pop("_id", None)
    return [MoodEntry(**mood) for mood in moods]


# Gratitude Endpoints
@api_router.post("/gratitude", response_model=GratitudeEntry)
async def create_gratitude_entry(input: GratitudeEntryCreate):
    gratitude_dict = {
        "title": input.title,
        "description": input.description,
        "date": datetime.utcnow(),
        "user": input.user
    }
    result = await db.gratitude_entries.insert_one(gratitude_dict)
    gratitude_dict["id"] = str(result.inserted_id)
    gratitude_dict.pop("_id", None)
    return GratitudeEntry(**gratitude_dict)

@api_router.get("/gratitude", response_model=List[GratitudeEntry])
async def get_gratitude_entries(user: str = "default_user"):
    entries = await db.gratitude_entries.find({"user": user}).sort("date", -1).to_list(1000)
    for entry in entries:
        entry["id"] = str(entry["_id"])
        entry.pop("_id", None)
    return [GratitudeEntry(**entry) for entry in entries]


# Routine Task Endpoints
@api_router.post("/routine/tasks", response_model=RoutineTask)
async def create_routine_task(input: RoutineTaskCreate):
    task_dict = {
        "taskName": input.taskName,
        "points": 10,
        "user": input.user
    }
    result = await db.routine_tasks.insert_one(task_dict)
    task_dict["id"] = str(result.inserted_id)
    task_dict.pop("_id", None)
    return RoutineTask(**task_dict)

@api_router.get("/routine/tasks", response_model=List[RoutineTask])
async def get_routine_tasks(user: str = "default_user"):
    tasks = await db.routine_tasks.find({"user": user}).to_list(1000)
    for task in tasks:
        task["id"] = str(task["_id"])
        task.pop("_id", None)
    return [RoutineTask(**task) for task in tasks]


# Daily Routine Score Endpoints
@api_router.post("/routine/scores", response_model=DailyRoutineScore)
async def create_daily_score(input: DailyRoutineScoreCreate):
    # Get today's date (without time)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Check if there's already a score for today
    existing_score = await db.daily_routine_scores.find_one({
        "user": input.user,
        "score_date": {"$gte": today, "$lte": tomorrow}
    })
    
    if existing_score:
        # Update existing score
        await db.daily_routine_scores.update_one(
            {"_id": existing_score["_id"]},
            {"$set": {
                "total_points": input.total_points,
                "score_date": datetime.utcnow()
            }}
        )
        existing_score["id"] = str(existing_score["_id"])
        existing_score["total_points"] = input.total_points
        existing_score["score_date"] = datetime.utcnow()
        existing_score.pop("_id", None)
        return DailyRoutineScore(**existing_score)
    else:
        # Create new score
        score_dict = {
            "total_points": input.total_points,
            "score_date": datetime.utcnow(),
            "user": input.user
        }
        result = await db.daily_routine_scores.insert_one(score_dict)
        score_dict["id"] = str(result.inserted_id)
        score_dict.pop("_id", None)
        return DailyRoutineScore(**score_dict)

@api_router.get("/routine/scores", response_model=List[DailyRoutineScore])
async def get_daily_scores(user: str = "default_user"):
    scores = await db.daily_routine_scores.find({"user": user}).sort("score_date", -1).to_list(1000)
    for score in scores:
        score["id"] = str(score["_id"])
        score.pop("_id", None)
    return [DailyRoutineScore(**score) for score in scores]


# Chat Endpoints
@api_router.post("/chat", response_model=ChatMessage)
async def send_chat_message(input: ChatMessageCreate):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import uuid
    import re
    
    try:
        user_message_lower = input.message.lower().strip()
        ai_response = None
        
        # Check for personalized response patterns
        
        # Pattern 1: Anxiety detection
        anxiety_keywords = ['anxious', 'anxiety', 'panic', 'worried', 'nervous']
        if any(keyword in user_message_lower for keyword in anxiety_keywords) and not any(level in user_message_lower for level in ['high', 'very', 'extremely']):
            ai_response = """I'm here with you. Let's take this step by step.

How anxious are you feeling right now? Please tell me:
- High
- Very high  
- Extremely high

This will help me guide you to the best coping technique."""
        
        # Pattern 2: Anxiety level responses
        elif 'extremely high' in user_message_lower or 'extremely anxious' in user_message_lower:
            ai_response = """Your anxiety is at a critical level. Please take your SOS medicine right now if you have it prescribed.

After taking your medication:
1. Sit or lie down in a safe, comfortable place
2. Focus on your breathing
3. Remember that this feeling will pass

If you don't have SOS medication or symptoms persist, please contact your doctor or crisis helpline immediately. You deserve immediate support. 💜"""
        
        elif 'very high' in user_message_lower or 'very anxious' in user_message_lower:
            ai_response = """Your anxiety is very intense right now. Let's use a physical reset technique:

**Splash cold water on your face:**
1. Go to the nearest sink
2. Splash cold water on your face 3-5 times
3. Dry your face gently
4. Take 5 deep breaths

The cold water activates your body's dive reflex and can quickly reduce anxiety. You've got this! 💙"""
        
        elif ('high' in user_message_lower and 'anxious' in user_message_lower) or ('high anxiety' in user_message_lower):
            ai_response = """Let's do the 54321 grounding technique together. This will help bring you back to the present moment.

**Look around and notice:**
- **5 things** you can see
- **4 things** you can touch
- **3 things** you can hear
- **2 things** you can smell
- **1 thing** you can taste

Take your time with each sense. You're safe, and this will pass. 🌿"""
        
        # Pattern 3: Fear of men
        elif re.search(r'(scared|afraid|fear).*(men|man)', user_message_lower) or re.search(r'(men|man).*(scared|afraid|fear)', user_message_lower):
            ai_response = """I acknowledge that some terrible, horrifying, scary things have happened in the past, but **you are safe right now**. 

No matter how many men are around you, no one can harm you because:
- You can fight
- You can protect yourself  
- There are so many people to protect you around

Your strength is real. Your safety is real. You are not alone. 💪💜"""
        
        # Pattern 4: Flashbacks
        elif 'flashback' in user_message_lower or 'having flashbacks' in user_message_lower or 'getting flashbacks' in user_message_lower:
            ai_response = """I acknowledge that some terrible, horrifying, scary things have happened in the past, but **nothing is happening to you right now**.

There are very few chances of such things happening in the future. It was very painful, but it is gone now. The pain is gone.

**You are here. You are safe. You are in the present moment.** 

Ground yourself: Touch something near you, feel its texture. You are here, and you are safe. 🌸"""
        
        # Pattern 5: Extreme depression
        elif re.search(r'(extremely|very|really).*(depressed|depression)', user_message_lower) or 'extreme depression' in user_message_lower or 'feeling extremely depressed' in user_message_lower:
            ai_response = """I hear you, and I want to help you feel even a little bit better right now.

**Please try this:** Go for a 10-minute run or cycle ride, then come back.

Movement can help shift your mood physically. Even if it feels impossible, just 10 minutes can make a difference. You don't have to go fast—just move your body.

I'll be here when you return. You can do this. 🏃‍♀️💙"""
        
        # If no personalized pattern matched, use AI
        if ai_response is None:
            # Initialize chat with mental health context
            chat = LlmChat(
                api_key=os.environ['EMERGENT_LLM_KEY'],
                session_id=f"chat_{input.user}",
                system_message="""You are a compassionate AI assistant for a bipolar disorder mental health tracking app. 
Your role is to:
- Provide empathetic, supportive responses
- Help users reflect on their moods and feelings
- Encourage healthy coping strategies
- NEVER provide medical advice or diagnosis
- Always recommend professional help for serious concerns
- Be warm, understanding, and non-judgmental

Keep responses concise (2-3 sentences) and conversational."""
            ).with_model("openai", "gpt-5.2")
            
            # Send user message
            user_message = UserMessage(text=input.message)
            ai_response = await chat.send_message(user_message)
        
        # Save to database
        chat_dict = {
            "user_message": input.message,
            "ai_response": ai_response,
            "timestamp": datetime.utcnow(),
            "user": input.user
        }
        result = await db.chat_messages.insert_one(chat_dict)
        chat_dict["id"] = str(result.inserted_id)
        chat_dict.pop("_id", None)
        
        return ChatMessage(**chat_dict)
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")

@api_router.get("/chat", response_model=List[ChatMessage])
async def get_chat_history(user: str = "default_user", limit: int = 50):
    messages = await db.chat_messages.find({"user": user}).sort("timestamp", -1).limit(limit).to_list(limit)
    for msg in messages:
        msg["id"] = str(msg["_id"])
        msg.pop("_id", None)
    return [ChatMessage(**msg) for msg in reversed(messages)]


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# HTML routes
@app.get("/")
async def root():
    return FileResponse("/app/frontend_web/index.html")

@app.get("/chat.html")
async def chat_page():
    return FileResponse("/app/frontend_web/chat.html")

@app.get("/moods.html")
async def moods_page():
    return FileResponse("/app/frontend_web/moods.html")

@app.get("/gratitude.html")
async def gratitude_page():
    return FileResponse("/app/frontend_web/gratitude.html")

@app.get("/routine.html")
async def routine_page():
    return FileResponse("/app/frontend_web/routine.html")
