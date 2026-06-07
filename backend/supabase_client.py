import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Credit constants
DAILY_CREDIT_LIMIT = 3
CREDIT_COST_PER_PODCAST = 1

def ensure_user_exists(user_id: str):
    """Ensure user exists in credits table"""
    try:
        result = supabase.table("user_credits")\
            .select("user_id")\
            .eq("user_id", user_id)\
            .execute()
        
        if not result.data:
            supabase.table("user_credits").insert({
                "user_id": user_id,
                "daily_credits_used": 0,
                "last_reset_date": date.today().isoformat()
            }).execute()
            print(f"Created new user record for {user_id}")
            return True
        return True
    except Exception as e:
        print(f"Error ensuring user exists: {e}")
        return False

def get_user_credits(user_id: str) -> int:
    """Get remaining credits for a user for today"""
    try:
        ensure_user_exists(user_id)
        
        result = supabase.table("user_credits")\
            .select("daily_credits_used, last_reset_date")\
            .eq("user_id", user_id)\
            .execute()
        
        if result.data:
            record = result.data[0]
            last_reset = datetime.strptime(record["last_reset_date"], "%Y-%m-%d").date()
            
            if last_reset < date.today():
                credits_used = 0
            else:
                credits_used = record["daily_credits_used"]
            
            remaining = max(0, DAILY_CREDIT_LIMIT - credits_used)
            return remaining
        else:
            return DAILY_CREDIT_LIMIT
    except Exception as e:
        print(f"Error getting user credits: {e}")
        return DAILY_CREDIT_LIMIT

def use_credit(user_id: str) -> bool:
    """Use one daily credit for podcast generation"""
    try:
        ensure_user_exists(user_id)
        
        result = supabase.table("user_credits")\
            .select("daily_credits_used, last_reset_date")\
            .eq("user_id", user_id)\
            .execute()
        
        if not result.data:
            return False
        
        record = result.data[0]
        last_reset = datetime.strptime(record["last_reset_date"], "%Y-%m-%d").date()
        
        if last_reset < date.today():
            credits_used = 0
        else:
            credits_used = record["daily_credits_used"]
        
        if credits_used >= DAILY_CREDIT_LIMIT:
            return False
        
        supabase.table("user_credits")\
            .update({
                "daily_credits_used": credits_used + 1,
                "last_reset_date": date.today().isoformat(),
                "updated_at": datetime.now().isoformat()
            })\
            .eq("user_id", user_id)\
            .execute()
        
        return True
    except Exception as e:
        print(f"Error using credit: {e}")
        return False

def get_user_credit_info(user_id: str) -> dict:
    """Get detailed credit information including reset time"""
    try:
        ensure_user_exists(user_id)
        
        result = supabase.table("user_credits")\
            .select("daily_credits_used, last_reset_date")\
            .eq("user_id", user_id)\
            .execute()
        
        if result.data:
            record = result.data[0]
            last_reset = datetime.strptime(record["last_reset_date"], "%Y-%m-%d").date()
            
            if last_reset < date.today():
                credits_used = 0
            else:
                credits_used = record["daily_credits_used"]
            
            now = datetime.now()
            next_reset = datetime(now.year, now.month, now.day) + timedelta(days=1)
            seconds_until_reset = (next_reset - now).total_seconds()
            
            return {
                "credits_remaining": max(0, DAILY_CREDIT_LIMIT - credits_used),
                "credits_used_today": credits_used,
                "daily_limit": DAILY_CREDIT_LIMIT,
                "resets_in_seconds": int(seconds_until_reset),
                "resets_at": next_reset.isoformat(),
                "cost_per_generation": CREDIT_COST_PER_PODCAST
            }
        else:
            return {
                "credits_remaining": DAILY_CREDIT_LIMIT,
                "credits_used_today": 0,
                "daily_limit": DAILY_CREDIT_LIMIT,
                "resets_in_seconds": 86400,
                "resets_at": None,
                "cost_per_generation": CREDIT_COST_PER_PODCAST
            }
    except Exception as e:
        print(f"Error getting credit info: {e}")
        return {
            "credits_remaining": DAILY_CREDIT_LIMIT,
            "credits_used_today": 0,
            "daily_limit": DAILY_CREDIT_LIMIT,
            "resets_in_seconds": 86400,
            "resets_at": None,
            "cost_per_generation": CREDIT_COST_PER_PODCAST
        }

def refund_credit(user_id: str) -> bool:
    """Refund one daily credit back to the user in case of worker failure"""
    try:
        ensure_user_exists(user_id)
        
        result = supabase.table("user_credits")\
            .select("daily_credits_used")\
            .eq("user_id", user_id)\
            .execute()
        
        if result.data:
            record = result.data[0]
            credits_used = record["daily_credits_used"]
            
            # Prevent dropping below 0 used credits
            new_credits_used = max(0, credits_used - 1)
            
            supabase.table("user_credits")\
                .update({
                    "daily_credits_used": new_credits_used,
                    "updated_at": datetime.now().isoformat()
                })\
                .eq("user_id", user_id)\
                .execute()
            print(f"Successfully refunded credit to user: {user_id}")
            return True
        return False
    except Exception as e:
        print(f"Critical error processing database credit refund: {e}")
        return False

def upload_podcast_file(job_id: str, audio_bytes: bytes) -> str:
    """Uploads audio binary directly to Supabase Storage"""
    try:
        file_path = f"{job_id}.mp3"
        
        # Upload binary array to your storage bucket
        supabase.storage.from_("podcast-bucket").upload(
            path=file_path,
            file=audio_bytes,
            file_options={"content-type": "audio/mpeg", "x-upsert": "true"}
        )
        
        # Get the permanent public viewing URL
        public_url = supabase.storage.from_("podcast-bucket").get_public_url(file_path)
        return public_url
    except Exception as e:
        print(f"Failed uploading file asset to Supabase Storage: {e}")
        return ""

# Podcast storage functions
def save_podcast(user_id: str, job_id: str, topic: str, language: str, script: str, audio_url: str, timestamps: str) -> bool:
    """Save generated podcast to user's storage"""
    try:
        supabase.table("podcasts").insert({
            "user_id": user_id,
            "job_id": job_id,
            "topic": topic,
            "language": language,
            "script": script,
            "audio_url": audio_url,
            "timestamps": timestamps
        }).execute()
        return True
    except Exception as e:
        print(f"Error saving podcast: {e}")
        return False

def get_user_podcasts(user_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """Get all podcasts for a specific user"""
    try:
        result = supabase.table("podcasts")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("is_deleted", False)\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        return result.data if result.data else []
    except Exception as e:
        print(f"Error getting user podcasts: {e}")
        return []

def get_podcast_by_job_id(job_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific podcast by job_id"""
    try:
        result = supabase.table("podcasts")\
            .select("*")\
            .eq("job_id", job_id)\
            .eq("user_id", user_id)\
            .eq("is_deleted", False)\
            .execute()
        
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error getting podcast: {e}")
        return None

def delete_podcast(job_id: str, user_id: str) -> bool:
    """Soft delete a podcast"""
    try:
        supabase.table("podcasts")\
            .update({"is_deleted": True, "updated_at": datetime.now().isoformat()})\
            .eq("job_id", job_id)\
            .eq("user_id", user_id)\
            .execute()
        return True
    except Exception as e:
        print(f"Error deleting podcast: {e}")
        return False