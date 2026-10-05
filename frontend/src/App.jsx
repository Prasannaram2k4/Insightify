
import React, { useState } from 'react'
import {
  ArrowDownToLine,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  FileText,
  FileUp,
  LoaderCircle,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const apiUrl = path => `${API_BASE_URL}${path}`

function DocumentDropzone({ id, title, description, file, icon: Icon, onChange, onError }) {
  const [dragging, setDragging] = useState(false)

  const acceptFile = nextFile => {
    if (!nextFile) return
    if (!/\.(pdf|txt)$/i.test(nextFile.name)) {
      onError('Choose a PDF or TXT file.')
      return
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      onError('Each file must be 10 MB or smaller.')
      return
    }
    onError('')
    onChange(nextFile)
  }

  return (
    <div className={`document-dropzone ${dragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}>
      <label
        className="dropzone-label"
        htmlFor={id}
        onDragOver={event => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => {
          event.preventDefault()
          setDragging(false)
          acceptFile(event.dataTransfer.files[0])
        }}
      >
        <input
          id={id}
          className="file-input"
          type="file"
          accept=".pdf,.txt"
          onChange={event => {
            acceptFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        <span className="dropzone-icon"><Icon size={20} strokeWidth={1.8} /></span>
        <span className="dropzone-copy">
          <span className="dropzone-title">{title}</span>
          <span className="dropzone-description">{file ? file.name : description}</span>
        </span>
        <span className="browse-action">{file ? 'Replace' : 'Browse'}</span>
      </label>
      {file && (
        <div className="file-meta">
          <span><Check size={13} /> Ready · {(file.size / 1024).toFixed(0)} KB</span>
          <button className="clear-file" type="button" aria-label={`Remove ${title.toLowerCase()}`} onClick={() => onChange(null)}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const SAMPLE_RESUME = `Sample Candidate | Software Engineer
Software Engineer GitHub Profile
Portfolio Link LinkedIn Profile
EDUCATION
Bachelor of Engineering in Computer Science and Engineering, 2022–2026
Sample University, CGPA: 8.5/10.0
EXPERIENCE
Software Engineering – AI & Full Stack Development Intern, 2025
Technology Company
• Developed and optimized AI-powered web applications by building responsive front-end components using React.js, HTML, and JavaScript, and collaborating with backend engineers to enhance API performance and ensure seamless integration across full-stack systems.
• Contributed to software engineering workflows through code reviews, debugging, and daily stand-ups, while implementing and maintaining REST APIs, applying modern backend development and AI integration practices.
TECHNICAL PROJECTS
Document Q&A System (Retrieval-Augmented Generation)
Python, FastAPI, React.js, FAISS, Hugging Face Transformers, Docker
• Built a Retrieval-Augmented Generation (RAG) system for intelligent, context-aware Q&A over PDFs using FastAPI, FAISS, and Hugging Face Transformers.
• Designed a multi-provider LLM framework integrating OpenAI, Anthropic, and Ollama with a React-based interface and Dockerized backend for scalable local-first operation.
Stock Analytics & Portfolio Intelligence Platform
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

  const [resumeFile, setResumeFile] = useState(null)
  const [jdFile, setJdFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoLoaded, setDemoLoaded] = useState(false)
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

  const effectiveModel = (modelChoice === 'custom' ? customModel : modelChoice) || ''

  const loadDemo = () => {
    setResumeFile(new File([SAMPLE_RESUME], 'sample-resume.txt', { type: 'text/plain' }))
    setJdFile(new File([SAMPLE_JD], 'sample-job-description.txt', { type: 'text/plain' }))
    setDemoLoaded(true)
    setResult(null)
    setError('')
  }

  const analyze = async event => {
    event.preventDefault()
    if (!resumeFile || !jdFile) {
      setError('Add both documents to start your analysis.')
      return
    }
    setLoading(true)
    setError('')
    const form = new FormData()
    form.append('resume', resumeFile)
    form.append('jd', jdFile)
    form.append('use_hf', useHF ? 'true' : 'false')
    if (useHF && effectiveModel) {
      form.append('model', effectiveModel)
    }
    try {
      const res = await fetch(apiUrl('/analyze'), { method: 'POST', body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail || `Server responded ${res.status}`)
      }
      const j = await res.json()
      setResult(j)
    } catch (e) {
      const message = e.message === 'Failed to fetch'
        ? 'Could not reach the analysis service. Please try again in a moment.'
        : e.message
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Insightify home">
          <span className="brand-mark"><ScanSearch size={19} strokeWidth={2} /></span>
          <span className="brand-name">insightify<span>.</span></span>
        </a>
        <div className="topbar-meta"><span className="status-dot" /> RESUME MATCH STUDIO</div>
        <button className="demo-button" type="button" onClick={loadDemo} disabled={loading}>
          <Sparkles size={15} /> Try sample
        </button>
      </header>

      <main id="top" className="main-content">
        <section className="intro">
          <p className="eyebrow"><span>01</span> CAREER TOOLS / MATCH ANALYSIS</p>
          <h1>Make your next move<br /><em>with a clearer picture.</em></h1>
          <p className="intro-copy">See where your experience meets the role, and what to bring forward.</p>
        </section>

        <form className="analysis-workspace" onSubmit={analyze}>
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span>01</span> YOUR DOCUMENTS</p>
              <h2>What are we comparing?</h2>
            </div>
            <span className="file-format"><FileText size={14} /> PDF or TXT <i /> 10 MB max</span>
          </div>

          <div className="document-grid">
            <DocumentDropzone
              id="resume-upload"
              title="Your resume"
              description="Drop your resume here or browse"
              file={resumeFile}
              icon={FileUp}
              onChange={file => { setResumeFile(file); setResult(null); setDemoLoaded(false) }}
              onError={setError}
            />
            <div className="comparison-mark" aria-hidden="true"><span>+</span></div>
            <DocumentDropzone
              id="jd-upload"
              title="The job description"
              description="Drop the role details here or browse"
              file={jdFile}
              icon={BriefcaseBusiness}
              onChange={file => { setJdFile(file); setResult(null); setDemoLoaded(false) }}
              onError={setError}
            />
          </div>

          <div className="workspace-controls">
            <details className="advanced-settings">
              <summary><SlidersHorizontal size={15} /> Question settings</summary>
              <div className="settings-content">
                <label className="toggle-row">
                  <input type="checkbox" checked={useHF} onChange={event => setUseHF(event.target.checked)} />
                  <span className="toggle-indicator" />
                  <span><strong>Generate questions with a model</strong><small>Optional · uses your configured Hugging Face service</small></span>
                </label>
                {useHF && (
                  <div className="model-fields">
                    <label htmlFor="model-choice">Model</label>
                    <select id="model-choice" value={modelChoice} onChange={event => setModelChoice(event.target.value)}>
                      <option value="">Use server default</option>
                      {MODEL_PRESETS.map(model => <option value={model} key={model}>{model}</option>)}
                      <option value="custom">Custom model ID</option>
                    </select>
                    {modelChoice === 'custom' && (
                      <input className="custom-model" type="text" placeholder="organization/model-name" value={customModel} onChange={event => setCustomModel(event.target.value)} />
                    )}
                  </div>
                )}
              </div>
            </details>

            <div className="submit-row">
              <span className="privacy-note"><ShieldCheck size={15} /> Your source files aren’t saved</span>
              <button className="analyze-button" type="submit" disabled={loading || !resumeFile || !jdFile}>
                {loading ? <><LoaderCircle className="spinner" size={17} /> Analyzing</> : <>Analyze match <ArrowRight size={17} /></>}
              </button>
            </div>
          </div>
          {error && <p className="error-message" role="alert">{error}</p>}
          {demoLoaded && <p className="demo-loaded"><Check size={14} /> Sample documents loaded. Run the analysis when you’re ready.</p>}
        </form>

        {result && (
          <section className="results-section" aria-live="polite">
            <div className="results-heading">
              <div>
                <p className="eyebrow"><span>02</span> YOUR READOUT</p>
                <h2>Here’s where you stand.</h2>
              </div>
              {result.checklist_file && (
                <a className="download-button" href={apiUrl('/download/' + encodeURIComponent(result.checklist_file.split('/').pop()))}>
                  <ArrowDownToLine size={16} /> Download checklist
                </a>
              )}
            </div>

            <div className="results-grid">
              <article className="result-panel score-panel">
                <div className="score-copy">
                  <p className="result-label">TEXTUAL OVERLAP</p>
                  <h3>Match score</h3>
                  <p className="result-note">A useful signal, not a hiring verdict.</p>
                </div>
                <div className="score-ring" style={{ '--score': `${Math.round(result.match_score * 100)}%` }} role="img" aria-label={`${Math.round(result.match_score * 100)} percent text match`}>
                  <span>{Math.round(result.match_score * 100)}<small>%</small></span>
                </div>
              </article>

              <article className="result-panel suggestions-panel">
                <div className="panel-heading">
                  <div><p className="result-label">BRING FORWARD</p><h3>Skills to highlight</h3></div>
                  <span className="count-badge">{result.suggestions?.length || 0}</span>
                </div>
                {result.suggestions?.length ? (
                  <ul className="suggestion-list">
                    {result.suggestions.map((suggestion, index) => <li key={`${suggestion}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{suggestion}</li>)}
                  </ul>
                ) : <p className="empty-result">Your resume already covers the main terms found in this description.</p>}
              </article>

              <article className="result-panel questions-panel">
                <div className="panel-heading">
                  <div><p className="result-label">PREPARE YOUR STORY</p><h3>Interview prompts</h3></div>
                  {result.model_used && <span className="model-badge">{result.model_used}</span>}
                </div>
                <ol className="question-list">
                  {result.interview_questions?.map((question, index) => <li key={`${question}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><p>{question}</p></li>)}
                </ol>
              </article>
            </div>
            <p className="results-footnote"><ShieldCheck size={14} /> Match score measures text similarity. Review suggestions against your real experience.</p>
          </section>
        )}

        <footer className="page-footer">
          <span>INSIGHTIFY <i /> A sharper read on your next role.</span>
          <span>PDF & TXT · Local text analysis</span>
        </footer>
      </main>
    </div>
  )
}
