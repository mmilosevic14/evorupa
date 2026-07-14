# Issue #4 Resume Investigation

## Scope inspected

- [app/report/ReportPageClient.tsx](app/report/ReportPageClient.tsx) owns file selection, EXIF GPS extraction, preview generation, canvas conversion to WebP, and Supabase upload preparation.
- [lib/reportImageProcessing.ts](lib/reportImageProcessing.ts) owns only image sizing helpers.
- [app/layout.tsx](app/layout.tsx) and [next.config.ts](next.config.ts) provide shared app shell and PWA wiring.
- A repo-wide search found no existing handlers for `visibilitychange`, `pageshow`, `pagehide`, `freeze`, `resume`, `beforeinstallprompt`, custom camera APIs, or draft persistence via `localStorage` or `sessionStorage`.

## Observations

- The report form keeps the selected photo, preview data URL, source image URL, and all draft fields only in React component state.
- Returning from the system camera or app switcher can remount or discard a mobile browser/PWA page under memory pressure, especially after selecting a large camera image.
- There is no code path today that restores a report draft after such a remount.
- There is also no direct evidence in the codebase of a deterministic JavaScript exception on resume.

## Concrete hypothesis

The most likely confirmed risk is state loss after camera handoff or app resume, not a validated logic bug in the current code. On some devices the browser or installed PWA shell may discard the page while the camera app is active. When the page returns, [app/report/ReportPageClient.tsx](app/report/ReportPageClient.tsx) starts from fresh state, which can appear to the user as a blank or dark screen depending on the platform WebView and whether the browser restores the previous paint cleanly.

## Why no fix was shipped

- No reliable local reproduction path was available in this environment.
- A speculative fix such as adding generic lifecycle listeners or broad state persistence would change behavior in a sensitive flow without confirming the root cause.
- The confirmed issue items from the same report were implemented separately: square image output, mobile navigation, and a PWA install prompt.

## Recommended follow-up

1. Reproduce on the affected mobile device with remote browser devtools attached.
2. Compare browser tab behavior versus installed PWA behavior after opening the camera from the report form.
3. Capture console output and memory warnings during the return from camera selection.
4. If state loss is confirmed, add narrow draft persistence for text, coordinates, and image metadata, then decide separately whether full photo blob persistence is acceptable.