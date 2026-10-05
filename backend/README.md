# Insightify Backend (FastAPI)

## Prerequisites
- Python 3.10+
- (Optional) MongoDB running locally if you want to use the `/history` endpoint

## Setup
1. Create a virtual environment (recommended)
2. Install dependencies
3. Optionally configure environment variables in `backend/.env` or in your hosting provider

```bash
# from the repo root or backend folder
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# create .env in this folder only if you need optional MongoDB or Hugging Face settings
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

The analyze response includes `checklist_text`; the frontend downloads it locally without server-side file storage. Routes are also available under `/api` for the Vercel deployment.

CORS origins are configured with `FRONTEND_ORIGINS`, a comma-separated list of allowed site origins. Local Vite origins are allowed by default; set the deployed frontend origin in production.
