# Pocket Gull

> Insight beneath the surface.

![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)
![Angular](https://img.shields.io/badge/Angular-v21.1-DD0031?logo=angular)
![Three.js](https://img.shields.io/badge/Three.js-v0.183-000000?logo=three.js)
![Lighthouse 100](https://img.shields.io/badge/Lighthouse-100-brightgreen?logo=lighthouse)
![Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-blue)

> **Note:** This application was created for the purposes of entering the Gemini Live Agent Challenge hackathon.
> **Category:** Live Agents 🗣️ (Real-time Interaction Voice & Visual UI)

![Pocket Gull Dashboard](./docs/images/pocket-gull_dashboard.png)

Pocket Gull streamlines patient intake with an interactive 3D body map and AI-powered clinical intelligence. It empowers practitioners with rapid data visualization and strategy synthesis for proactive care decisions, acting as an interruptible voice-first clinical co-pilot.

**#GeminiLiveAgentChallenge**

---

## Real-Time Clinical Experience

A highly interactive, aesthetically minimal user interface (Industrial Grace) designed for immediate clinical insight.
*For a full demonstration, press the `Demo` button in the top-right of the application to load the patient simulation.*

### Product Highlights

![Dashboard Snapshot](./docs/images/dashboard.png)

![3D Body Viewer](./docs/images/body_viewer.png)

![Inline Agent Chat](./docs/images/inline_chat.webp)

---

## 📃 Text Description

**What it does:**
Pocket Gull is a next-generation "Live Agent" orchestrator. By combining real-time human-in-the-loop web speech interaction with a diagnostic 3D surface model and Gemini's deep reasoning (`gemini-2.5-flash` natively and via `@google/adk`), it processes a patient's multimodal symptom data to instantly produce synthesized, actionable clinical strategies.

**Core Features:**
- **Live AI Consult & Multi-Agent Orchestration:** Powered by `@google/adk` and the Web Speech API. Specialized `LlmAgent` experts synthesize clinical data into actionable insights through an interruptible, natural conversational UI with **context-aware memory** of recently discussed report nodes.
- **Care Plan Recommendation Engine:** A professional clinical analysis engine that synthesizes structured strategies for patient care, organized by diagnostic lenses (Overview, Interventions, Monitoring, Education). Includes **inline agent queries** directly from generated report nodes.
- **Cognition & Child Export Modes:** Seamlessly translate Care Plans into dyslexia-friendly or pediatric formats, outputted to PDF using refined Dieter Rams 'carousel informatics' typography.
- **Printable Clinical Stationery:** CSS Grid-optimized, multi-page physical printouts featuring Halftone body maps for visual pain hotspot diagnosis, with user-selectable toggles for clinical summaries and history.
- **Minimalist Dieter Rams Design:** A premium, minimalist UI prioritizing clarity, neutrality, functional excellence, and seamless mobile responsive layouts (`100dvh`). Includes dark-mode agent conversations.
- **Detailed 3D Medical Imagery:** Precise anatomical selection using a Three.js-powered skeletal and surface model (including detailed procedural spine geometry) with dynamic particle systems highlighting diagnostic severity.
- **Smartwatch & Mobile Optimization:** Responsive Two-Column Grid UI scaling down to extremely constrained viewports (e.g., Pixel Watch 2 at 286px width) for ultra-portable clinical referencing.
- **Scans & Diagnostics Library:** Integrated visual gallery within the patient profile for organizing and analyzing medical imagery (e.g., MRI, X-Rays), complete with dynamic Wikimedia Commons linking.
- **Evidence Focus Iconography:** Custom medical iconography enhancing the interactive Task Bracketing and inline chat systems.
- **Box Breathing UX:** Focused 16-second box breathing visual animations integrated into primary intake text areas to promote practitioner mindfulness.
- **Interactive Task Bracketing:** Rapidly markup generated care plans using a double-click state machine (Normal, Added, Removed) to vet and customize AI recommendations.
- **FHIR-Standard Data Portability & Localized Auto-Save:** Real-time persistence with visual "Saving..." / "Saved ✔" indicators, exported via Unicode-safe Base64 encoded FHIR Bundles.
- **Patient Management System:** Full CRUD capabilities for patient records, including historical visit review and permanent record removal.

**Technologies Used:**
- **Framework:** Angular v21.1 (Signals-based, Zoneless), Server-Side Rendering (SSR) & Client-Side Hydration
- **Visualization:** Three.js (3D Anatomical Modeling)
- **Intelligence:** Google GenAI SDK (`gemini-2.5-flash`) & Google Agent Development Kit (`@google/adk`)
- **Research Integrations:** Google Programmable Search Engine (CSE) & NIH PubMed E-utilities
- **Export Engine:** jsPDF & FHIR Bundle standard
- **Styling:** Tailwind CSS & Dieter Rams Design System
- **Speech Control:** Web Speech API (Bi-directional voice interaction)
- **Deployment & Infrastructure:** Google Cloud Run, Express.js Backend

**Data Sources:**
Primary inputs consist of manual demographics, biometric body map interaction, and voice-to-text dictation. Auxiliary real-time clinical context is gathered securely without persistent DB tracking using Google Programmable Search Engine API and NCBI PubMed E-utilities XML parsing algorithms. Patient state data is strictly locally persisted between active sessions.

**Findings and Learnings:**
Reflecting on the development of Pocket Gull, my commitment is to continuously embrace the complexity of multi-agent architectures and rigorous frontend performance optimization. Building this platform taught me the profound importance of balancing bleeding-edge AI orchestration—like implementing `@google/adk`'s `InMemoryRunner` to stabilize clinical generations—with the strict UX demands of a modern progressive web application. I commit to changing how I approach state management in future projects by prioritizing granular, reactive UI signals from day one, and to never settle for "good enough" when a top-tier mobile performance score (100/100 Lighthouse) is attainable through diligent layout unblocking and dynamic asset loading. Further, this project deepened my respect for CSS—from mastering viewport units (`100dvh`) to restore native scrolling on complex mobile constraints, to implementing robust `@media print` rules for structured offline clinical stationery.

---

## 👨‍💻 Public Code Repository & Spin-Up Instructions

**Developer Profile:** [g.dev/philgear](https://g.dev/philgear)  
**Repository:** [github.com/philgear/pocket-gull](https://github.com/philgear/pocket-gull)

To run this project in a local development environment:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/philgear/pocket-gull.git
    cd pocket-gull
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Preview Production Build:**
    ```bash
    npm run build
    npm run preview
    ```

---

## 🖥️ Proof of Google Cloud Deployment

Pocket Gull's backend service and Express proxy layer is architecturally designed to deploy directly to **Google Cloud Run**.

- **Proof of Action:** Successfully deployed to Google Cloud Run! The live application is available at: [https://pocketgull.app](https://pocketgull.app) (and [https://pocket-gall-444980566010.us-west1.run.app](https://pocket-gall-444980566010.us-west1.run.app))
- **Repository Proof:** See `./server.js` and `./src/services/clinical-intelligence.service.ts` for Google Cloud infrastructure integrations.

---

## 🏗️ Architecture Diagram

The application leverages a modern, reactive architecture utilizing Angular Signals, Cloud Run orchestration, and the Google GenAI API stack. *(Note: This conceptual map is available in high resolution within the hackathon image carousel.)*

```mermaid
graph TD
    User[Doctor/User] -->|HTTPS| CloudRun[Google Cloud Run Hosting]
    CloudRun -->|Serves| UI[Angular Frontend]
    CloudRun -->|Hosts| Backend[Express.js Server]
    
    subgraph "Clinical Data Layer"
        UI -->|Selects Body Part| BodyMap[BodyViewer Component]
        UI -->|Enters Data| Intake[IntakeForm Component]
        UI -->|Requests Analysis| Analysis[Analysis Component]
        UI -->|Dictates Notes| Dictation[Dictation Service]
        
        BodyMap -->|Updates| State[PatientState Service]
        Intake -->|Updates| State
        Dictation -->|Updates| Intake
        
        State -->|Uses Centralized Types| Types[patient.types.ts]
        Analysis -->|Reads| State
        Analysis -->|Invokes| AdkRunner[ADK InMemoryRunner]
    end

    subgraph "Persistence & Portability"
        State -->|Persists| PM[Patient Management]
        PM -->|Exports/Imports| FHIR[FHIR Bundle / PDF]
    end
    
    subgraph "AI Core & Integrations"
        AdkRunner -->|Orchestrates| Agents[Specialized LlmAgents]
        Agents -->|Generate Content| Flash[Gemini 2.5 Flash]
        Backend -->|Proxy Request| PubMedProxy["/api/pubmed Endpoint"]
        Backend -->|Static Serve| GoogleSearch["search.html"]
        PubMedProxy -->|E-utilities API| NCBI[NCBI PubMed]
        GoogleSearch -->|CSE API| Google[Google Programmable Search]
    end
    
    UI -->|Iframe Message| GoogleSearch
    UI -->|API Call| PubMedProxy
    Flash -->|Returns Partial JSON| Agents
    Agents -->|Streams JSON| AdkRunner
    AdkRunner -->|Yields Chunks| Analysis
    NCBI -->|XML to JSON| PubMedProxy
    PubMedProxy -->|Search Results| UI
    Google -->|Search Results| GoogleSearch
    GoogleSearch -->|postMessage| UI
```

---

## 📹 Demonstration Video

---

## 🌱 Kaizen Philosophy

Pocket Gull is built on the **Kaizen** principle of *continuous, incremental improvement*. We believe that clinical tools should never be "finished," but rather evolve alongside the practitioners who use them.

- **Incremental Intelligence**: Every clinical analysis is a baseline for refinement. We use interactive bracketing to allow doctors to continuously improve the AI's output.
- **Iterative Design**: Our UI is constantly polished to reduce cognitive load, ensuring that every pixel serves a clinical purpose.
- **Evolving Integration**: We prioritize high-integrity manual data handling today while continuously building the bridges for automated, high-privacy biometric telemetry tomorrow.

---

## 🗂️ Data Card

Understanding how clinical information flows through Pocket Gull is critical for building practitioner trust.

**Data Type & Processing:**
Pocket Gull operates as a localized Clinical Data processor. It does not train core foundation models on user data. The primary data inputs include:
- **Patient Intake:** Demographics, chief complaints, and historical medical notes entered manually or via Web Speech recognition.
- **Biometric Selection:** Anatomical regions pinpointed interactively via the 3D body map viewer.
- **Vitals & Telemetry:** Standard health metrics (Heart rate, Blood pressure, SpO2).

**Medical Data Sources:**
To augment clinical reasoning without compromising patient privacy, Pocket Gull integrates with external authoritative semantic data sources:
- **NCBI PubMed E-utilities:** Queries peer-reviewed medical literature and abstracts for evidence-based context.
- **Google Programmable Search Engine API:** Surfaces relevant differential diagnostic information and treatment pathways from indexed medical domains.
*(Note: Queries sent to these external sources are anonymized and stripped of protected health information [PHI] prior to transmission.)*

**Data Storage & Privacy:**
- **Local Persistence:** All patient states, clinical brackets, and historical visit notes are stored strictly within the client's local session.
- **No Remote Database:** There is no centralized remote database storing persistent patient records.
- **AI Processing:** Selected clinical context is transmitted securely to the Gemini API (`gemini-2.5-flash`) and specialized `@google/adk` agent orchestrators via transient inference requests. Data is used solely for immediate generation of the clinical summary and is not retained by the application backend for training.

**Data Export & Portability:**
- **FHIR Bundles:** Users can export explicit JSON blobs representing standard FHIR patient state formats, encouraging open data portability.
- **Printable Stationery:** Generated insights can be physically printed via CSS-optimized layouts featuring Halftone diagnostic maps, ensuring sensitive records can be kept strictly on offline paper when required.

---

## 🌍 Impact Statement

### Societal Impact Statement: Pocket Gull & AI-Augmented Clinical Strategy

**Overview**  
Pocket Gull is designed to transform the initial clinical encounter by shifting the burden of data synthesis from the physician to an AI-augmented workflow. By evolving generic medical analysis into a "Care Plan Recommendation Engine," the platform aims to reclaim clinical time for direct patient interaction, ultimately strengthening the doctor-patient relationship through increased presence and empathy.

**Societal and Ethical Implications**
- **Autonomy and Dignity**: The platform prioritizes physician autonomy by acting as a "Live Consult" co-pilot rather than an automated decision-maker. Interactive "Task Bracketing" ensures that every medical recommendation is manually vetted and adjusted by a human clinician.
- **Fairness and Community Well-being**: By streamlining complex data ingestion—vitals, history, and chief complaint—Pocket Gull reduces the cognitive load on healthcare providers, mitigating physician burnout.
- **Data Integrity**: The commitment to FHIR standards ensures that patient data remains portable, interoperable, and owned by the clinical institution, preventing proprietary data silos.

**Environmental Impact**  
By facilitating rapid, data-driven synthesis in a paperless environment, Pocket Gull promotes resource efficiency within clinics. The use of efficient models (Gemini Flash) ensures that the computational footprint remains optimized for sustainable growth.

---

## 🤖 Responsible AI Statement

Pocket Gull is built with a firm commitment to the responsible development and deployment of AI in clinical settings. The following principles guide every design and engineering decision on this platform:

**Human-in-the-Loop Oversight**  
Pocket Gull is a clinical *co-pilot*, not an autonomous decision-maker. Every AI-generated insight, care plan recommendation, or synthesized summary is explicitly presented as a draft for physician review. The interactive "Task Bracketing" system ensures that no recommendation can be acted upon without deliberate, manual clinician validation.

**Transparency & Explainability**  
The application clearly surfaces which data points (vitals, chief complaint, annotated body regions, medical history) were used to construct each recommendation. Clinicians are never presented with a "black box" output — the reasoning lens is visible (Overview, Interventions, Monitoring, Education), and the source data is always traceable.

**Privacy by Design**  
Patient data is processed transiently. No personally identifiable clinical information is persisted to a remote database. All session state is stored locally within the clinician's browser. Data transmitted to the Gemini API for inference is used solely for generating the immediate clinical response and is not retained for model training by this application.

**Limitation Awareness**  
Pocket Gull is not a medical device and is not a substitute for professional clinical judgment, licensure, or established diagnostic procedures. It is a productivity and synthesis tool. Users are expected to apply their clinical expertise when interpreting and acting upon any AI-generated content.

**Fairness & Bias Mitigation**  
Clinical inputs are structured and physician-directed, reducing the risk of biased outputs driven by incomplete demographic proxies. The platform is designed to augment — not replace — the human clinical assessment, ensuring the physician's direct observation remains the primary diagnostic instrument.

---

## 🎉 Bonus Content

- **Automated Cloud Deployment:** Cloud deployment provisioning has been scripted through Google Cloud's CLI (`gcloud`). See the automated deployment script located at [`./scripts/deploy.sh`](scripts/deploy.sh) within the codebase.

---

## License

This project is licensed under the MIT License.