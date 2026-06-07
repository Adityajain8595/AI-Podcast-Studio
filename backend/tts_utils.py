import re
import io
from pydub import AudioSegment
from google.cloud import texttospeech
from podcast_workflow import emit_progress

# Google Cloud TTS client initialization
try:
    emit_progress("tts", "initializing", "☁️  Initializing GCP Text-to-Speech Client...")
    tts_client = texttospeech.TextToSpeechClient()
except Exception as e:
    emit_progress("tts", "error", "❌ GCP Auth Error: Make sure GOOGLE_APPLICATION_CREDENTIALS is set!")
    raise e

def text_to_speech_segment(text: str, lang: str, voice_gender: str) -> bytes:
    """Synthesize a single text segment and return MP3 bytes."""

    # Text cleaning and SSML handling
    valid_tags = []
    def save_tag(match):
        valid_tags.append(match.group(0))
        return f"___TAG_{len(valid_tags)-1}___"
        
    text = re.sub(r'<break[^>]*>', save_tag, text)
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    for i, tag in enumerate(valid_tags):
        text = text.replace(f"___TAG_{i}___", tag)

    text = text.replace('\\"', '"').replace("\\'", "'")

    # Synthesis phase
    synthesis_input = texttospeech.SynthesisInput(ssml=f"<speak>{text}</speak>") 
    
    if lang == "hi":
        language_code = "hi-IN"
        name = "hi-IN-Neural2-A" if voice_gender == "female" else "hi-IN-Neural2-B"
    else:
        language_code = "en-US"
        if voice_gender == "female":
            name = "en-US-Studio-O"        
        else:
            name = "en-US-Studio-M"
            
    voice = texttospeech.VoiceSelectionParams(language_code=language_code, name=name)
    
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )
    
    response = tts_client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
    return response.audio_content

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

def generate_audio_from_script(script: str, language: str, speaker_voices: dict = None) -> bytes:
    """Generate complete podcast audio from script"""
    if speaker_voices is None:
        speaker_voices = {"Interviewer": "male", "Expert": "female"}
        
    dialogues = parse_dialogue(script)
    if not dialogues:
        raise ValueError("No dialogue found in script.")
        
    combined = AudioSegment.empty()
    total_chunks = len(dialogues)
    timestamps = []
    current_ms = 0
    
    emit_progress("tts", "converting", f"Converting {total_chunks} dialogue chunks to audio...")
    
    for i, (speaker, text) in enumerate(dialogues, 1):
        if not text:
            continue
            
        preview = (text[:50] + '...') if len(text) > 50 else text
        preview = preview.replace('\n', ' ')
        emit_progress("tts", "processing", f"  [{i}/{total_chunks}] {speaker}: \"{preview}\"")
        
        voice_gender = speaker_voices.get(speaker, "male")
        
        try:
            audio_bytes = text_to_speech_segment(text, language, voice_gender)
            segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format="mp3")
            
            # Record structural audio boundary alignments
            start_sec = current_ms / 1000.0
            current_ms += len(segment)
            end_sec = current_ms / 1000.0
                      
            clean_caption = re.sub(r'<[^>]+>', '', text).strip()          
            timestamps.append({
                "speaker": speaker,
                "text": clean_caption,
                "start": start_sec,
                "end": end_sec
            })
            
            # Append track content and apply a 500ms conversational gap
            combined += segment + AudioSegment.silent(duration=500)
            current_ms += 500
        except Exception as e:
            emit_progress("tts", "error", f"  ❌ Error on chunk {i}: {e}")
            raise e
            
    emit_progress("tts", "rendering", "Rendering final MP3...")
    
    output = io.BytesIO()
    combined.export(output, format="mp3")
    emit_progress("tts", "complete", f"Audio ready! Duration: {len(combined)/1000:.1f} seconds\n")
    
    return output.getvalue(), timestamps