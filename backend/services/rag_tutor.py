import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env
load_dotenv()

# Initialize the Groq client
# This automatically looks for the GROQ_API_KEY environment variable
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("[RAG Tutor] WARNING: GROQ_API_KEY not found in environment.")

client = Groq(api_key=api_key)

def generate_mission_briefing(mission_id: str) -> str:
    """
    Simulates fetching syllabus context and prompts the Groq LLM to 
    generate an exciting Spider-Man themed mission briefing.
    """
    print(f"[RAG Tutor] Fetching syllabus context and generating briefing for mission: {mission_id}")
    
    # Placeholder syllabus context (in a real app, you would query a vector DB)
    if "algebra" in mission_id.lower() or "001" in mission_id:
        topic = "solving linear equations"
        villain = "Green Goblin"
    elif "geometry" in mission_id.lower() or "002" in mission_id:
        topic = "calculating area of triangles"
        villain = "Doc Ock"
    else:
        topic = "advanced calculus"
        villain = "Venom"

    system_prompt = (
        "You are the AI interface for the Spider-Suit, assisting the user (Spider-Man) "
        "with their math missions. You must speak in an urgent, encouraging, and heroic tone. "
        "Keep your responses very brief (2-3 sentences max)."
    )
    
    user_prompt = (
        f"Generate a mission briefing for Spider-Man. The target villain is {villain}. "
        f"To defeat them, Spider-Man must master the math topic: {topic}."
    )

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="openai/gpt-oss-120b",
            temperature=0.7,
            max_tokens=150,
        )
        
        briefing = chat_completion.choices[0].message.content
        print(f"[RAG Tutor] Generated Briefing:\n{briefing}\n")
        return briefing
    except Exception as e:
        error_msg = f"Failed to generate briefing: {e}"
        print(f"[RAG Tutor] ERROR: {error_msg}")
        return "Warning: Suit AI offline. Rely on your spider-sense!"

def generate_dynamic_question(villain: str, topic: str, difficulty: str) -> str:
    """
    Generates a dynamic math question in JSON format. The question is a story-based
    word problem involving the specific villain and math topic.
    """
    system_prompt = (
        "You are an educational AI. Do NOT output any thinking process or <think> tags. "
        "Output ONLY raw JSON format, no markdown formatting or extra text. "
        "The JSON must have this exact structure: "
        '{"question": "story based word problem", "options": ["A", "B", "C", "D"], '
        '"correct_answer": "A", "explanation": "step by step solution"}'
    )
    
    user_prompt = (
        f"Generate a {difficulty} difficulty math word problem about {topic}. "
        f"The story must be about Spider-Man trying to stop {villain}."
    )
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="openai/gpt-oss-120b",
            temperature=0.7,
            max_tokens=800,
        )
        content = completion.choices[0].message.content
        if "<think>" in content:
            content = content.split("</think>")[-1].strip()
        return content
    except Exception as e:
        print(f"[RAG Tutor] Error generating question: {e}")
        return "{}"

def generate_gwen_hint(villain: str, question_text: str, cognitive_state: str) -> str:
    """
    Generates a hint from Spider-Gwen. She tailors her tone based on the 
    student's eye-tracking cognitive state (e.g. Overwhelmed, Drifting, Focused).
    She provides a hint specifically for the provided question_text.
    """
    system_prompt = (
        "You are Spider-Gwen (Gwen Stacy). You are helping the user (Spider-Man) over comms "
        "with a math problem. Be witty, encouraging, and brief (2 sentences max). "
        "Do not give the exact answer, but give a highly specific, actionable hint on how to start solving the exact problem. Do NOT output any thinking process or <think> tags."
    )
    
    # Adapt her tone based on the eye-tracker's classification!
    state_instruction = ""
    if cognitive_state == "Overwhelmed":
        state_instruction = "The user is panicking and overwhelmed. Tell them to take a deep breath first."
    elif cognitive_state == "Drifting":
        state_instruction = "The user is getting distracted and drifting. Snap them back into focus!"
    elif cognitive_state == "Impulsive":
        state_instruction = "The user is rushing and being impulsive. Tell them to slow down and check their work."
    else:
        state_instruction = "The user is focused. Just give a quick, sharp hint."
        
    user_prompt = (
        f"Spider-Man is fighting {villain} and needs to solve this exact problem: '{question_text}'. "
        f"{state_instruction} Give him a highly specific hint for this exact problem!"
    )
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="openai/gpt-oss-120b",
            temperature=0.8,
            max_tokens=300,
        )
        content = completion.choices[0].message.content
        if "<think>" in content:
            content = content.split("</think>")[-1].strip()
        return content
    except Exception as e:
        print(f"[RAG Tutor] Error generating hint: {e}")
        return "Gwen: Hey, my comms are breaking up! Just remember your training!"

