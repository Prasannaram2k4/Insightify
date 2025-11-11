# Insightify Backend (FastAPI)

## Prerequisites
- Python 3.10+
- (Optional) MongoDB running locally if you want to use the `/history` endpoint

## Setup
1. Create a virtual environment (recommended)
2. Install dependencies
3. Configure environment variables

```bash
# from the repo root or backend folder
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # already created in this project for convenience
```

Update `.env` if needed:
- `MONGO_URI` and `DB_NAME` to enable history
- `HF_API_TOKEN` to enable Hugging Face question generation
- `HF_MODEL` optional (default `google/flan-t5-base`)

## Run
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

API overview:
- `POST /analyze` — multipart form: resume (file), jd (file), use_hf ("true"|"false")
- `GET /history?limit=20` — requires MongoDB
- `GET /download/{fname}` — serves files saved under `data_outputs/`

CORS is open for development. Restrict `allow_origins` in production.
