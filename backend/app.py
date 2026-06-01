import os
import uuid
import json
import asyncio
import time
from supabase import create_client
from datetime import date, datetime
from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, Header
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from podcast_workflow import generate_podcast_script, set_progress_callback
from tts_utils import generate_audio_from_script
from supabase_client import (save_podcast, get_user_podcasts, get_podcast_by_job_id, delete_podcast, use_credit, 
                            get_user_credit_info, get_user_credits)

# Initialize Supabase client for auth verification
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

app = FastAPI(title="Podcast Generator API", description="Generate AI-powered podcasts with real-time progress streaming")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary storage
AUDIO_DIR = "generated_audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# Store generated results temporarily
generated_results: Dict[str, Dict[str, Any]] = {}

INITIAL_CREDITS = 3
CREDIT_COST_PER_PODCAST = 1

class PodcastRequest(BaseModel):
    topic: str
    language: str = "en"
    speaker_voices: dict = {"Interviewer": "male", "Expert": "female"}

@app.get("/health")
async def health_check():
    """Health check endpoint for Render and frontend connection testing"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "podcast-generator-api"
    }

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Podcast Generator API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/health",
            "/generate-podcast",
            "/user/credits",
            "/progress/{job_id}",
            "/stream-progress/{job_id}",
            "/download/{job_id}",
            "/script/{job_id}"
        ]
    }

async def verify_auth(authorization: str = Header(None)):
    """Verify user token and return user ID"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Verify token with Supabase
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        return user.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@app.get("/user/credits")
async def get_credits(user_id: str = Depends(verify_auth)):
    """Get remaining credits for authenticated user"""
    credit_info = get_user_credit_info(user_id)
    return {
        "credits_remaining": credit_info["credits_remaining"],
        "credits_used_today": credit_info["credits_used_today"],
        "daily_limit": credit_info["daily_limit"],
        "cost_per_generation": CREDIT_COST_PER_PODCAST,
        "resets_in_seconds": credit_info["resets_in_seconds"],
        "resets_at": credit_info["resets_at"]
    }

def generate_with_progress(job_id: str, topic: str, language: str, speaker_voices: dict, user_id: str):
    """Background task that emits progress events during generation"""
    
    progress_events = []
    
    def emit_progress(event_data):
        progress_events.append(event_data)
        generated_results[job_id]["progress"] = progress_events.copy()
        generated_results[job_id]["status"] = event_data["status"]
    
    set_progress_callback(emit_progress)
    
    try:
        generated_results[job_id]["status"] = "generating_script"
        script = generate_podcast_script(topic, language)
        generated_results[job_id]["script"] = script
        
        emit_progress({
            "step": "tts",
            "status": "started",
            "message": "Converting script to audio...",
            "timestamp": time.time()
        })
        
        audio_bytes = generate_audio_from_script(script, language, speaker_voices)
        
        audio_path = os.path.join(AUDIO_DIR, f"{job_id}.mp3")
        script_path = os.path.join(AUDIO_DIR, f"{job_id}.txt")
        
        with open(audio_path, "wb") as f:
            f.write(audio_bytes)
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(script)
        
        # Generate public URL (adjust for your deployment)
        audio_url = f"/download/{job_id}"
        
        generated_results[job_id]["audio_path"] = audio_path
        generated_results[job_id]["script_path"] = script_path
        generated_results[job_id]["status"] = "completed"
        generated_results[job_id]["download_url"] = audio_url
        
        # Save to database
        save_podcast(user_id, job_id, topic, language, script, audio_url)
        
        emit_progress({
            "step": "complete",
            "status": "completed",
            "message": "Podcast generation complete! Ready for download.",
            "timestamp": time.time(),
            "details": {"download_url": audio_url}
        })
        
    except Exception as e:
        generated_results[job_id]["status"] = "failed"
        generated_results[job_id]["error"] = str(e)
        emit_progress({
            "step": "error",
            "status": "error",
            "message": f"Generation failed: {str(e)}",
            "timestamp": time.time()
        })


@app.post("/generate-podcast")
async def generate_podcast(req: PodcastRequest, background_tasks: BackgroundTasks, user_id: str = Depends(verify_auth)):
    """Start podcast generation with daily credit check"""
    
    available_credits = get_user_credits(user_id)
    
    if available_credits < CREDIT_COST_PER_PODCAST:
        credit_info = get_user_credit_info(user_id)
        raise HTTPException(
            status_code=403, 
            detail=f"Daily limit reached. You've used {credit_info['credits_used_today']} of {credit_info['daily_limit']} free credits today."
        )
    
    job_id = str(uuid.uuid4())
    
    generated_results[job_id] = {
        "status": "starting",
        "progress": [],
        "topic": req.topic,
        "language": req.language,
        "user_id": user_id
    }
    
    credit_used = use_credit(user_id)
    if not credit_used:
        raise HTTPException(status_code=403, detail="Failed to use credit. Daily limit may have been reached.")
    
    remaining = get_user_credits(user_id)
    
    background_tasks.add_task(
        generate_with_progress, 
        job_id, 
        req.topic, 
        req.language, 
        req.speaker_voices,
        user_id  # Pass user_id to save the podcast
    )
    
    return {
        "job_id": job_id,
        "status": "started",
        "credits_remaining": remaining,
        "message": f"Podcast generation started. You have {remaining} free {('credit' if remaining == 1 else 'credits')} remaining today."
    }


@app.get("/progress/{job_id}")
async def get_progress(job_id: str):
    """Get current progress for a job (polling endpoint)"""
    if job_id not in generated_results:
        return {"error": "Job not found"}
    
    result = generated_results[job_id]
    return {
        "job_id": job_id,
        "status": result.get("status", "unknown"),
        "progress": result.get("progress", []),
        "script_preview": result.get("script", "")[:500] if result.get("script") else None,
        "download_url": result.get("download_url"),
        "error": result.get("error")
    }


@app.get("/stream-progress/{job_id}")
async def stream_progress(job_id: str):
    """SSE endpoint for real-time progress streaming"""
    async def event_stream():
        last_event_count = 0
        
        while True:
            if job_id not in generated_results:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Job not found'})}\n\n"
                break
            
            job_data = generated_results[job_id]
            progress_events = job_data.get("progress", [])
            
            # Send new events
            if len(progress_events) > last_event_count:
                for event in progress_events[last_event_count:]:
                    yield f"data: {json.dumps({'type': 'progress', 'data': event})}\n\n"
                last_event_count = len(progress_events)
            
            # Check if job is complete
            if job_data.get("status") == "completed":
                yield f"data: {json.dumps({'type': 'complete', 'download_url': job_data.get('download_url'), 'script': job_data.get('script')})}\n\n"
                break
            elif job_data.get("status") == "failed":
                yield f"data: {json.dumps({'type': 'error', 'message': job_data.get('error')})}\n\n"
                break
            
            await asyncio.sleep(0.5)
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/download/{job_id}")
async def download_audio(job_id: str):
    """Download generated audio file"""
    audio_path = os.path.join(AUDIO_DIR, f"{job_id}.mp3")
    if not os.path.exists(audio_path):
        return {"error": "File not found or expired"}
    return FileResponse(audio_path, media_type="audio/mpeg", filename=f"podcast_{job_id}.mp3")


@app.get("/script/{job_id}")
async def get_script(job_id: str):
    """Get the full generated script"""
    script_path = os.path.join(AUDIO_DIR, f"{job_id}.txt")
    if not os.path.exists(script_path):
        if job_id in generated_results and generated_results[job_id].get("script"):
            return {"script": generated_results[job_id]["script"]}
        return {"error": "Script not found"}
    
    with open(script_path, "r", encoding="utf-8") as f:
        script = f.read()
    return {"script": script}


@app.get("/user/podcasts")
async def get_user_podcasts_endpoint(
    limit: int = 50, 
    offset: int = 0,
    user_id: str = Depends(verify_auth)
):
    """Get all podcasts for the authenticated user"""
    podcasts = get_user_podcasts(user_id, limit, offset)
    
    # Transform for frontend consumption
    formatted_podcasts = []
    for podcast in podcasts:
        formatted_podcasts.append({
            "id": podcast["id"],
            "job_id": podcast["job_id"],
            "topic": podcast["topic"],
            "language": podcast["language"],
            "created_at": podcast["created_at"],
            "audio_url": podcast["audio_url"],
            "script_preview": podcast["script"][:200] + "..." if len(podcast["script"]) > 200 else podcast["script"]
        })
    
    return {
        "podcasts": formatted_podcasts,
        "total": len(formatted_podcasts),
        "limit": limit,
        "offset": offset
    }


@app.get("/user/podcasts/{job_id}")
async def get_user_podcast(job_id: str, user_id: str = Depends(verify_auth)):
    """Get a specific podcast by job_id"""
    podcast = get_podcast_by_job_id(job_id, user_id)
    
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")
    
    return {
        "id": podcast["id"],
        "job_id": podcast["job_id"],
        "topic": podcast["topic"],
        "language": podcast["language"],
        "script": podcast["script"],
        "audio_url": podcast["audio_url"],
        "created_at": podcast["created_at"]
    }


@app.delete("/user/podcasts/{job_id}")
async def delete_user_podcast(job_id: str, user_id: str = Depends(verify_auth)):
    """Delete a podcast (soft delete)"""
    success = delete_podcast(job_id, user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Podcast not found or could not be deleted")
    
    return {"message": "Podcast deleted successfully"}


def cleanup_files(*paths):
    """Utility to clean up generated files after some time"""
    time.sleep(3600)
    for p in paths:
        try:
            if os.path.exists(p):
                os.remove(p)
        except:
            pass