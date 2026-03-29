/**
 * Renders a DOM element to a multi-page A4 PDF and triggers download.
 * Elements with className "no-print" are hidden during capture.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename = 'presentation',
): Promise<void> {
  // Hide no-print elements
  const hidden: Array<{ el: HTMLElement; prev: string }> = []
  element.querySelectorAll<HTMLElement>('.no-print').forEach(el => {
    hidden.push({ el, prev: el.style.display })
    el.style.display = 'none'
  })

  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      // Ignore fixed-position elements (lightbox overlay, etc.)
      ignoreElements: el => el.classList.contains('no-print'),
    })

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfW = pdf.internal.pageSize.getWidth()   // 210 mm
    const pdfH = pdf.internal.pageSize.getHeight()  // 297 mm

    const imgData = canvas.toDataURL('image/jpeg', 0.93)
    const ratio   = pdfW / canvas.width              // px → mm
    const totalH  = canvas.height * ratio            // full content height in mm

    // First page
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, totalH)

    // Additional pages
    let remaining = totalH - pdfH
    let page = 1
    while (remaining > 0) {
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, -(page * pdfH), pdfW, totalH)
      remaining -= pdfH
      page++
    }

    pdf.save(`${filename}.pdf`)
  } finally {
    // Always restore
    hidden.forEach(({ el, prev }) => { el.style.display = prev })
  }
}
