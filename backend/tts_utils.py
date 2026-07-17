import re
import io
from pydub import AudioSegment
import asyncio
import edge_tts
from podcast_workflow import emit_progress

def get_voice(lang: str, gender: str) -> str:
    """Select Edge TTS voices."""
    if lang == "hi":
        return "hi-IN-SwaraNeural" if gender == "female" else "hi-IN-MadhurNeural"
    
    return "en-US-JennyNeural" if gender == "female" else "en-US-AndrewNeural"

async def tts_segment(text: str, lang: str, voice_gender: str) -> bytes:
    """Synthesize a single text segment and return MP3 bytes."""

    # Strip all XML/SSML tags completely and clean it
    clean_text = re.sub(r'<[^>]+>', '', text)   
    clean_text = clean_text.replace("&", "and").replace('\\"', '"').replace("\\'", "'")

    # Synthesis phase
    voice = get_voice(lang, voice_gender)
    communicate = edge_tts.Communicate(clean_text, voice)
    
    audio_data = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.write(chunk["data"])
    
    return audio_data.getvalue()

def parse_dialogue(script: str):
    """Extract speaker and text pairs from podcast script"""

    dialogues = []
    
    # Clean markdown artifacts
    script = re.sub(r'-{3,}', '', script)
    script = script.replace("##", "")
    script = script.replace("#", "")
    
    # Extract speaker patterns
    parts = re.split(r'(?i)\*?\*?\b(Interviewer|Expert)\b\*?\*?\s*:\s*', script)
    
    # Chunk into pieces
    def add_chunks(speaker, text_block):
        text_block = text_block.replace("**", "").replace("*", "").strip()
        if not text_block: return
        
        paragraphs = [p.strip() for p in text_block.split('\n') if p.strip()]
        for p in paragraphs:
            dialogues.append((speaker, p))

    if parts[0].strip():
        add_chunks("Interviewer", parts[0])
        
    # Extract alternating speakers and their text
    for i in range(1, len(parts), 2):
        speaker_name = parts[i].capitalize()
        text_block = parts[i+1]
        add_chunks(speaker_name, text_block)
        
    return dialogues

async def _generate_audio_async(script: str, language: str, speaker_voices: dict):
    """Internal async generation logic"""
    dialogues = parse_dialogue(script)
    if not dialogues:
        raise ValueError("No dialogue found in script.")
        
    combined = AudioSegment.empty()
    total_chunks = len(dialogues)
    timestamps = []
    current_ms = 0
    
    emit_progress("tts", "converting", f"Converting {total_chunks} chunks using Edge TTS...")
    
    for i, (speaker, text) in enumerate(dialogues, 1):
        voice_gender = speaker_voices.get(speaker, "male")

        emit_progress("tts", "processing", f"Processing chunk {i}/{total_chunks}: {speaker}")

        # Extracting break duration
        break_match = re.search(r'time="(\d+)ms"', text)
        duration_ms = int(break_match.group(1)) if break_match else 500

        audio_bytes = await tts_segment(text, language, voice_gender)

        if not audio_bytes or len(audio_bytes) < 100: 
            emit_progress("tts", "warning", f"Skipping empty audio chunk for: {speaker}")
            continue

        segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format="mp3")
        
        # Record timing
        start_sec = current_ms / 1000.0
        current_ms += len(segment)
        end_sec = current_ms / 1000.0
        
        clean_caption = re.sub(r'<[^>]+>', '', text).strip()
        timestamps.append({"speaker": speaker, "text": clean_caption, "start": start_sec, "end": end_sec})
        
        combined += segment + AudioSegment.silent(duration=duration_ms)
        current_ms += duration_ms
        
    output = io.BytesIO()
    combined.export(output, format="mp3")
    return output.getvalue(), timestamps

def generate_audio_from_script(script: str, language: str, speaker_voices: dict = None) -> bytes:
    """Synchronous wrapper for the async generation function"""
    if speaker_voices is None:
        speaker_voices = {"Interviewer": "male", "Expert": "female"}
    
    return asyncio.run(_generate_audio_async(script, language, speaker_voices))