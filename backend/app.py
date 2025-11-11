
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List
import os, io, json, time
from dotenv import load_dotenv
from utils_parse import extract_text_from_bytes, parse_resume_sections, generate_keyword_suggestions, generate_interview_questions_prompt, call_hf_generate, create_checklist_from_suggestions, tfidf_similarity_score
from pymongo import MongoClient

load_dotenv()
MONGO_URI = os.getenv('MONGO_URI','')
DB_NAME = os.getenv('DB_NAME','insightify')
HF_MODEL = os.getenv('HF_MODEL','google/flan-t5-base')
HF_ALLOWED_MODELS = [m.strip() for m in os.getenv('HF_ALLOWED_MODELS','').split(',') if m.strip()]

app = FastAPI(title='Insightify API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
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

@app.post('/analyze', response_model=AnalyzeResponse)
async def analyze(
    resume: UploadFile = File(...),
    jd: UploadFile = File(...),
    use_hf: bool = Form(False),
    model: Optional[str] = Form(None)
):
    r_bytes = await resume.read()
    j_bytes = await jd.read()
    try:
        resume_text = extract_text_from_bytes(r_bytes, resume.filename)
        jd_text = extract_text_from_bytes(j_bytes, jd.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Failed to extract text: {e}')
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
    fname = f'checklist_{int(time.time())}.txt'
    out_path = os.path.join('data_outputs', fname)
    os.makedirs('data_outputs', exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(checklist_text)

    record_id = None
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
            res = db['analysis'].insert_one(rec)
            record_id = str(res.inserted_id)
        except Exception as e:
            print('Failed to save to MongoDB:', e)
            record_id = None

    score = 0.0
    try:
        score = tfidf_similarity_score(resume_text, jd_text)
    except:
        score = 0.0

    return AnalyzeResponse(match_score=score, suggestions=suggestions, interview_questions=interview_questions, checklist_file=out_path, model_used=selected_model)

@app.get('/history')
def history(limit: int = 20):
    if db is None:
        raise HTTPException(status_code=400, detail='MongoDB not configured. Set MONGO_URI in env.')
    items = list(db['analysis'].find().sort('timestamp', -1).limit(limit))
    for it in items:
        it['_id'] = str(it['_id'])
    return JSONResponse(content=items)

@app.get('/download/{fname}')
def download(fname: str):
    # prevent path traversal by restricting to basename
    safe_name = os.path.basename(fname)
    path = os.path.join('data_outputs', safe_name)
    if os.path.exists(path):
        return FileResponse(path, media_type='text/plain', filename=safe_name)
    raise HTTPException(status_code=404, detail='File not found')
