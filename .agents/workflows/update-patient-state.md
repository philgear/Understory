---
description: Update Patient State and State Management
---
This workflow guides the addition or modification of state in the Understory application.

1. **Service Analysis**:
   - Locate the relevant signal or method in `src/services/patient-state.service.ts`.
   - Ensure you are using Angular Signals (`signal`, `computed`, `effect`).

2. **Implementation**:
   - Add the new signal or method to `PatientStateService`.
   - Use `untracked` if updating other signals within an effect to avoid circular dependencies.

3. **Component Integration**:
   - Inject the `PatientStateService` into the target component.
   - Bind the signal to the template using the `signal()` syntax.

4. **Verification**:
   - Run the app and verify the state change using the browser agent.
   - Check the console for any Signal-related errors.
