/**
 * Universal single-window print helper.
 * Formats the title and page orientation for clean, full-size A4 printing.
 */
export function printHtmlElement(elementId?: string, title?: string) {
  try {
    const isLandscape = elementId === 'printable-executive-report-content';
    if (isLandscape) {
      document.body.classList.add('printing-landscape');
    }

    const prevTitle = document.title;
    if (title) {
      document.title = title;
    }

    const cleanup = () => {
      document.body.classList.remove('printing-landscape');
      document.title = prevTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.focus();
    window.print();

    // Fallback cleanup if afterprint doesn't fire immediately
    setTimeout(cleanup, 2500);
  } catch (err) {
    console.error('Print error:', err);
  }
}

export function triggerDevicePrint(elementId?: string, title?: string) {
  printHtmlElement(elementId, title);
}

