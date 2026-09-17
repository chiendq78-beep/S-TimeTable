# Project Conventions & Mobile Gesture Guidelines

## Mobile & Android Back Navigation Hierarchy

Whenever creating new features, tabs, modals, or views in this project, **STRICTLY** follow the established 3-tier Back navigation behavior (Capacitor Android hardware back button + edge-swipe back gesture + Web popstate):

### 1. Modals, Popups, Drawers & Dialogs (Top Priority)
- Any modal, full-screen dialog, preview popup, or slide-in drawer MUST bind to the `useSwipeToCloseModal` hook or listen to Capacitor's `backButton` event.
- **Action on Back / Left Edge Swipe**: Only close the currently active modal/drawer, preserving the underlying screen state. Never navigate tabs or exit the app while a modal is visible.

### 2. Secondary Views & Sub-Tabs
- When navigating to any secondary tab (e.g., *Homework*, *Exams*, *Gradebook*, *Extra Classes*, *Settings*, *Notices*, *Profile*, etc.):
- **Action on Back / Left Edge Swipe**: Must return the user to the **Root Menu** (`timetable` - Thời Khóa Biểu).

### 3. Root Menu (`timetable`)
- When the user is at the Root Menu (`timetable`) and no dialogs/drawers are open:
- **Action on Back / Left Edge Swipe**: Perform app exit via `CapApp.exitApp()`, closing the application smoothly according to standard native Android behavior.
