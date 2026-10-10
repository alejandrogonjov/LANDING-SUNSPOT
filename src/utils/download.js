/**
 * Hands the browser a generated file to save, without a round trip to a server.
 */

/**
 * @param {any} data - serialised with two-space indent, so the file stays
 *   readable in a text editor rather than arriving as one long line.
 * @param {string} filename
 */
export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Revoking synchronously cancels the download in some browsers — the object
  // URL has to outlive the click that consumes it.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
