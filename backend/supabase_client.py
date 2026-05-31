import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import date, datetime, timedelta

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
        # Check if user exists
        result = supabase.table("user_credits")\
            .select("user_id")\
            .eq("user_id", user_id)\
            .execute()
        
        if not result.data:
            # Create new user record
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
        # Ensure user exists
        ensure_user_exists(user_id)
        
        # Get user record
        result = supabase.table("user_credits")\
            .select("daily_credits_used, last_reset_date")\
            .eq("user_id", user_id)\
            .execute()
        
        if result.data:
            record = result.data[0]
            last_reset = datetime.strptime(record["last_reset_date"], "%Y-%m-%d").date()
            
            # Reset if last reset was not today
            if last_reset < date.today():
                credits_used = 0
            else:
                credits_used = record["daily_credits_used"]
            
            remaining = max(0, DAILY_CREDIT_LIMIT - credits_used)
            print(f"User {user_id}: credits_used={credits_used}, remaining={remaining}")
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
        
        # Get current record
        result = supabase.table("user_credits")\
            .select("daily_credits_used, last_reset_date")\
            .eq("user_id", user_id)\
            .execute()
        
        if not result.data:
            return False
        
        record = result.data[0]
        last_reset = datetime.strptime(record["last_reset_date"], "%Y-%m-%d").date()
        
        # Reset if needed
        if last_reset < date.today():
            credits_used = 0
        else:
            credits_used = record["daily_credits_used"]
        
        # Check if user has credits left
        if credits_used >= DAILY_CREDIT_LIMIT:
            print(f"User {user_id} has no credits left (used {credits_used}/{DAILY_CREDIT_LIMIT})")
            return False
        
        # Update credits used
        supabase.table("user_credits")\
            .update({
                "daily_credits_used": credits_used + 1,
                "last_reset_date": date.today().isoformat(),
                "updated_at": datetime.now().isoformat()
            })\
            .eq("user_id", user_id)\
            .execute()
        
        print(f"User {user_id} used a credit. Now at {credits_used + 1}/{DAILY_CREDIT_LIMIT}")
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
            
            # Reset if needed
            if last_reset < date.today():
                credits_used = 0
            else:
                credits_used = record["daily_credits_used"]
            
            # Calculate when credits reset (next midnight)
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