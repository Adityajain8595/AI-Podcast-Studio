import os
import random
import operator
import time
from typing import Annotated, List, TypedDict, Callable, Optional
from langchain_core.messages import HumanMessage, AIMessage
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from pydantic import BaseModel, Field
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.messages import get_buffer_string
from dotenv import load_dotenv

load_dotenv()

os.environ['TAVILY_API_KEY'] = os.getenv('TAVILY_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# Rate limiting for API calls
last_call_time = 0
CALL_DELAY = 5.0

# Global callback for streaming progress to frontend
progress_callback: Optional[Callable] = None

def set_progress_callback(callback: Callable):
    """Set callback function"""
    global progress_callback
    progress_callback = callback

def emit_progress(step: str, status: str, message: str, details: dict = None):
    """Emit progress event to frontend via callback"""
    if progress_callback:
        progress_callback({
            "step": step,
            "status": status,
            "message": message,
            "details": details or {},
            "timestamp": time.time()
        })    

def rate_limited_invoke(chain, **kwargs):
    """Rate limiting wrapper for LLM API calls"""
    global last_call_time
    current_time = time.time()
    time_since_last = current_time - last_call_time
    
    if time_since_last < CALL_DELAY:
        sleep_time = CALL_DELAY - time_since_last
        time.sleep(sleep_time)
    
    emit_progress("api", "calling", "Calling AI model...", {"model": "gpt-oss-120b"})
    result = chain.invoke(kwargs)
    last_call_time = time.time()
    emit_progress("api", "success", "AI response received", {"duration": time.time() - current_time})
    return result

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0.2,
    max_tokens=1500,
    api_key=GROQ_API_KEY,
    max_retries=3,
    timeout=30,
    model_kwargs={"system_instruction": """The current year is 2026. 
                  Treat all historical data from 2025 or earlier as past events, never as upcoming events."""}
)

# Faster model for simple query generation
query_llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0,
    max_tokens=200,
    api_key=GROQ_API_KEY,
    max_retries=3,
    timeout=20,
    model_kwargs={"system_instruction": """The current year is 2026. 
                  Search for trending or recent events of 2026 on web. 
                  Treat all historical data from 2025 or earlier as past events."""}
)

# Planning Subgraph: Extracts keywords and subtopics from user's topic

class PlanningState(TypedDict):
    topic: str
    keywords: List[str]
    subtopics: List[str]

class Plan(BaseModel):
    keywords: List[str] = Field(description="at least 5 keywords related to the topic")
    subtopics: List[str] = Field(description="at least 5 podcast subtopics based on the keywords")


def generate_plan(state: PlanningState):
    emit_progress("planning", "started", f"Analyzing topic: \"{state['topic']}\"")
    
    structured_llm = llm.with_structured_output(Plan, method="json_mode")
    prompt = PromptTemplate(
        input_variables=['topic'],
        template="""Analyze the topic: {topic}. 
        First, identify 5 crucial keywords. 
        Then, based on those keywords, generate 5 relevant subtopics for a podcast.
        You must respond in valid JSON containing exactly these two keys:
        - "keywords": a list of 5 strings
        - "subtopics": a list of 5 strings"""
    )
    try:
        chain = prompt | structured_llm
        result = rate_limited_invoke(chain, topic=state['topic'])
        
        emit_progress("planning", "success", f"Found {len(result.keywords)} keywords and {len(result.subtopics)} subtopics", 
                     {"keywords": result.keywords, "subtopics": result.subtopics})
        
        return {'keywords': result.keywords, 'subtopics': result.subtopics}
    except Exception as e:
        emit_progress("planning", "error", f"Planning failed: {str(e)}", {"error": str(e)})
        raise e

plan_builder = StateGraph(PlanningState)
plan_builder.add_node("plan", generate_plan)
plan_builder.add_edge(START, "plan")
plan_builder.add_edge("plan", END)
plan_graph = plan_builder.compile()


# Interview Subgraph: Simulates a conversational interview with web research
class InterviewState(TypedDict):
    topic: str
    messages: Annotated[List, operator.add]
    max_num_turns: int
    context: Annotated[List, operator.add]
    section: str
    sections: List
    interview_index: int
    running_summary: str

tavily_tool = TavilySearchResults(max_results=3)

class SearchQuery(BaseModel):
    query: str = Field(description="a well-structured search query")

class QuestionOutput(BaseModel):
    question: str = Field(description="the interview question to ask the expert")

class AnswerOutput(BaseModel):
    answer: str = Field(description="the expert's answer based on context")

class SectionOutput(BaseModel):
    section: str = Field(description="the formatted podcast section script")

def search_web(state: InterviewState):
    emit_progress("research", "searching", "Searching for relevant information online...", {"subtopic_index": state.get("interview_index", 0)})
    
    structured_llm = query_llm.with_structured_output(SearchQuery, method="json_mode")
    prompt = PromptTemplate(
        input_variables=["history"],
        template="""Generate a Tavily web search query from this conversation.
        Conversation: {history}
        Focus on the last question asked.
        # Example output: {{"query": "latest AI developments 2024"}}
        You must respond in valid JSON format containing a single key: "query"."""
    )
    try:
        chain = prompt | structured_llm
        messages_text = get_buffer_string(state["messages"][-4:]) if state["messages"] else state['topic']
        result = rate_limited_invoke(chain, history=messages_text)
        search_query = result.query

        emit_progress("research", "querying", f"Searching web: \"{search_query}\"")
        time.sleep(CALL_DELAY)
        search_results = tavily_tool.run(search_query)
        
        emit_progress("research", "success", f"Found {len(search_results)} sources, extracting insights", {"results_count": len(search_results)})
        formatted_context = "\n".join([f"- {res['content']}" for res in search_results])
        return {"context": [formatted_context]}
    except Exception as e:
        emit_progress("research", "warning", f"Web search issue: {str(e)[:100]}", {"error": str(e)})
        return {"context": [""]}

def generate_question(state: InterviewState):
    emit_progress("interview", "host_speaking", "Host formulating next question...", {"turn": state.get("interview_index", 0)})
    structured_llm = llm.with_structured_output(QuestionOutput, method="json_mode")
    prompt = PromptTemplate(
        input_variables=["topic", "history", "running_summary"],
        template="""You are a podcast host a highly popular, casual podcast interviewing an expert about: {topic}
        Your goal: Guide the conversation naturally and make it accessible to a general audience.

        
        Guidelines:
        1. Keep it conversational: Ask questions like you're talking a friend or companion.
        2. Break it down: If the topic is complex, ask them to explain it simply or ask for an analogy. 
        3. DYNAMIC STARTERS (POSITIVE FRAMING): Always start your questions with fresh, active hooks (e.g., "Looking closely at...", "I'm curious about...", "What happens when...", "Let's uncover..."). Completely eliminate filler verbal crutches like starting your lines with "So," or "Well,".
        4. NO PHANTOM CALLBACKS: Do NOT invent things the expert "already mentioned". Look at the Previous conversation. If it's a new topic, introduce it fresh. Never start a question with "So you were talking about..." or "You mentioned ..." unless they literally just said it in the history.
        5. No robotic prompts: NEVER say "Can you give me a concrete example." Instead say things like, "What does that look like in real life?" or "Have you seen that happen?"

        Previous conversation: {history}
        Continue to ask questions to drill down and refine your understanding of the topic.
        Ask a probing question. When satisfied with understanding, end with: "Thank you so much for your help".
        
        You must respond in valid JSON format containing a single key: "question"."""
    )
    try:
        history = get_buffer_string(state["messages"][-4:]) if state["messages"] else "Start of interview"   
        chain = prompt | structured_llm
        result = rate_limited_invoke(chain, topic=state["topic"], history=history)
        
        emit_progress("interview", "host_asked", f"Host asks: \"{result.question}\"")
        return {"messages": [AIMessage(content=result.question)]}
    except Exception as e:
        emit_progress("interview", "error", f"Question generation failed: {str(e)}", {"error": str(e)})
        raise e

def generate_answer(state: InterviewState):
    emit_progress("interview", "expert_thinking", "Expert crafting response using research...", {})

    structured_llm = llm.with_structured_output(AnswerOutput, method="json_mode")
    prompt = PromptTemplate(
        input_variables=["topic","context", "running_summary"],
        template="""You are an expert being interviewed on a popular, casual podcast. Focus area: {topic}
        Answer using ONLY this context:{context}

        Guidelines:
        1. CONTEXTUAL AWARENESS & FACTUAL GROUNDING: Base your answer RELEVANTLY and STRICTLY on the provided context. If the provided search context lacks specific numeric details, personal names, or exact specs, DO NOT invent fictional data to fill the gap.
        2. NO REAL-WORLD LORE FABRICATION: Do NOT invent fake historical individuals, fake companies, or fake events. If you must illustrate a complex mechanism, frame it explicitly as an illustrative hypothetical scenario (e.g., "Imagine if..." or "Let's say..").
        3. TEMPORAL CONSISTENCY: Pay close attention to the time period being discussed. Do not introduce modern concepts (like social media, apps, or modern technology) into historical events unless explicitly making a modern-day comparison.
        4. TONE: Speak like a human. Conversational, warm, and engaging. NO academic jargon. Break down complex ideas with simple analogies.
        5. Keep it concise: Don't monologue endlessly. Give the host room to react.
        
        You must respond in valid JSON format containing a single key: "answer"."""
    )
    try:   
        context = state["context"][-1] if state["context"] else "No context available." 
        chain = prompt | structured_llm
        result = rate_limited_invoke(chain, topic=state["topic"], context=context)
        answer = AIMessage(content=result.answer)
        answer.name = "expert"
        
        preview = result.answer[:150] + "..." if len(result.answer) > 150 else result.answer
        emit_progress("interview", "expert_answered", f"Expert responds: \"{preview}\"")
        
        return {"messages": [answer]}
    except Exception as e:
        emit_progress("interview", "error", f"Answer generation failed: {str(e)}", {"error": str(e)})
        raise e

def save_podcast(state: InterviewState):
    emit_progress("writing", "scripting", f"Converting interview {state['interview_index']} into podcast dialogue...")
    interview = get_buffer_string(state["messages"])
    return {"section": interview}

def write_section(state: InterviewState):
    emit_progress("writing", "started", f"Drafting script section {state['interview_index']}...")
    prompt = PromptTemplate(
        input_variables=["focus", "section", "index", "running_summary"],
        template="""You are an expert scriptwriter for top-tier podcasts (like Joe Rogan, Huberman Lab, or Armchair Expert). 
        Create a natural, engaging podcast section from this interview transcript.
        Topic: {focus}

        Interview transcript:{section}

        The Personas:
        - Interviewer (Host): 
            - Curious, casual, relatable. 
            - Acts as the proxy for the audience; frequently relates topics to everyday life, and asks follow-up questions. 
            - Will gently interrupt to ask for clarification if the expert uses complex or technical terms.
            - Uses dynamic conversational starters. Never start lines with "So," or "Well,".
            - You are already mid-interview, so NEVER introduce yourself. 
            - Do not overuse phrases like "wow", "exactly", "sure", "so" etc.

        - Expert: 
            - A brilliant, passionate but down-to-earth storyteller.
            - Explains complex concepts step-by-step using vivid, everyday analogies. 
            - Avoids textbook academic speak.

        Requirements:
        1. STRICT FACTUAL ACCURACY: Do NOT invent new facts, statistics, historical events, or character names that are not in the raw transcript.
        2. Create CHEMISTRY: Add conversational bridging, natural reactions, and agreements/disagreements.
        3. SIMPLIFY: Translate any heavy jargon from the transcript into plain, accessible English.
        4. DYNAMIC DIALOGUE: Adapt the transcript into a back-and-forth dialogue (6 to 8 shorter turns). People don't speak in giant paragraphs. Break up long expert answers by having the host chime in.
        5. NO AMNESIA & NO PHANTOM CALLBACKS: This is segment {index} of an ongoing conversation. DO NOT re-introduce yourselves. Dive straight into the dialogue. Do NOT invent references to unseen segments.
        6. RESOLVE CLIFFHANGERS: Ensure the dialogue segment has a logical conclusion. The expert MUST answer the question asked by the host. 
        7. Inject SSML tags for realistic audio pacing (no <emphasis> tags)
           - Use <break time="500ms"/> for short, dramatic pauses.
           - Use <break time="800ms"/> for a breath after a heavy point.
           - All tags MUST be exactly as shown and self-closing (ending with />). 
           - DO NOT output any other HTML, XML, or SSML tags whatsoever.
           - DO NOT use the ampersand symbol (&); write the word "and" instead.
        
        Output the dialogue using EXACTLY these prefixes. Do not use XML tags.
        **Interviewer:** [Host text here]
        **Expert:** [Expert text here]
        """
    )
    try:   
        chain = prompt | llm
        result = rate_limited_invoke(chain, focus=state['topic'], section=state['section'], index=state['interview_index'])
        content = result.content if hasattr(result, "content") else str(result)

        emit_progress("writing", "summarizing", "Extracting key facts for context memory...")
        summary_prompt = PromptTemplate.from_template(
            """Extract short bullet points summarizing conversation highlights and core facts established in this text. NO fluff.
            CRITICAL INSTRUCTION: IGNORE any hypothetical examples, analogies, or fictional characters. Do not include them in the summary.\n\n{text}"""
        )
        summary_chain = summary_prompt | query_llm | StrOutputParser()
        summary = summary_chain.invoke({"text": content})
        formatted_summary = f"\n--- Section {state['interview_index']} Summary ---\n{summary}\n"

        emit_progress("writing", "section_complete", f"Section {state['interview_index']} complete", {"section_length": len(content)})
        return {"sections": [content.strip()], "interview_index": state["interview_index"], "running_summary": formatted_summary}
    except Exception as e:
        emit_progress("writing", "error", f"Section writing failed: {str(e)}", {"error": str(e)})
        raise e

def route_messages(state: InterviewState, name: str = "expert"):
    messages = state["messages"]
    max_num_turns = state.get("max_num_turns", 2)
    num_responses = len([m for m in messages if isinstance(m, AIMessage) and getattr(m, "name", "") == name])
    
    emit_progress("interview", "progress", f"Turn {num_responses + 1}/{max_num_turns} complete", {"current_turn": num_responses + 1, "max_turns": max_num_turns})
    
    if num_responses >= max_num_turns:
        emit_progress("interview", "complete", f"Max turns reached, wrapping up this segment...", {})
        return "Save podcast"
        
    last_question = messages[-2] if len(messages) >= 2 else None
    if last_question and "Thank you so much for your help" in last_question.content:
        emit_progress("interview", "complete", f"Host concluded the interview, moving to script writing...", {})
        return "Save podcast"
        
    return "Host question" 


interview_builder = StateGraph(InterviewState)
interview_builder.add_node("Host question", generate_question)
interview_builder.add_node("Web research", search_web)
interview_builder.add_node("Expert answer", generate_answer)
interview_builder.add_node("Save podcast", save_podcast)
interview_builder.add_node("Write script", write_section)

interview_builder.add_edge(START, "Host question")
interview_builder.add_edge("Host question", "Web research")
interview_builder.add_edge("Web research", "Expert answer")
interview_builder.add_conditional_edges("Expert answer", route_messages, ["Host question", "Save podcast"])
interview_builder.add_edge("Save podcast", "Write script")
interview_builder.add_edge("Write script", END)

interview_graph = interview_builder.compile()


# Research Graph: Orchestrates multiple interviews and compiles final report
class ResearchState(TypedDict):
    topic: str
    language: str
    keywords: List[str]
    subtopics: List[str]
    sections: Annotated[List, operator.add]
    introduction: str
    content: str
    conclusion: str
    final_report: str
    interview_index: int 
    running_summary: Annotated[str, operator.add] 

def initiate_interviews(state: ResearchState):
    topic = state["topic"]
    current_index = state.get("interview_index", 0)
    
    if current_index < len(state["subtopics"]):
        subtopic = state["subtopics"][current_index]
        next_index = current_index + 1
        total_subtopics = len(state["subtopics"])
        
        emit_progress("main", "interview_starting", f"Starting interview {next_index}/{total_subtopics}: \"{subtopic}\"", 
                     {"current": next_index, "total": total_subtopics})
        
        if current_index == 0:
            starter_msg = f"To start us off, let's dive into {subtopic}. What's the core issue here?"
        else:  
            transitions = [
                f"Let's shift gears and explore a new angle. What can you tell us about {subtopic}?",
                f"I'm really curious about another aspect of this. How does {subtopic} fit into the picture?",
                f"Moving into a slightly different territory, what are your thoughts on {subtopic}?",
                f"Let's dive into something specific: what's the core issue when it comes to {subtopic}?",
                f"I want to pivot for a second and ask you about {subtopic}."
            ]
            starter_msg = random.choice(transitions)

        return Send("run_interview", {
            "topic": topic,
            "messages": [HumanMessage(content=starter_msg)],
            "max_num_turns": 2,
            "interview_index": next_index,
            "running_summary": state.get("running_summary", "")
        })
    else:
        emit_progress("main", "interviews_complete", f"All {len(state['subtopics'])} interviews completed!", {"total_interviews": len(state['subtopics'])})
        return "write_report"


def write_full_report(state: ResearchState):
    emit_progress("final", "started", "Writing podcast introduction and conclusion...", {})

    intro_prompt = PromptTemplate(
        input_variables=['topic', 'subtopics'],
        template="""You are Alex, the host of a popular podcast named 'DailyPods'. 
        Please write the introduction script for today's episode on: {topic} 
        
        Here are the recorded subtopics you MUST preview in a casual, narrative paragraph:
        {subtopics}

        Guidelines:
        - Use a friendly, casual, and relatable tone.
        - Welcome the listener and introduce yourself as Alex.
        - Hook the audience with a relatable observation or funny thought.
        - Introduce a uniquely named specialized female guest expert who is a credible authority on this specific theme.
          CRITICAL VARIETY DIRECTIVE: Create an entirely fresh, unique name appropriate for the specific topic domain, not 'Dr. Maya Patel'
        - Summarize the subtopics naturally in a single flowing introductory paragraph.
        - Keep it to 150-200 words.
        - Pacing: Insert the exact tag <break time="800ms"/> between major sentences so you can breathe.
        - Replace any ampersands (&) with the word "and".
        
       Ensure the script finishes fully. Do NOT truncate or cut off mid-sentence."""
    )

    outro_prompt = PromptTemplate(
        input_variables=['topic', 'subtopics', 'running_summary'],
        template="""You are Alex, the host of a popular podcast named 'DailyPods'. 
        Please write a natural, warm, and flowing conclusion script for today's episode on: {topic} 
        
        Review this background summary text for core concepts established today:
        {running_summary}

        Guidelines:
        - Keep the tone super casual, friendly, and deeply human. 
        - Pick exactly ONE or TWO conceptual takeaways from the summary text and weave them into a smooth, conversational paragraph.
        - End with a single thought-provoking, relatable closing statement about the future of tech.
        - Thank your guest for stopping by and making sense of everything.
        - Thank the audience for hanging out. 
        - Keep it strictly to a single paragraph of 100-150 words.
        - Pacing: Insert the exact tag <break time="800ms"/> between major sentences.
        - Replace any ampersands (&) with the word "and".
        
        Write the script naturally as if you are talking casually into the microphone to wrap up the show."""
    )

    try:  
        intro_chain = intro_prompt | llm | StrOutputParser()
        outro_chain = outro_prompt | llm | StrOutputParser()

        subtopics_list = "\n".join([f"- {s}" for s in state['subtopics']])
        
        emit_progress("final", "writing_intro", "Crafting engaging introduction...", {})
        intro = rate_limited_invoke(intro_chain, topic=state['topic'], subtopics=subtopics_list)
        
        emit_progress("final", "writing_outro", "Writing impactful conclusion...", {})
        outro = rate_limited_invoke(outro_chain, topic=state['topic'], subtopics=subtopics_list, running_summary=state.get("running_summary", ""))

        # Scrub markdown 
        intro = intro.replace("```html", "").replace("```text", "").replace("```", "").strip()
        outro = outro.replace("```html", "").replace("```text", "").replace("```", "").strip()

        # Strict fallback check
        if not intro or len(intro.strip()) < 40:
            if state.get("language") == "hi":
                clean_topic = state['topic'].split('(')[0].strip()
                intro = f"DailyPods में आपका स्वागत है! आज हम एक बहुत ही महत्वपूर्ण विषय {state['topic']} के बारे में विस्तार से चर्चा करने जा रहे हैं। इस विषय की बारीकियों को समझने के लिए हमारे साथ आज की विशेषज्ञ डॉ. अनन्या शर्मा जुड़ चुकी हैं। तो अपनी चाय या कॉफी तैयार रखिए, और हमारे साथ इस ज्ञानवर्धक यात्रा पर निकलिए! <break time=\"800ms\"/>"
            else:
                intro = f"Welcome to DailyPods! Today we're diving deep into the fascinating world of {state['topic']}. Joining us is our brilliant guest expert Dr. Maya Patel, who will help unravel the complexities of this topic. We'll explore key themes like {', '.join(state['subtopics'][:3])}, and uncover surprising insights along the way. So sit back, relax, and let's get into it! <break time=\"800ms\"/>"
        
        if not outro or len(outro.strip()) < 40:
            if state.get("language") == "hi":
                outro = f"आज की इस ज्ञानवर्धक और विशेष कड़ी में हमारे साथ जुड़ने के लिए आप सभी श्रोताओं का बहुत-बहुत धन्यवाद। हमें उम्मीद है कि आज की इस चर्चा से आपको नई सोच और अंतर्दृष्टि मिली होगी। अगली कड़ी तक, लगातार कुछ नया सीखते रहें, सुरक्षित रहें और अपनी जिज्ञासा बनाए रखें! <break time=\"800ms\"/>"
            else:
                outro = f"Thanks for joining us today as we explored the intricacies of {state['topic']}. We hope you found the discussion insightful and thought-provoking. Don't forget to tune-in for more episodes like this one. Until next time, keep exploring and stay curious! <break time=\"800ms\"/>"
        
        introduction = f"**Interviewer:** {intro.strip()}"
        conclusion = f"**Interviewer:** {outro.strip()}"

        emit_progress("final", "assembling", f"Assembling complete podcast script from {len(state.get('sections', []))} segments...", {"segment_count": len(state.get('sections', []))})

        valid_sections = [s.strip() for s in state.get("sections", []) if s.strip()]
        all_sections = "\n\n---\n\n".join(valid_sections)

        final = f"{introduction}\n\n---\n\n{all_sections}\n\n---\n\n{conclusion}"
        
        emit_progress("final", "complete", f"Podcast script ready! Total length: {len(final)} characters", {"script_length": len(final), "script_preview": final[:500]})
        return {"final_report": final}
        
    except Exception as e:
        emit_progress("final", "error", f"Report compilation failed: {str(e)}", {"error": str(e)})
        raise e

def safe_route_node(state: ResearchState):
    return {}

main_builder = StateGraph(ResearchState)
main_builder.add_node("plan", plan_graph)
main_builder.add_node("start_interviews", safe_route_node)
main_builder.add_node("run_interview", interview_graph)
main_builder.add_node("write_full_report", write_full_report)

main_builder.add_edge(START, "plan")
main_builder.add_edge("plan", "start_interviews")

main_builder.add_conditional_edges(
    "start_interviews", 
    initiate_interviews, 
    {
        "run_interview": "run_interview",
        "write_report": "write_full_report"  
    }
)

main_builder.add_edge("run_interview", "start_interviews")
main_builder.add_edge("write_full_report", END)

podcast_graph = main_builder.compile()

def generate_podcast_script(topic: str, language: str = "en") -> str:
    """
    Entry point for podcast generation workflow
    Language: 'en' or 'hi' - adapts content language
    """
    emit_progress("final", "start", f"Initializing workflow for topic: '{topic}'", {})
    if language == "hi":
        topic = f"{topic} (Answer in Hindi using Devanagari script)"
    result = podcast_graph.invoke({"topic": topic, "language": language, "running_summary": ""})
    
    emit_progress("final", "complete", f"Workflow finished successfully!", {})
    return result["final_report"]