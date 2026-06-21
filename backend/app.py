import os
import uuid
import json
import asyncio
import time
from supabase import create_client
from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from podcast_workflow import generate_podcast_script, set_progress_callback
from tts_utils import generate_audio_from_script
from supabase_client import (save_podcast, get_user_podcasts, get_podcast_by_job_id, delete_podcast, use_credit, 
                            get_user_credit_info, get_user_credits, upload_podcast_file, refund_credit)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

app = FastAPI(title="Podcast Generator API", description="Generate AI-powered podcasts with real-time cloud streaming")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store generated results temporarily in-memory for active progress logs
generated_results: Dict[str, Dict[str, Any]] = {}
CREDIT_COST_PER_PODCAST = 1

class PodcastRequest(BaseModel):
    topic: str
    language: str = "en"
    speaker_voices: dict = {"Interviewer": "male", "Expert": "female"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time(), "service": "podcast-generator-api"}

@app.get("/")
async def root():
    return {
        "name": "Podcast Generator API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": ["/health", "/generate-podcast", "/user/credits", "/progress/{job_id}", "/stream-progress/{job_id}"]
    }

async def verify_auth(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@app.get("/user/credits")
async def get_credits(user_id: str = Depends(verify_auth)):
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
    progress_events = []
    
    def emit_progress(event_data):
        progress_events.append(event_data)
        if job_id in generated_results:
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
        
        audio_bytes, timestamps = generate_audio_from_script(script, language, speaker_voices)
        
        emit_progress({
            "step": "upload",
            "status": "started",
            "message": "Uploading permanent media files to cloud storage...",
            "timestamp": time.time()
        })
        
        permanent_audio_url = upload_podcast_file(job_id, audio_bytes)
        if not permanent_audio_url:
            raise Exception("Cloud upload pipeline rejected the asset payload container.")
        
        # Inject metadata 
        script = f"{script}\n\n"
        
        generated_results[job_id]["download_url"] = permanent_audio_url
        generated_results[job_id]["script"] = script
        generated_results[job_id]["timestamps"] = timestamps
        
        save_podcast(user_id, job_id, topic, language, script, permanent_audio_url, json.dumps(timestamps))
        
        emit_progress({
            "step": "complete",
            "status": "completed",
            "message": "Podcast generation complete! Permanently saved.",
            "timestamp": time.time(),
            "details": {"download_url": permanent_audio_url}
        })
        
    except Exception as e:
        print(f"Generation error encountered for job {job_id}: {str(e)}")
        if job_id in generated_results:
            generated_results[job_id]["status"] = "failed"
            generated_results[job_id]["error"] = str(e)
        try:
            refund_credit(user_id)
        except Exception as refund_err:
            print(f"Failed to issue credit fallback rollback transaction: {refund_err}")
            
        emit_progress({
            "step": "error",
            "status": "error",
            "message": f"Generation failed: {str(e)}. Credit refunded.",
            "timestamp": time.time()
        })

@app.post("/generate-podcast")
async def generate_podcast(req: PodcastRequest, background_tasks: BackgroundTasks, user_id: str = Depends(verify_auth)):
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
        raise HTTPException(status_code=403, detail="Failed to use credit.")
    
    remaining = get_user_credits(user_id)
    background_tasks.add_task(generate_with_progress, job_id, req.topic, req.language, req.speaker_voices, user_id)
    
    return {
        "job_id": job_id,
        "status": "started",
        "credits_remaining": remaining,
        "message": f"Podcast generation started. You have {remaining} free credits remaining today."
    }

@app.get("/stream-progress/{job_id}")
async def stream_progress(job_id: str):
    async def event_stream():
        last_event_count = 0
        while True:
            if job_id not in generated_results:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Job not found'})}\n\n"
                break
            
            job_data = generated_results[job_id]
            progress_events = job_data.get("progress", [])
            
            if len(progress_events) > last_event_count:
                for event in progress_events[last_event_count:]:
                    yield f"data: {json.dumps({'type': 'progress', 'data': event})}\n\n"
                last_event_count = len(progress_events)
            
            if job_data.get("status") == "completed":
                yield f"data: {json.dumps({'type': 'complete', 'download_url': job_data.get('download_url'), 'script': job_data.get('script'), 'timestamps': job_data.get('timestamps')})}\n\n"
                break
            elif job_data.get("status") == "failed":
                yield f"data: {json.dumps({'type': 'error', 'message': job_data.get('error')})}\n\n"
                break
            
            await asyncio.sleep(0.5)
            
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/user/podcasts")
async def get_user_podcasts_endpoint(limit: int = 50, offset: int = 0, user_id: str = Depends(verify_auth)):
    podcasts = get_user_podcasts(user_id, limit, offset)
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
    return {"podcasts": formatted_podcasts, "total": len(formatted_podcasts), "limit": limit, "offset": offset}

@app.get("/user/podcasts/{job_id}")
async def get_user_podcast(job_id: str, user_id: str = Depends(verify_auth)):
    podcast = get_podcast_by_job_id(job_id, user_id)
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")
    
    raw_ts = podcast.get("timestamps")
    parsed_ts = []
    if isinstance(raw_ts, str):
        try:
            parsed_ts = json.loads(raw_ts)
        except json.JSONDecodeError:
            parsed_ts = []
    elif isinstance(raw_ts, list):
        parsed_ts = raw_ts

    return {
        "id": podcast["id"],
        "job_id": podcast["job_id"],
        "topic": podcast["topic"],
        "language": podcast["language"],
        "script": podcast["script"],
        "audio_url": podcast["audio_url"],
        "created_at": podcast["created_at"],
        "timestamps": parsed_ts
    }

@app.delete("/user/podcasts/{job_id}")
async def delete_user_podcast(job_id: str, user_id: str = Depends(verify_auth)):
    success = delete_podcast(job_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Podcast not found or could not be deleted")
    return {"message": "Podcast deleted successfully"}