
from fastapi import APIRouter, FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
from uuid import uuid4
import os, json, time
from dotenv import load_dotenv
from utils_parse import extract_text_from_bytes, parse_resume_sections, generate_keyword_suggestions, generate_interview_questions_prompt, call_hf_generate, create_checklist_from_suggestions, tfidf_similarity_score
from pymongo import MongoClient

load_dotenv()
MONGO_URI = os.getenv('MONGO_URI','')
DB_NAME = os.getenv('DB_NAME','insightify')
HF_MODEL = os.getenv('HF_MODEL','google/flan-t5-base')
HF_ALLOWED_MODELS = [m.strip() for m in os.getenv('HF_ALLOWED_MODELS','').split(',') if m.strip()]
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
OUTPUT_DIR = Path(__file__).resolve().parent / 'data_outputs'
DEFAULT_ORIGINS = 'http://localhost:5173,http://localhost:5175'
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv('FRONTEND_ORIGINS', DEFAULT_ORIGINS).split(',')
    if origin.strip()
]

app = FastAPI(title='Insightify API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=['*'],
    allow_headers=['*'],
)

# init mongodb client if provided
mongo_client = None
db = None
if MONGO_URI:
    try:
        mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        mongo_client.server_info()
        db = mongo_client[DB_NAME]
    except Exception as e:
        print('MongoDB connection failed:', e)
        mongo_client = None
        db = None

class AnalyzeResponse(BaseModel):
    match_score: float
    suggestions: List[str]
    interview_questions: List[str]
    checklist_file: Optional[str]
    model_used: Optional[str]

api_router = APIRouter()

async def read_document(upload: UploadFile) -> str:
    filename = upload.filename or ''
    if Path(filename).suffix.lower() not in {'.pdf', '.txt'}:
        raise HTTPException(status_code=400, detail='Only PDF and TXT files are supported.')
    content = await upload.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail='Each file must be 10 MB or smaller.')
    try:
        text = extract_text_from_bytes(content, filename)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f'Could not read {filename}: {exc}') from exc
    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail=f'No readable text found in {filename}. Use a text-based PDF or TXT file.',
        )
    return text

@api_router.get('/health')
def health():
    return {'status': 'ok'}

@api_router.post('/analyze', response_model=AnalyzeResponse)
async def analyze(
    resume: UploadFile = File(...),
    jd: UploadFile = File(...),
    use_hf: bool = Form(False),
    model: Optional[str] = Form(None)
):
    resume_text, jd_text = await read_document(resume), await read_document(jd)
    suggestions = generate_keyword_suggestions(resume_text, jd_text, top_n=12)
    interview_questions = []
    selected_model = None
    if use_hf and os.getenv('HF_API_TOKEN'):
        prompt = generate_interview_questions_prompt(resume_text, jd_text, n=8)
        # Allow client to override the model per request; fallback to env/default
        selected_model = (model or os.getenv('HF_MODEL') or HF_MODEL).strip()
        if HF_ALLOWED_MODELS and selected_model not in HF_ALLOWED_MODELS:
            selected_model = HF_MODEL
        hf_out = call_hf_generate(prompt, model=selected_model)
        if hf_out:
            try:
                parsed = json.loads(hf_out)
                if isinstance(parsed, list):
                    interview_questions = parsed[:8]
                else:
                    interview_questions = [str(hf_out)]
            except Exception:
                interview_questions = [line.strip() for line in hf_out.splitlines() if line.strip()][:8]
    if not interview_questions:
        interview_questions = generate_interview_questions_prompt(resume_text, jd_text, n=8, as_list=True)

    checklist_text = create_checklist_from_suggestions(suggestions)
    fname = f'checklist_{int(time.time())}_{uuid4().hex[:8]}.txt'
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / fname
    with out_path.open('w', encoding='utf-8') as f:
        f.write(checklist_text)

    if db is not None:
        rec = {
            'resume_filename': resume.filename,
            'jd_filename': jd.filename,
            'timestamp': int(time.time()),
            'suggestions': suggestions,
            'interview_questions': interview_questions,
            'model_used': selected_model
        }
        try:
            db['analysis'].insert_one(rec)
        except Exception as e:
            print('Failed to save to MongoDB:', e)

    score = 0.0
    try:
        score = tfidf_similarity_score(resume_text, jd_text)
    except:
        score = 0.0

    return AnalyzeResponse(match_score=score, suggestions=suggestions, interview_questions=interview_questions, checklist_file=fname, model_used=selected_model)

@api_router.get('/history')
def history(limit: int = Query(default=20, ge=1, le=100)):
    if db is None:
        raise HTTPException(status_code=400, detail='MongoDB not configured. Set MONGO_URI in env.')
    try:
        items = list(db['analysis'].find().sort('timestamp', -1).limit(limit))
    except Exception as exc:
        raise HTTPException(status_code=503, detail='Analysis history is temporarily unavailable.') from exc
    for it in items:
        it['_id'] = str(it['_id'])
    return JSONResponse(content=items)

@api_router.get('/download/{fname}')
def download(fname: str):
    # prevent path traversal by restricting to basename
    safe_name = os.path.basename(fname)
    path = OUTPUT_DIR / safe_name
    if path.is_file():
        return FileResponse(path, media_type='text/plain', filename=safe_name)
    raise HTTPException(status_code=404, detail='File not found')

app.include_router(api_router)
app.include_router(api_router, prefix='/api', include_in_schema=False)
