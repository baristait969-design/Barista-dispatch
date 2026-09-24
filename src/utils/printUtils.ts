/**
 * Universal single-window print helper.
 * Directly triggers the native system print preview without opening any secondary popups or extra windows.
 */
export function printHtmlElement(_elementId?: string, _title?: string) {
  try {
    window.focus();
    window.print();
  } catch (err) {
    console.error('Print error:', err);
  }
}

export function triggerDevicePrint(_elementId?: string, _title?: string) {
  try {
    window.focus();
    window.print();
  } catch (err) {
    console.error('Print error:', err);
  }
}
