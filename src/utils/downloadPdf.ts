/**
 * Triggers browser print dialog (Cmd+P / Ctrl+P).
 * With the print CSS in index.css the page renders as a clean A4 PDF.
 * The user selects "Save as PDF" in the browser dialog.
 *
 * Elements with className "no-print" are automatically hidden via CSS.
 */
export function downloadElementAsPdf(
  _element: HTMLElement,
  _filename = 'presentation',
): Promise<void> {
  return new Promise(resolve => {
    window.print()
    // Resolve after a short delay so callers can reset UI state
    setTimeout(resolve, 500)
  })
}
