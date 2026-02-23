# Understory Agentic Instructions

This document provides guidance for AI agents working on the Understory project.

## Technical Stack
- **Framework**: Angular (Latest) with Signals.
- **Styling**: Tailwind CSS (Vanilla CSS where needed).
- **Architecture**: Service-oriented with `PatientStateService` as the source of truth.
- **Components**: Functional-style standalone components.

## Development Workflows
- Always verify UI changes using the `browser_subagent`.
- Use `afterNextRender` for DOM-dependent signal initializations.
- Follow the **Industrial Grace** design standard: premium, obsidian-and-slate palette, obsidian glass effects.

## Layout System
The layout is managed in `AppComponent` with a multi-directional resizable grid:
- **Vertical Split**: Medical Chart vs. Analysis/Intake.
- **Horizontal Split**: Main Workspace vs. Medical Summary (Care Plan Engine).
- **Signals**: `inputPanelWidth` and `topSectionHeight`.

## MCP Tool Integration
For complex tasks, leverage the following MCP servers:
- **`firebase-mcp-server`**: For database queries, security rules validation, and storage management.
- **`github-mcp-server`**: For PR reviews, issue tracking, and repository management.
- **`google-maps-platform-code-assist`**: For all location-based logic, routing, and map rendering optimization.

## Verification Patterns
Use the following checks when verifying work:
1. **Resizer Integrity**: Ensure dragging both column and row resizers is smooth and snapping works.
2. **State Sync**: Verify that selections in the 3D viewer correctly update `selectedPartId` and trigger relevant UI transitions.
3. **Responsive Flow**: Check how panels behave when collapsed or maximized.
