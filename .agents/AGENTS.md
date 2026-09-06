# Pocket Gull Workspace Rules

## Node.js Version
- **Strict Requirement**: Use **Node.js v24.x** for all local development, testing, and CI/CD pipelines. This is configured in `.node-version`, `.nvmrc`, and root `package.json` (`engines`).

## Package Overrides (esbuild Version Mismatch Workaround)
- To prevent version mismatch crashes with `esbuild` in the monorepo workspace environment, `esbuild` version overrides are structured as follows:
  - **Global default override**: Set `esbuild` (and all platform binaries `@esbuild/*`) to `0.27.2`.
  - **Angular CLI specific override**: Override `esbuild` (and all platform-specific `@esbuild/*` binaries) to `0.28.1` specifically under `@angular/build` and `@angular-devkit/build-angular`.
  - **Astro Promotion**: `astro` and `@astrojs/mdx` are included as direct root devDependencies to ensure their transitive `esbuild` dependencies are correctly caught by the root context overrides, bypassing npm workspace link boundary resolution bugs.
- **Note**: Do not modify these overrides without full regression testing of both the Angular build and the Astro `docs-study` workspace build.

## Python / FastAPI Standards
- **Formatting & Linting**: Adhere to PEP-8 standards. Use **`ruff`** for linting/import sorting and **`black`** (88-character max line length) for code formatting.
- **Pydantic Validation**: All request and response models in `pocketgull_api` sidecars MUST be strictly typed using Pydantic v2 `BaseModel` classes. Avoid returning raw dictionaries or untyped `Any`. Use `pydantic.Field` for numeric constraints, defaults, and API field descriptions.
- **Async & Event Loop Hygiene**: Use `async def` for non-blocking I/O route handlers (`httpx`, async DB calls) and standard synchronous `def` for CPU-bound matrix/ML computations (`scikit-learn`, `numpy`) so FastAPI automatically dispatches them to the thread pool without blocking the main event loop.
- **Structured Logging & Error Handling**: Mask internal exceptions by throwing `fastapi.HTTPException` with explicit HTTP status codes and structured detail payloads (`detail={"code": ..., "message": ...}`). Avoid `print()`; use standard `logging` or `structlog` to ensure GCP stdout ingestion parses log levels (`INFO`, `WARNING`, `ERROR`) cleanly.
- **Docstring Conventions**: Use Google Style docstrings for all complex scoring methods, ML pipelines, and public service functions.

## Ruby / Rails & Gems Standards
- **Ruby Version**: Require **Ruby 3.3.x+** with YJIT enabled for all Rails engines and micro-gems (`pocketgull-fhir-rails`, `pocketgull-ruby`).
- **Linting & Code Quality**: Use **`rubocop`** with `rubocop-rails` and `rubocop-performance`. Enforce zero-offense passes before PR submission.
- **Rails Engine Isolation**: All Rails engines MUST be strictly namespaced under `module Pocketgull` (e.g., `Pocketgull::Fhir::Rails::Engine`). Prevent global constant leakage into host applications.
- **Dependency Hygiene**: Gemspecs MUST use explicit version constraints (`~>`) and avoid un-pinned open dependencies. Prefer standard library (`net/http`, `json`, `uri`) over external gems wherever practical.
- **Environment Isolation**: Strictly separate real clinical API calls from mock/test stubs using `Rails.env.test?` and `ENV['POCKETGULL_LIVE_DEMO']`. Never execute live external OAuth endpoints in test suites.
- **Testing**: Use **`Minitest`** or **`RSpec`** with `WebMock` / `VCR` for all HTTP & ActionCable WebSocket channel testing.
- **Containerization**: Always use **Alpine Linux (`ruby:3.3-alpine`)** for Docker builds to maintain zero base-OS vulnerabilities and low memory footprints on AWS App Runner / ECS Fargate.

## Flutter / Dart Architecture & Scripting Standard
- **Prefer Dart Over Python for Standalone Utilities (Randal L. Schwartz Standard)**: When generating one-off scripts, automation tools, FHIR/JSON batch transformations, or data-processing utilities where the language is not explicitly constrained, prefer **Dart** (`dart run script.dart`) over Python. Dart provides zero virtualenv friction, a batteries-included standard library (`dart:io`, `dart:convert`, `dart:async`), sound static typing with Dart 3 pattern matching, and predictable single-threaded asynchrony without event-loop deadlocks.
- **State Management**: Use **Riverpod** for state management across the `pocketgull_flutter` companion app. Avoid `setState` for complex business logic.
- **Widget Composability**: Keep widget classes small and focused. Extract deeply nested UI trees into standalone, reusable, stateless widgets.
- **Null Safety**: Strict null safety must be maintained at all times.

## Commit Message Convention
- **Format**: Follow the **Conventional Commits** specification strictly: `<type>(<scope>): <description>`
- **Types**: `feat`, `fix`, `docs`, `test`, `security`, `chore`, `refactor`, `perf`, `style`, `ci`, `build`
- **Scope**: Use a bracketed category tag that identifies the sub-system. Common scopes include:
  - `ui`, `ux`, `layout`, `theme`, `print` — Frontend visual changes
  - `ai`, `gemini`, `adk`, `voice` — AI and voice integration
  - `clinical`, `fhir`, `intake`, `triage` — Clinical intelligence and data
  - `server`, `ssr`, `api` — Backend / Express / SSR
  - `flutter`, `dart`, `mobile` — Flutter companion apps
  - `python`, `ml`, `sidecar` — Python FastAPI sidecar
  - `security`, `csp`, `codeql`, `hipaa` — Security hardening
  - `ci`, `cd`, `docker`, `deploy`, `cloudrun` — CI/CD and infrastructure
  - `demo`, `mock` — Demo mode and mock data
  - `e2e`, `playwright`, `test` — Testing
  - `three`, `anatomy`, `3d` — Three.js anatomy viewer
  - `sentinel`, `companion` — Sentinel triage and companion apps
  - `types`, `build`, `deps` — TypeScript types, build config, dependencies
- **Subject line rules**:
  - **STRICT MAX LENGTH**: Must be **72 characters or fewer** (including `type(scope): ` prefix). Husky `commit-msg` hook strictly rejects subjects over 72 characters.
  - Use imperative mood ("add", "fix", "remove", not "added", "fixes", "removed")
  - Do NOT capitalize the first letter of the description
  - No period at the end
- **Body** (optional): If the diff is non-trivial, add a blank line after the subject, then a concise body explaining *why* the change was made, not *what* (the diff shows what). Wrap at 80 characters. Move extra details here if the subject would exceed 72 characters.
- **Breaking changes**: Prefix the body with `BREAKING CHANGE:` if the commit introduces breaking changes.

## FHIR R4 Compliance
- **Data Serialization**: Anytime patient data (symptoms, history, conditions) is serialized, exported, or passed across API boundaries, the payload MUST strictly conform to the **FHIR R4 Bundle** standard.
- **Sanitization**: All incoming/outgoing string data must be sanitized using DOMPurify before being stored or rendered to ensure HIPAA-compatible privacy and security.

## GCP Cloud Cost & Storage Lifecycle Standards
- **Cloud Project Target**: All deployments MUST target the `gen-lang-client-0540208645` Google Cloud project.
- **Cloud Run Scaling**: Ensure all Cloud Run microservices scale to 0 (`minScale: 0`) when idle to eliminate baseline computing charges.
- **Artifact Registry & GCS Pruning**: Retain a 7-day cleanup policy (`olderThan: 604800s`, `keepCount: 3`) on Artifact Registry repositories (`cloud-run-source-deploy`, `gcr.io`) and GCS source buckets (`gs://run-sources-*`) to cap artifact storage usage at ~2–4 GB ($0.20/mo) and prevent unpruned build accumulation.

## Default Node & TypeScript Commands
- **Strict Requirement**: Always use the explicit project Node module paths for typechecking and builds to prevent PATH resolution mismatches:
  - **TypeScript Typecheck**: `node c:\Users\philg\Pocketgull\pocketgull\node_modules\typescript\lib\tsc.js -p c:\Users\philg\Pocketgull\pocketgull\tsconfig.json --noEmit`
  - **Angular Build**: `node c:\Users\philg\Pocketgull\pocketgull\node_modules\@angular\cli\bin\ng.js build`

## AI Coding Hygiene & Continuous Cleanup
- **End-of-Session Pruning**: Before wrapping up features or releases, proactively purge unused imports, delete unreferenced dead code, merge duplicate helper functions, and remove commented-out blocks.
- **Secret & Egress Boundaries**: Never commit API keys or credentials. Ensure `.env*` is strictly matched in `.gitignore`, and verify all external domains with `Sentinel Security Guard`.

## Gemini Safety Filter Policy (Clinical CDS)
- **Canonical Reference**: `SECURITY.md §2` documents the full policy. All Genkit flows in `src/server/genkit.ts` reference this section.
- **DANGEROUS_CONTENT = `OFF`**: Clinical text routinely discusses drug dosages, toxic exposures, overdose management, suicidal ideation screening (PHQ-9/C-SSRS), and trauma. Any threshold above `OFF` produces false-positive blocking on standard-of-care care plans.
- **Imaging & OCR Flows = All `OFF`**: Medical imaging (X-rays, dermatology, wound assessment) and clinical document OCR require fully permissive safety settings across all categories.
- **HARASSMENT & HATE_SPEECH = `BLOCK_ONLY_HIGH`**: Retained as baseline protection; rarely triggered by clinical text.
- **SEXUALLY_EXPLICIT = `BLOCK_ONLY_HIGH`** (text flows) / **`OFF`** (imaging flows): Permits OB/GYN, STI, and reproductive health content.
- **Do NOT revert to `BLOCK_LOW_AND_ABOVE` or `BLOCK_MEDIUM_AND_ABOVE`**: These thresholds silently block legitimate medical content and were the root cause of the Cognitive Localization translation failure.

## NN/g (Nielsen Norman Group) Usability & Accessibility Standards
- **Form Accessibility**: All input components MUST include explicit `[attr.aria-describedby]` error/hint linking, `[attr.aria-invalid]`, and 44px+ touch target hitboxes (Fitts's Law).
- **System Status Visibility**: Telemetry badges and connection state indicators MUST provide instant visual feedback without layout shifts.
- **User Freedom & Exit Vectors**: Read-only or historical review states MUST display prominent, un-missable exit banners (e.g., `"Return to Current State"`).

## HIPAA Safe Harbor Patient De-Identification Policy
- **Demographic Archetypes**: Mock and test patient profiles MUST be de-identified using HIPAA §164.514 Safe Harbor standards (e.g., `Homo Sapiens (Female, Neurological, 34y)` or `Pongo Pygmaeus (Orangutan Comparative Model)`).
- **Historical Legacies**: Preserve named historical/scientific luminaries who dedicated their lives to science (Curie, Darwin, Kahlo, Ramanujan, Smith, Pauling, Gear).

## Biophysical PBR Substrates & Unbiased Cryptography
- **Edwin Smith Surgical Codex**: Describe 3D WebGL PBR texture maps using Edwin Smith III's empirical surgical codex biophysical descriptions.
- **Unbiased Cryptographic Floats**: When generating random floats from cryptographic entropy, use the 53-bit IEEE-754 mantissa formula `(high * 4294967296.0 + low) / 9007199254740992.0` to eliminate modulo bias.

## CI/CD Pipeline & GitHub Security Guardrails
- **System Dependencies & Harden Runner**: Any workflow job installing Python packages with C extensions (e.g. `h5py` requiring `libhdf5-dev`) MUST set `disable-sudo: false` in `step-security/harden-runner` and include `sudo apt-get update && sudo apt-get install -y libhdf5-dev`.
- **CodeQL Taint Chain Patterning**: Never rely on legacy `lgtm[]` comments. Break taint chains structurally:
  - *System Prompt Injection*: Keep `systemInstruction` strictly static (`BASE_CLINICAL_PROMPT`). Pass sanitized user directives as a `[CLINICAL DIRECTIVE CONTEXT]` prefix in the user content array.
  - *Network Data Writes*: Validate binary header magic bytes (e.g., `0x00 0x01 0x00 0x00` for TTF) and copy to a new `Buffer.alloc()` before writing to disk.
  - *Log Injection*: Destructure explicit primitive fields into a new typed object and stringify instead of logging raw `req.body` objects directly.
- **Playwright E2E Test Setup**: All E2E test suites MUST call `await enterDemoMode(page)` in `beforeEach` after `setupE2ePage(page)` to ensure the app navigates away from `about:blank`, unlocks the splash screen, and renders DOM elements before querying attributes or clicking buttons. Use case-insensitive locators (`text=/.../i`) for text matching.
- **Monorepo Docker Context**: The root `Dockerfile` MUST copy all package manifests across all workspaces (`COPY docs/study/package*.json ./docs/study/`, `COPY companion-apps/avs-therapy/package*.json ./companion-apps/avs-therapy/`, `COPY pocketgull_api/package*.json ./pocketgull_api/`) and run `npm install --legacy-peer-deps --workspaces`.
- **PR vs. Release Isolation**: Production release workflows (`release.yml`) MUST enforce `if: github.event_name != 'pull_request'` at the job level so GHCR package pushes and SLSA attestations trigger only on `main` branch pushes or release tags (`v*`).
- **Portable Script Paths**: All scripts in `package.json` and `scripts/` MUST use relative paths (`./run-playwright.cjs`, `process.cwd()`) — never hardcoded local machine paths (`c:/Users/philg/...`).

## Subagent Delegation & Escalation Protocol
Agents MUST delegate specialized and compute/context-heavy tasks according to the following matrix:

| Subagent Role | Type / Name | Trigger Conditions & Responsibilities | Boundary & Anti-Pattern |
| :--- | :--- | :--- | :--- |
| **Broad Research & Log Surveys** | `research` | • Scanning or grepping >5 files.<br>• Reading multi-hundred line log/transcript files.<br>• Investigating 3rd-party library internals or external docs. | **Read-Only**: Must NEVER attempt file writes or execution. Must return structured syntheses to the primary agent in a single turn. |
| **Experimental & Invasive Changes** | `self` (branch) | • High-risk architectural refactors.<br>• Multi-file migrations where rollback may be necessary.<br>• Testing breaking dependency updates. | Use `Workspace: "branch"`. Isolate changes until hermetic build verification passes. |
| **Clinical, FHIR & Epistemology Audit** | `clinical-auditor` | • Any modification to patient state signals, PHQ/GAD/C-SSRS clinical scoring, or FHIR R4 schema serialization.<br>• Ensuring HIPAA §164.514 Safe Harbor de-identification.<br>• Cochrane Risk of Bias & $H_0$ p-value verification. | Must be invoked before merging or completing PRs with clinical CDS touchpoints. |
| **SWE Architecture & Code Review** | `swe-code-reviewer` | • New Angular 22 standalone component additions.<br>• Angular Signal reactive graph design reviews.<br>• Hyrum's Law & Google SWE Book conformance audits. | Verifies single-directional reactive data flow and zero memory leaks. |
| **Accessibility & Mobile Review** | `flutter_a11y_agent` | • Touch target size validation (<44px hitboxes strictly flagged).<br>• WCAG AAA contrast audits against dark obsidian backgrounds.<br>• ARIA state binding (`[attr.aria-describedby]`, `[attr.aria-invalid]`). | Required for all public-facing UI and mobile screen components. |
| **K8s & Cloud FinOps Guard** | `k8s-infra-guard` | • Any modification to `k8s/` manifests, `charts/pocketgull/` Helm values, or Agones fleet scaling.<br>• Enforcing `minReplicas: 0` scale-to-zero.<br>• Hardened non-root security contexts and CNCF compliance. | Must run `.agents/skills/gke-finops-optimizer/scripts/audit_k8s_finops.py` to ensure 100% compliance. |
| **Typefoundry & Vector Engineering** | `typefoundry-engineer` | • OpenType font binary inspection, UPM grid calibration, and TrueType bytecode verification.<br>• Generating 300 DPI master print specimen plates (Triad).<br>• Running OTS / Google Fonts preflight tests. | Must enforce 1000 UPM grid, 0 duplicate nodes, and zero composite glyphs. |
| **Multi-Script & Sovereign Linguistics** | `multi-script-linguist` | • Authoring phonological matrices and glyph mapping specs.<br>• Verifying rotational symmetry and diacritic elevation clearance (UCAS / Duployan).<br>• Enforcing UAX #9 BiDi numeric dosage isolation. | Prohibits un-grounded phonetic distortion or cultural appropriation. |

### Subagent Escalation Invariants:
1. **Single-Turn Synthesis**: Subagents must return actionable conclusions, verified diffs, or structured findings in a single response. Prohibit multi-turn ping-pong loops between subagents.
2. **Context Isolation**: Never pass raw multi-megabyte log files directly to parent context. Have the subagent extract only the exact failing lines and stack traces.

## Hermetic Verification & Proof-of-Work Invariants
Never declare a task resolved, a bug fixed, or a refactor complete based solely on code edits. Every change requires empirical proof:

### 1. Mandatory Terminal Proof Chain
Before concluding any implementation turn, execute the explicit workspace commands:
- **TypeScript Typecheck**:
  ```powershell
  node c:\Users\philg\Pocketgull\pocketgull\node_modules\typescript\lib\tsc.js -p c:\Users\philg\Pocketgull\pocketgull\tsconfig.json --noEmit
  ```
- **Angular Production Build**:
  ```powershell
  node c:\Users\philg\Pocketgull\pocketgull\node_modules\@angular\cli\bin\ng.js build
  ```
- **Unit Test Suite**:
  ```powershell
  npm test -- --run
  ```

### 2. Self-Healing Protocol
- If a build or typecheck fails, inspect the un-truncated compiler diagnostic.
- Fix root causes directly at the type and interface definitions; do not cast to `any` or suppress errors with `@ts-ignore` unless explicitly authorized.
- Never bypass git pre-commit hooks using `--no-verify`.
- Maintain peer dependency traceability: When updating root overrides, verify peer dependencies using `npm view <package> dependencies`.

## Context & Token Hygiene Protocols
To prevent context window degradation, attention drift, and token exhaustion:
1. **Search-First Paradigm**:
   - NEVER call `view_file` on large (>300 line) files without prior targeted search.
   - Use `grep_search` to pinpoint exact line numbers, then view bounded line ranges (max 100–150 lines per chunk).
2. **Ephemeral File Hygiene**:
   - Place scratch data, temporary JSON transformations, and one-off debug scripts strictly inside `<appDataDir>\brain\<conversation-id>/scratch/`.
   - Proactively delete or prune intermediate artifacts before session completion.
3. **Structured Response Economy**:
   - Keep conversational commentary concise, high-signal, and linked to concrete workspace symbols.
   - Provide clickable file links using GitHub-style markdown: `[file.ts](file:///absolute/path/file.ts)`.

## Data Science & ML Competition Engineering Standards
1. **Leak-Free Cross-Validation Anchoring (`GroupKFold`)**: In medical imaging datasets where patients have multiple series/scans, group splits strictly by `patient_id` using `GroupKFold(n_splits=5)` to prevent patient-feature leakage between train and validation splits.
2. **Empirical Pipeline Verification (Numerical Proof First)**: Never claim an architecture edit or post-processing pipeline works based on intuition alone. Record Out-of-Fold (OOF) metric progression at every stage.
3. **Experiment Tracking & Model Hashing (`MLflow` / `W&B` / `git` SHA)**: Log seed, git commit SHA, exact hyperparameters, and OOF target scores for every run. Save weights named by OOF score (e.g. `convnext_large_fold0_auc0.942.pt`).
4. **Asymmetric Loss (ASL) for Specificity & Class Imbalance**: Use Asymmetric Loss with $\gamma_- = 4.0, \gamma_+ = 1.0, \text{clip} = 0.05$ for sparse multi-label targets to focus gradient updates on hard positive abnormalities.
5. **Anatomical Co-Occurrence Prior Calibration**: Build an empirical target co-occurrence matrix $M_{ij} = \mathbb{P}(\text{Target}_j \mid \text{Target}_i)$ and calibrate predicted probabilities using Bayesian prior smoothing.
6. **Diversity Ensembling & 2nd-Level Meta-Stacking**: Train 2nd-level Gradient Boosted Trees (LightGBM/XGBoost) on Out-of-Fold predictions from diverse backbones (ConvNeXt + Swin + mDeBERTa).
7. **Nelder-Mead Target-Specific Threshold Optimization**: Use Nelder-Mead optimization to tune target decision thresholds $\tau_1, \tau_2, \dots, \tau_K$ on OOF predictions rather than using default $0.50$.
8. **Sub-Second Efficiency Latency Optimization**: For competition efficiency tracks, sample 8 central key slices, export PyTorch models to ONNX Runtime with FP16, and use multi-threaded asynchronous DICOM I/O pools.
9. **Semantic Versioning (`SemVer v1.0.0`) & Clean Identifiers**: Protect competitive edge by using clean, standardized public version tags without exposing internal proprietary recipe names on public leaderboards.
10. **Continuous Automated Verification (`vitest` / `pytest`)**: Write automated unit tests covering preprocessors, matrix math formulas, and DICOM tensor transformations across edge cases (empty text reports, missing headers, NaNs).
11. **Kaggle Code Competition Submission Protocol & Zero-Crash Rules**:
    - **Hardware & Accelerator Conformance**: Use `enable_gpu: false` (CPU mode) or explicit T4 GPU settings (`gpu_t4`). NEVER use un-gated GPU settings that default to P100 GPUs, which are prohibited by competition submission rules.
    - **Immediate Baseline Disk Output**: Always write a baseline `submission.csv` to disk at the very beginning of the submission cell *before* starting any ML inference loop.
    - **Defensive Symbol & Engine Guards**: Wrap imports in `try-except` blocks and check `if 'engine' in globals() and engine is not None:` before calling inference methods to prevent unhandled `NameError` crashes.
    - **ASCII Terminal Hygiene**: Use plain text status tags (`[OK]`, `[WARN]`) instead of non-ASCII emojis (`✅`, `⚠️`) in notebook `print()` calls to prevent Papermill `UnicodeEncodeError` failures.
    - **In-Place Schema Preservation**: Load candidate `sample_submission.csv` directly, modify target columns in-place, format floats with `float_format='%.6f'`, and preserve exact row index order.
    - **Memory Hygiene**: Call `gc.collect()` and `torch.cuda.empty_cache()` every 100 studies to prevent RAM/CUDA OOM during hidden test evaluation.
12. **Kaggle Tagging & Platform Asset Governance (March 2026 Guidelines Compliance)**:
    - **Synthetic Dataset Tagging Mandatory**: Per Kaggle's Synthetic Dataset Etiquette, any dataset containing partially or fully synthetic clinical consult vectors or LLM-generated weak labels MUST include the `synthetic` tag.
    - **Standardized Tag Taxonomy**: All published Kaggle models, datasets, utility scripts, and notebooks MUST import and utilize `get_standard_tags()` from `scripts/kaggle_tags.py` to enforce unified metadata tags (`CLINICAL_TAGS`, `AI_ML_TAGS`, `PROJECT_TAGS`).
    - **Usability 10 Checklist**: Every published Model Hub entry or Dataset MUST generate complete `model-metadata.json` / `dataset-metadata.json` containing explicit data dictionaries, open source licenses (`Apache 2.0` / `CC-BY-4.0`), and HIPAA §164.514(b)(2) Safe Harbor verification to maintain a perfect 10/10 usability rating.
    - **Zero Spam & Self-Promotion**: Strictly prohibit upvote begging, off-topic self-promotion, plagiarism, or attaching unrelated datasets/models to notebooks. All shared work must provide genuine educational, research, or competition modeling value.

## Anti-Surveillance & Ephemeral Data Sovereignty Standards
- **Default to Edge Computation**: All real-time telemetry calculations, biophysical equations, and clinical symptom classifications MUST run locally on the client device via WebAssembly (WASM), WebGPU, or client-side Web Workers (`OfflineEdgeAiService`). External API calls are reserved for explicit, user-initiated AI consults.
- **Prohibition of Third-Party Trackers**: Zero third-party analytics pixels, fingerprinting scripts, or passive telemetry pingers (Google Analytics, Segment, Mixpanel, Meta Pixel) are permitted.
- **Explicit Opt-In Telemetry**: All network operations require deliberate, user-initiated actions. Passive background harvesting of location, mic audio, or user keystrokes is strictly prohibited.
- **1-Click Ephemeral State Purging**: All active clinical state MUST be stored in ephemeral Angular Signals and transient local storage, with 1-click state purging capabilities (`purgeTransientPatientState`).

## Skeptical Epistemology & Falsifiability Standards
- **Popperian Null-Hypothesis ($H_0$) Testing**: Every clinical or biophysical metric evaluation MUST compute $p$-values against population baseline means (`SkepticalEpistemologyService`). Any observation where $p \ge 0.05$ MUST trigger an explicit `skepticalWarningNotice` disclosing that the finding cannot reject the null hypothesis.
- **Cochrane Risk of Bias (RoB 2)**: All literature references and clinical citations MUST incorporate explicit Cochrane Risk of Bias assessments across randomization, intervention deviation, missing data, and measurement bias.
- **Evidence Hierarchy Demarcation**: Clinical recommendations MUST be explicitly tagged with evidence tiers (`Level A (RCTs)`, `Level B (Cohort)`, or `Level C (Expert Consensus / Plausibility)`) to prevent uncritical acceptance or science-washing.
- **Socratic Evidence Literacy**: Analysis reports MUST embed interactive Socratic challenges to test user critical reasoning, correlation vs. causation discernment, and publication bias awareness.

## WebMCP Tool & Browser Agent Governance
- **Explicit Tool Contracts**: Every browser tool exposed to AI model contexts MUST be registered via `WebMcpRegistrationService`, declare strict JSON Schema inputs, and provide an explicit `AbortController` cancellation signal.
- **Mandatory Spec Coverage**: Any addition or modification to registered WebMCP tools MUST include corresponding unit tests in `webmcp-registration.service.spec.ts` verifying registration, execution, and error handling.

## Chrome Built-in AI & Gemma 4 Dev Trial Architecture Standards
- **Gemma 4 Prompt API (`#gemma4-for-built-in-ai`)**: Prefer Chrome Built-in AI Prompt API for low-latency client-side clinical summarization and consults with speculative decoding (`samplingMode: 'most-predictable'`).
- **Multimodal Visual Input (`#prompt-api-multimodal-input`)**: Pass canvas/image captures as Blob objects into `ai.languageModel` prompt input arrays for zero cloud transit visual analysis.
- **ISMP Safety Proofreader (`#proofreader-api`)**: Integrate `window.ai.proofreader` / `ai.rewriter` with automated detection for high-risk trailing zeroes (`5.0 mg`) and naked decimals (`.5 mg`).
- **Triage Acuity Classifier (`#classifier-api`)**: Categorize clinical notes with confidence scores into `STAT_EMERGENCY`, `URGENT`, or `ROUTINE`.
- **Zero-Latency Vector Embeddings (`OnDeviceEmbedderService`)**: Use `window.ai.semanticEmbedder` to generate 256-dimensional embeddings with cosine similarity matching for PubMed literature ranking and clinical archetype retrieval.
- **Enterprise Zero-Flag Invariant**: Ensure 100% functionality and zero uncaught exceptions in enterprise environments without experimental flags by providing deterministic local TypeScript fallbacks across all features.

## Institutional Security Triad Governance Standard
- **NIST SP 800-90A CSPRNG Invariant**: All session tokens, OAuth PKCE code verifiers, digital consent signatures, and entity identifiers MUST use CSPRNG OS kernel hardware entropy (`globalThis.crypto.getRandomValues()` / Node.js `node:crypto` `randomBytes`, `randomInt`). `Math.random()` is strictly prohibited in all security, authentication, and ID generation contexts.
- **FDA 21 CFR Part 11 Electronic Records Integrity**: All state modifications, research dividend transactions, and clinical audits MUST generate immutable timestamped SHA-256 digital attestation seals to guarantee full provenance and non-repudiation.
- **HIPAA § 164.312(c)(1) ePHI Data Integrity**: All ePHI payloads, FHIR R4 bundles, and clinical state trees MUST incorporate cryptographic integrity verification to corroborate that clinical data has not been altered or destroyed in an unauthorized manner.

## Microsoft Services Agreement (MSA) & AI Governance Compliance Standard (Effective Sept 30, 2026)
- **Zero Base Model Distillation & Cross-Training (Sec 14.s.iv)**: Under no circumstances may AI service outputs, responses, or metadata from Microsoft-hosted AI endpoints (Copilot, Bing AI, Azure OpenAI) be utilized to train, fine-tune, distill, evaluate, or improve foundation models or competing AI technologies.
- **Prohibition of Emotion Inferencing & Biometric Profiling (Sec 14.s.ix.6, Sec 14.s.ix.9)**: Code, agents, and pipelines MUST NEVER attempt to infer emotional states (e.g., anger, fear, sadness, happiness) or deduce protected demographic/biometric categories from voice pitch, facial geometry, keystroke dynamics, or video streams. Spoken audio is strictly a communication channel, not an affective classifier.
- **Mandatory Human-in-the-Loop for High-Impact CDS (Sec 14.s.ix.1)**: Autonomous, un-gated decision-making that affects legal status, healthcare treatment plans, life opportunities, or financial standing is strictly prohibited. All AI-generated Clinical Decision Support (CDS) outputs MUST mandate affirmative clinician review and digital cryptographic attestation before order commitment.
- **Content Credentials & C2PA Provenance Preservation (Sec 14.s.vii)**: Generated media, diagrams, or clinical exports containing C2PA provenance manifests, digital watermarks, or cryptographic content credentials MUST NOT have these signals stripped, obscured, or manipulated.
- **Clear Health Bot & Medical Device Demarcation (Sec 14.i & Medical Notice)**: Health bot insights, action plans, and wellness summaries MUST be clearly labeled as non-device wellness tools and include the mandatory clinical disclaimer directing users to qualified healthcare providers without replacing professional clinical judgment.
## Fair Play, Radical Transparency & Feature Shipping Invariants
Every new feature, component, API endpoint, or clinical model shipped in Pocket-Gull MUST satisfy the 5-pillar verification checklist before being marked complete:

| Principle | Statutory & Engineering Invariant | Verification Mechanism |
| :--- | :--- | :--- |
| **Accessibility (Local Equity)** | Feature MUST function on low-end hardware, Chromebooks, and constrained networks without requiring a paid cloud API key. | `OfflineEdgeAiService` & deterministic local TypeScript fallbacks (`isAvailable` signal check). |
| **Honesty (Telemetry Disclosure)** | The UI MUST disclose model identity, inference latency (ms), token thinking budget, and certainty score rather than obscuring provenance. | `ClinicalReasoningStreamComponent` & Telemetry Badges (`[⚙️ Local Edge]` vs `[☁️ Gemini 3.7]`). |
| **Falsifiability (Skeptical CDS)** | The system MUST warn clinicians when empirical evidence is weak ($p \ge 0.05$) or risk of bias is high rather than hallucinating false certainty. | `SkepticalEpistemologyService` & `SkepticalEpistemologyHud` ($H_0$ rejection tests). |
| **Interoperability (Zero Lock-In)** | Patient data and clinical plans MUST be exportable in open, standard formats that any competitor, hospital, or open-source EHR can parse. | Universal **HL7 FHIR R4 Bundle** export (`fhir.serializer.ts`) & WebMCP OpenAPI schemas. |
| **Safety Boundary (Human-in-the-Loop)** | High-impact actions, prescriptions, and financial transactions $\ge \$500$ MUST require affirmative clinician review and digital attestation. | FDA CDSR Notice & `MandiantClinicalDefenseService` Dual-Custody M-of-N signatures. |

## Typefoundry Procedural Engineering & Font Tooling Hygiene Standard (Randal L. Schwartz Standard)
- **Directory-Pinned Environment Execution (`uv` Isolation)**: Root and host workspaces do not contain font compiler binaries (`fonttools`, `ots`). All font engineering, binary inspection, and validation commands MUST explicitly specify the typeface directory environment:
  ```powershell
  uv --directory ../pocketgull-typeface run python sources/validate_fonts.py
  ```
- **Dart Raw String Template Invariant**: When generating vector specimens, SVG layouts, or XML documents via Dart scripts (`dart run tool/...`), ALWAYS declare multiline strings using raw template delimiters (`r'''...'''`) or escape every literal dollar sign (`\$`). Unescaped `$` inside standard Dart strings triggers compile-time interpolation crashes.
- **Headless Vector Rasterization (Inkscape CLI)**:
  - Never include SVG `<filter>` tags with `<feDropShadow>` in SVGs intended for headless CLI rasterization (`inkscape --export-filename=...`); headless CLI render engines drop these elements or crash. Use geometric SVG shadow rect primitives.
  - Rely exclusively on fontconfig system font families or explicit path declarations in SVG `@style` blocks.

## Typographic SemVer 2.0.0 & 5-Phase Zero-Tofu Release Protocol
- **SemVer 2.0.0 for Typefoundry Software**:
  - **Major (`X.0.0`)**: Any breaking metric shift altering baseline, UPM (1000), ascenders/descenders (`hhea`, `OS/2`), or advance widths of existing characters causing reflow in existing documents. Also denotes major script tier milestones (e.g. Tier 1 complete).
  - **Minor (`x.Y.0`)**: Purely additive language additions (e.g., Inuktitut `v2.1.0`, Chinuk Pipa `v2.2.0`), new script coverage, or new OpenType features (`ss03`, `dlig`).
  - **Patch (`x.y.Z`)**: Optical vector smoothing, inktrap depth calibrations, kerning pair adjustments, and validator rule updates.
- **The 5-Phase Zero-Tofu Release Gate**:
  1. *Phonological Matrix Definition*: Codify the complete orthography, phoneme mappings, and Unicode block range into `fonts/<lang>_matrix.json`.
  2. *Procedural Vector Synthesis*: Generate TTF contours via parametric physical equations adhering to 1000 UPM grid, 0 duplicate nodes, and integer coordinates.
  3. *34/34 Pre-Flight Verification*: Run `sources/validate_fonts.py` ensuring 100% pass rate across OpenType tables, cmap coverage, and OTS memory safety.
  4. *300 DPI Landmark Architectural Triad*: Produce high-resolution master print plates:
     - Plate 1: *Type Engineering Specimen* (UPM grid, bezier vectors, inktrap optics)
     - Plate 2: *Telemetry Type Specimen* (Dark HUD, biometric telemetry, ISMP disambiguation)
     - Plate 3: *Pedagogical Typeface Plate* (Washi parchment, cultural sovereignty, phonological matrix)
  5. *CERN Zenodo Immutable Archival*: Tag release commit, generate GitHub release asset bundle, and mint/update persistent DOI (`10.5281/zenodo.18882512`).

## Clinical, Typographic & Security Canonical Reference
- For core clinical & ophthalmological standards (LogMAR 0.0, ISMP/FDA dosage disambiguation, WCAG AAA 7:1), Marker font brand boundary, Amazon affiliate egress limits, anti-whaling dual-custody protocols, Tailwind CSS tokens, Five Eyes regulatory mapping, institutional thin-client resilience, and "Tell, Don't Ask" domain encapsulation, refer to the canonical root [GEMINI.md](file:///c:/Users/philg/Pocketgull/pocketgull/GEMINI.md).
- For the cross-disciplinary Gemma 4 On-Device architecture spanning Medicine, Science, Education, and Fast/Slow-Loop agentic engineering, refer to [GEMMA4_EDGE_ARCHITECTURE.md](file:///c:/Users/philg/Pocketgull/pocketgull/docs/GEMMA4_EDGE_ARCHITECTURE.md).


