
import re, os, json
from io import BytesIO
try:
    import pdfplumber
except Exception:
    pdfplumber = None
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests

def extract_text_from_bytes(b, filename='file'):
    name = filename.lower()
    if name.endswith('.txt'):
        try:
            return b.decode('utf-8')
        except:
            return b.decode('latin-1', errors='ignore')
    if pdfplumber:
        try:
            from io import BytesIO as _BytesIO
            with pdfplumber.open(_BytesIO(b)) as pdf:
                pages = [p.extract_text() or '' for p in pdf.pages]
            return '\n'.join(pages)
        except Exception:
            pass
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(BytesIO(b))
        texts = []
        for p in reader.pages:
            try:
                texts.append(p.extract_text() or '')
            except:
                pass
        return '\n'.join(texts)
    except Exception:
        return b.decode('utf-8', errors='ignore')

def tfidf_similarity_score(text1, text2):
    vec = TfidfVectorizer(stop_words='english', max_features=5000)
    X = vec.fit_transform([text1, text2])
    cos = cosine_similarity(X[0:1], X[1:2])[0][0]
    return float(cos)

def parse_resume_sections(text):
    headers = ['experience','education','skills','projects','certifications','summary','contact']
    sections = {}
    lower = text.lower()
    lines = text.splitlines()
    current = 'header'
    sections[current] = []
    for line in lines:
        s = line.strip()
        if not s:
            continue
        l = s.lower().strip(': ')
        if any(h in l and len(l) < 30 for h in headers):
            current = l
            sections[current] = []
        else:
            sections[current].append(s)
    for k in list(sections.keys()):
        sections[k] = '\n'.join(sections[k])[:4000]
    return sections

def generate_keyword_suggestions(resume_text, jd_text, top_n=12):
    vec = TfidfVectorizer(stop_words='english', ngram_range=(1,2), max_features=1000)
    X = vec.fit_transform([jd_text, resume_text])
    feature_names = vec.get_feature_names_out()
    jd_vec = X[0].toarray()[0]
    top_idx = jd_vec.argsort()[::-1][:top_n*3]
    candidates = [feature_names[i] for i in top_idx]
    resume_lower = resume_text.lower()
    suggestions = []
    for c in candidates:
        if c.lower() not in resume_lower and len(c)>2 and not c.isnumeric():
            suggestions.append(c)
        if len(suggestions) >= top_n:
            break
    return suggestions

def generate_interview_questions_prompt(resume_text, jd_text, n=8, as_list=False):
    prompt = (
        "You are an interview assistant. Given the candidate resume and job description, generate a JSON array "
        f"of {n} concise, role-focused behavioral and technical interview questions tailored to the candidate.\n\n"
        "Resume:\n"
        f"{resume_text[:4000]}\n\n"
        "Job Description:\n"
        f"{jd_text[:4000]}\n\n"
        'Return only a JSON array of strings, e.g. ["Q1","Q2",...].'
    )
    if as_list:
        return ['Tell me about a project where you used the main technologies in the job description.',
                'Describe a challenging bug you fixed in a backend system and how you resolved it.',
                'How have you applied the primary database technology mentioned in the JD?',
                'Explain a time you optimized performance or scalability in an application.',
                'Describe your testing and CI/CD practices.',
                'How do you prioritize technical debt vs new features?',
                'Explain a time you worked in a cross-functional team to deliver a product.',
                'How do you approach debugging and root-cause analysis.'][:n]
    return prompt

def call_hf_generate(prompt, model='google/flan-t5-base'):
    token = os.getenv('HF_API_TOKEN','').strip()
    if not token:
        return None
    url = f'https://api-inference.huggingface.co/models/{model}'
    headers = {'Authorization': f'Bearer {token}'}
    payload = {'inputs': prompt, 'parameters': {'max_new_tokens': 256, 'temperature': 0.0}, 'options': {'wait_for_model': True}}
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=30)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list) and data and isinstance(data[0], dict):
                if 'generated_text' in data[0]:
                    return data[0]['generated_text']
                return str(data[0])
            if isinstance(data, dict):
                for key in ('generated_text','text'):
                    if key in data:
                        return data[key]
                if 'error' in data:
                    return None
                return str(data)
        else:
            return None
    except Exception:
        return None

def create_checklist_from_suggestions(suggestions):
    lines = ['Resume Improvement Checklist:','']
    for s in suggestions:
        lines.append(f'- Add or emphasize: {s}')
    lines.append('')
    lines.append('- Quantify achievements where possible (numbers, percentages).')
    lines.append('- Use standard section headers: Education, Experience, Skills.')
    return '\n'.join(lines)
