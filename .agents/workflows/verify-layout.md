---
description: Verify Layout Integrity
---
This workflow uses the browser agent to verify that the UI layout remains robust after changes.

1. **Initial Load**: Verify the app loads with its default 50/50 vertical split and 60/40 horizontal split (Top/Bottom).
2. **Column Resizer Test**:
   - Drag the vertical handle left/right.
   - Double-click to reset.
   - Verify minimum and maximum widths.
3. **Row Resizer Test**:
   - Drag the horizontal handle up/down.
   - Double-click to reset.
   - Verify minimum and maximum heights.
4. **Interactive Mapping**:
   - Click a body part in the 3D viewer.
   - Verify the "Chief Complaint" or "Historical Selection" updates.
5. **System Readiness**:
   - Hover over the top-left status indicator.
   - Verify the diagnostic tooltip appears.
