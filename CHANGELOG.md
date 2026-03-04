# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-03-03

### Added
- **Context-Aware AI Chat**: Integrated recent node-specific discussions directly into the AI's conversational memory, enhancing the relevance of "Live Consult" responses.
- **Inline Node Agent Queries**: Added ability to seamlessly launch AI inquiries directly from individual paragraphs and list items within the analysis report.
- **3D Medical Interactive Viewer**: Integrated a robust ThreeJS-powered 3D model viewer for enhanced anatomical visualization.
- **Scans & Diagnostics Library**: Added a visual gallery component to the patient history for managing and displaying diagnostic imagery like MRIs and X-Rays.
- **Evidence Focus Iconography**: Introduced a custom "Interrobang" clinical icon for the Evidence Focus feature, replacing generic indicators.

### Changed
- **Application Rename**: Renamed the application from Understory to Pocket Gall across the entire codebase.
- **Node Toolbar Accessibility**: Increased touch target padding and visual persistence delays on the summary node toolbar to dramatically improve mobile and touch interactions.

## [0.2.0] - 2026-02-28

### Added
- **Offline Printable Stationery**: CSS Grid-optimized, multi-page physical printouts featuring Halftone body maps for visual pain hotspot diagnosis.
- **Smartwatch Optimization**: Responsive UI scaling down to extremely constrained viewports (e.g., Pixel Watch 2 at 286px width).
- **Box Breathing UX**: 16-second box breathing visual animations integrated into primary intake text areas to promote practitioner mindfulness.

### Changed
- **Server-Side Rendering (SSR)**: Transitioned architecture to Angular SSR for performance optimization.
- **Mobile Navigation**: Implemented tabbed view-switching (Tasks / Analysis) optimized for constrained mobile environments.

### Fixed
- **SSR Build Stability**: Resolved "no exports" optimization bailouts caused by unresolved TypeScript properties in `PatientStateService`.
- **Mobile Scrolling**: Fixed mobile page scrolling flow by removing forced height constraints.
- **UI Clipping**: Fixed horizontal/vertical clipping of action buttons and contents in the analysis report.
- **Type Safety**: Ensured strict type checking and proper exports for patient history and summary models across services.

## [0.1.0] - 2026-02-22

### Added
- **Care Plan Recommendation Engine**: A structured AI analysis module categorizing recommendations into Overview, Interventions, Monitoring, and Education.
- **Task Bracketing System**: Interactive UI allowing clinicians to Accept, Reject, or Modify AI-generated interventions before finalizing.
- **Live Voice Consult (Aura)**: An integrated voice assistant agent for real-time collaboration on patient strategies. Includes a dedicated chat interface with speech-to-text integration.
- **3D Body Viewer Integration**: Visual anatomical mapping tools to correlate physical symptoms with digital chart records.
- **Automated Clinical Task Extraction**: Parses unstructured clinical notes into actionable checklist items.
- **Biometric Telemetry Visualization**: Chart.js integration providing retrospective trend analysis for patient blood pressure and pain metrics.
- **Preview & Print Final Care Plan**: A dedicated modal to review, edit, and print the finalized patient care strategy before charting.

### Changed
- Re-architected core layouts for a responsive 3-column split view (Medical Chart, Intake Flow, and Analysis/Voice Assistant).
- Optimized client-side payload delivery via Express compression (Gzip/Brotli) and structural font preconnections.
- Upgraded UI interactions with modern tailwind aesthetics, smooth transitions, and dynamic hover states across all components.

### Fixed
- Addressed infinite reactivity loops within the Intake Form component upon body part selection.
- Corrected Voice Assistant triggering bugs preventing the component from rendering on mobile and desktop viewports.
- Handled improper API Key rejection formatting from the Gemini API service, surfacing graceful UI alerts instead of silent failures.
