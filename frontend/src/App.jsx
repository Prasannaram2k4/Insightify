
import React, { useMemo, useState } from 'react'

function ReactLogo({ size = 64 }){
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 841.9 595.3" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#61DAFB" strokeWidth="30">
        <ellipse rx="165" ry="381" transform="translate(420.9 296.5) rotate(60)"/>
        <ellipse rx="165" ry="381" transform="translate(420.9 296.5) rotate(-60)"/>
        <ellipse rx="165" ry="381" transform="translate(420.9 296.5) rotate(0)"/>
      </g>
      <circle cx="420.9" cy="296.5" r="35" fill="#61DAFB"/>
    </svg>
  )
}

export default function App() {
  // Sample data (provided by user) to render a demo result at the top of the page
  const SAMPLE_RESUME = `Prasannaram R R +91 8778557651
Final Year Undergraduate prasannaram978@gmail.com
Software Engineer GitHub Profile
Portfolio Link LinkedIn Profile
EDUCATION
Bachelor of Engineering in Computer Science and Engineering 2022 – 2026
VSB College of Engineering Technical Campus, Coimbatore CGPA: 8.5/10.0
EXPERIENCE
Software Engineering – AI & Full Stack Development Intern Jun 2025 – Oct 2025
Evalbench On-Site
• Developed and optimized AI-powered web applications by building responsive front-end components using React.js, HTML, and JavaScript, and collaborating with backend engineers to enhance API performance and ensure seamless integration across full-stack systems.
• Contributed to software engineering workflows through code reviews, debugging, and daily stand-ups, while implementing and maintaining REST APIs, applying modern backend development and AI integration practices.
TECHNICAL PROJECTS
Ragnify – AI Document Q&A System (Retrieval-Augmented Generation) [GitHub]
Python, FastAPI, React.js, FAISS, Hugging Face Transformers, Docker
• Built a Retrieval-Augmented Generation (RAG) system for intelligent, context-aware Q&A over PDFs using FastAPI, FAISS, and Hugging Face Transformers.
• Designed a multi-provider LLM framework integrating OpenAI, Anthropic, and Ollama with a React-based interface and Dockerized backend for scalable local-first operation.
MarketPulse — Stock Analytics & Portfolio Intelligence Platform [GitHub]
Node.js, Express.js, React.js, MongoDB, JWT, REST APIs, Recharts
• Built a full-stack financial analytics platform using React.js and Recharts to visualize real-time market trends, portfolio performance, and stock insights with dynamic data updates.
• Developed a scalable Node.js/Express backend featuring optimized RESTful APIs, secure JWT-based authentication, and efficient MongoDB data models for low-latency portfolio and watchlist management.
TECHNICAL SKILLS AND INTERESTS
Programming Languages Python, JavaScript, Java, C++, SQL
Frameworks & Libraries FastAPI, React.js, Django REST Framework, Node.js, Express.js, Flask, Hugging Face Transformers, LangChain, FAISS, REST APIs
Databases PostgreSQL, MongoDB, MySQL, Firebase, Redis
Cloud & DevOps AWS (EC2, S3), Render, Vercel, Docker, CI/CD (GitHub Actions)`

  const SAMPLE_JD = `Required technical and professional expertise
Excellent coding skills in Java/Python (including Pandas, NumPy), Data Structures, Algorithms, Problem Solving, Linear Algebra, Probability, Statistics, Experience with VS Code, Jupyter notebooks, Git

Cloud platforms and frameworks (AWS/Azure/IBM/Google), Containerization (Docker/Kubernetes/Openshift), Virtualization (VMware, Hyper-V), Networking, Security, Scripting, Monitoring and Logging, AI/ML fundamentals

 * Good programming and hands on experience in python
* Familiarity with Cloud technologies (containerization, kubernetes)
 * Exposure to different model types like Dense, MoE, Mamba and multimodal models.
 * Experience with Pytorch and FSDP
 * Exposure to tuning and GPU optimization
 * Experience with internals of training stacks
 * Exposure to different tuning techniques including SFT, LoRA, RL.

 

 Eligibility Criteria

 * B.E. / B.Tech
 * M.E. / M.Tech (including Dual Degree programs)
 * Ph.D.
 * Minimum 70% or 7.0 CGPA and above in the pursuing degree

 Time Duration

 The internship will be conducted between May 2026 to August 2026, for a maximum duration of 3 months.

Preferred technical and professional experience
* Exposure to Triton and Hugging Face
 * Exposure to distributed foundation model training
* Familiarity of GPU architectures, NCCL and compilers / Pytorch Compile`

  // Curated sample suggestions derived from JD (keywords likely missing or to emphasize)
  const SAMPLE_SUGGESTIONS = [
    'Pandas', 'NumPy', 'Data Structures', 'Algorithms', 'Linear Algebra', 'Probability', 'Statistics',
    'Kubernetes', 'Openshift', 'VMware', 'Hyper-V', 'Monitoring and Logging',
    'Model types: Dense / MoE / Mamba / Multimodal', 'PyTorch', 'FSDP', 'GPU optimization',
    'Training stack internals', 'SFT', 'LoRA', 'RL', 'Triton', 'NCCL', 'PyTorch Compile'
  ]

  // Sample interview questions tailored to the JD
  const SAMPLE_QUESTIONS = [
    'Describe a project where you used Python data tooling (e.g., Pandas/NumPy) to analyze or transform data. What challenges did you face?',
    'How do you approach optimizing a training pipeline on GPUs? Share specific techniques or tools you’ve used.',
    'Explain the differences between Dense, MoE, and Mamba model families and when you might prefer each.',
    'Walk through your experience with PyTorch FSDP or other distributed training strategies. What trade‑offs did you encounter?',
    'How would you containerize and deploy a model service with Docker and Kubernetes? Outline the core steps.',
    'What’s your strategy for monitoring and logging ML services in production?',
    'Compare SFT, LoRA, and RL fine‑tuning approaches. When is each most appropriate?',
    'How have you used CI/CD to automate model training or deployment workflows?'
  ]

  // A simple readable demo score (the backend uses TF‑IDF; this is just an illustrative value for the sample)
  const SAMPLE_SCORE = 0.72

  const [resumeFile, setResumeFile] = useState(null)
  const [jdFile, setJdFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [useHF, setUseHF] = useState(false)
  const [modelChoice, setModelChoice] = useState('')
  const [customModel, setCustomModel] = useState('')
  const MODEL_PRESETS = [
    'google/flan-t5-base',
    'google/flan-t5-large',
    'google/flan-t5-xl',
    'bigscience/T0pp',
    'google/t5-v1_1-base',
    'google/flan-ul2'
  ]

  const effectiveModel = useMemo(() => {
    return (modelChoice === 'custom' ? customModel : modelChoice) || ''
  }, [modelChoice, customModel])

  const analyze = async () => {
    if (!resumeFile || !jdFile) {
      alert('Upload both files')
      return
    }
    setLoading(true)
    const form = new FormData()
    form.append('resume', resumeFile)
    form.append('jd', jdFile)
  form.append('use_hf', useHF ? 'true' : 'false')
    if (useHF && effectiveModel) {
      form.append('model', effectiveModel)
    }
    try {
      const res = await fetch('http://localhost:8000/analyze', { method: 'POST', body: form })
      if (!res.ok) {
        throw new Error(`Server responded ${res.status}`)
      }
      const j = await res.json()
      setResult(j)
    } catch (e) {
      alert('Request failed: ' + e)
    } finally { setLoading(false) }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="logo-row">
          <ReactLogo size={56} />
          <h1 className="brand-title">Insightify</h1>
          <ReactLogo size={56} />
        </div>
        <p className="subtitle">Resume ↔ Job Description match, suggestions, and interview prep</p>
      </header>

      {/* Result Preview Section (labels adjusted to remove 'sample'/'demo') */}
      <section className="card">
        <div className="title-row">
          <h2 className="card-title">Result Preview</h2>
        </div>
        <div className="results">
          <div className="card">
            <h3 className="card-title">Match Score</h3>
            <div className="score">
              <span className="score-number">{Math.round(SAMPLE_SCORE * 100)}%</span>
              <span className="score-caption">Illustrative score</span>
            </div>
          </div>
          <div className="card">
            <h3 className="card-title">Top Suggestions</h3>
            <ul className="list">
              {SAMPLE_SUGGESTIONS.slice(0,12).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="card">
            <h3 className="card-title">Interview Questions</h3>
            <ol className="list numbered">
              {SAMPLE_QUESTIONS.map((q, i) => (<li key={i}>{q}</li>))}
            </ol>
          </div>
        </div>
        <div className="grid" style={{marginTop:16}}>
          <div className="card">
            <h3 className="card-title">Resume</h3>
            <pre className="pre-block">{SAMPLE_RESUME}</pre>
          </div>
          <div className="card">
            <h3 className="card-title">Job Description</h3>
            <pre className="pre-block">{SAMPLE_JD}</pre>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Upload Files</h2>
        <div className="grid">
          <div className="field">
            <label className="label">Resume (PDF / TXT)</label>
            <input className="input" type="file" onChange={e => setResumeFile(e.target.files[0])} accept=".pdf,.txt" />
          </div>
          <div className="field">
            <label className="label">Job Description (PDF / TXT)</label>
            <input className="input" type="file" onChange={e => setJdFile(e.target.files[0])} accept=".pdf,.txt" />
          </div>
        </div>

        <div className="models">
          <div className="model-picker">
            <div className="label" style={{marginBottom:6}}>Choose a model</div>
            <div className="chips">
              {MODEL_PRESETS.map(m => (
                <button
                  key={m}
                  type="button"
                  className={`chip ${modelChoice === m ? 'selected' : ''}`}
                  onClick={() => { setModelChoice(m); setUseHF(true); }}
                  title={m}
                >{m}</button>
              ))}
              <button
                type="button"
                className={`chip ${modelChoice === 'custom' ? 'selected' : ''}`}
                onClick={() => { setModelChoice('custom'); setUseHF(!!customModel); }}
              >Custom…</button>
            </div>
            {modelChoice === 'custom' && (
              <div className="model-controls" style={{marginTop:8}}>
                <input
                  className="input"
                  type="text"
                  placeholder="Enter model id, e.g. google/flan-t5-xl"
                  value={customModel}
                  onChange={e => { setCustomModel(e.target.value); setUseHF(!!e.target.value); }}
                />
              </div>
            )}
            <p className="help">Model selection is optional. If none selected, analysis still runs locally without generation.</p>
          </div>
        </div>

        <div className="actions">
          <button className="btn" onClick={analyze} disabled={loading}>
            {loading ? 'Analyzing…' : 'Analyze Match'}
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">How it works</h2>
        <div className="accordion">
          <details>
            <summary>What does the match score mean?</summary>
            <div className="accordion-body">
              <p>The score is a similarity between your resume and the job description using TF‑IDF cosine similarity.</p>
              <ul className="info-list">
                <li>0–30%: Low overlap — consider tailoring your resume to the role.</li>
                <li>30–60%: Moderate — add missing skills/keywords and align experience bullets.</li>
                <li>60–85%: Strong — you likely match many requirements; refine achievements.</li>
                <li>85–100%: Very strong — high textual overlap; still ensure authenticity and clarity.</li>
              </ul>
              <p className="note">Note: This is a text‑based proxy, not a guarantee of ATS pass or fit.</p>
            </div>
          </details>

          <details>
            <summary>ATS suggestions</summary>
            <div className="accordion-body">
              <p>We surface important keywords from the job description that are missing or under‑emphasized in your resume.</p>
              <ul className="info-list">
                <li>Weigh these against your real experience — do not add anything you didn’t do.</li>
                <li>Integrate keywords naturally into Skills and Experience bullet points.</li>
                <li>Use standard section headers (Experience, Education, Skills, Projects).</li>
                <li>Prefer text‑based PDF or DOCX; avoid images/tables that hide text from parsers.</li>
              </ul>
            </div>
          </details>

          <details>
            <summary>Interview prep</summary>
            <div className="accordion-body">
              <p>Questions are tailored to the role and your resume. Use them to prepare concise answers.</p>
              <ul className="info-list">
                <li>Practice with the STAR method (Situation, Task, Action, Result).</li>
                <li>Emphasize metrics (latency, throughput, revenue, adoption, cost).</li>
                <li>If a model is selected, questions may be generated by that model; otherwise a curated set is used.</li>
              </ul>
            </div>
          </details>

          <details>
            <summary>Extra tips for ATS & recruiters</summary>
            <div className="accordion-body">
              <ul className="info-list">
                <li>Quantify: add numbers, timeframes, baselines (e.g., “−30% build time in 2 months”).</li>
                <li>Consistency: one font, aligned dates, unified tense and person.</li>
                <li>File hygiene: name like <code>Firstname_Lastname_Role_2025.pdf</code>.</li>
                <li>Links: GitHub/portfolio with relevant projects and clear READMEs.</li>
                <li>Avoid: text in images, dense tables, uncommon icons/graphics.</li>
              </ul>
            </div>
          </details>
        </div>
      </section>

      {result && (
        <section className="results">
          <div className="card">
            <h2 className="card-title">Match Score</h2>
            <div className="score">
              <span className="score-number">{Math.round(result.match_score * 100)}%</span>
              <span className="score-caption">Similarity via TF‑IDF cosine</span>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Top Suggestions</h2>
            <ul className="list">
              {result.suggestions && result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="card">
            <div className="title-row">
              <h2 className="card-title">Interview Questions</h2>
              {result.model_used && (
                <span className="badge" title="Model used">{result.model_used}</span>
              )}
            </div>
            <ol className="list numbered">
              {result.interview_questions && result.interview_questions.map((q, i) => (<li key={i}>{q}</li>))}
            </ol>
          </div>

          {result.checklist_file && (
            <div className="card">
              <h2 className="card-title">Checklist</h2>
              <a className="link" href={'http://localhost:8000/download/' + result.checklist_file.split('/').pop()} target="_blank" rel="noopener noreferrer">Download Checklist</a>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
