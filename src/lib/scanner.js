/**
 * BARCODE SCANNING
 *
 * Chrome and Android have a built-in BarcodeDetector. Safari does not,
 * and that is where this app mostly lives — so we fall back to a WASM
 * build of zbar with the same interface. About 240KB, bundled rather
 * than fetched, so scanning still works in a shop with no signal.
 *
 * This reads the number off a packet. Turning that number into a food is
 * `barcodes.js` — deliberately separate, because that part learns from
 * you rather than asking a service.
 */

let DetectorClass = null

/** Load a detector once: the browser's own if it has one, else the polyfill. */
async function getDetector () {
  if (DetectorClass) return DetectorClass

  if ('BarcodeDetector' in globalThis) {
    DetectorClass = globalThis.BarcodeDetector
  } else {
    const { BarcodeDetectorPolyfill } = await import('@undecaf/barcode-detector-polyfill')
    DetectorClass = BarcodeDetectorPolyfill
  }
  return DetectorClass
}

/** The barcodes actually printed on food packaging. */
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']

/**
 * Point the camera at a packet and call `onFound(code)` when it reads one.
 * Returns a stop() function — always call it, or the camera stays on.
 */
export async function startScanning (video, onFound, onError) {
  let stream = null
  let timer = null
  let stopped = false

  const stop = () => {
    stopped = true
    clearInterval(timer)
    stream?.getTracks().forEach(track => track.stop())
    video.srcObject = null
  }

  let detector
  try {
    const Detector = await getDetector()
    detector = new Detector({ formats: FORMATS })
  } catch {
    // The reader itself wouldn't load — a different problem from the
    // camera, and worth saying so rather than blaming the camera.
    onError?.('Barcode reading isn’t available in this browser. You can still type the food in.')
    return stop
  }

  try {

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' } // the back camera, not your face
    })
    if (stopped) { stream.getTracks().forEach(t => t.stop()); return stop }

    video.srcObject = stream
    video.setAttribute('playsinline', '') // iOS won't go full screen with this
    await video.play()

    // Four looks a second is plenty and keeps the phone cool.
    timer = setInterval(async () => {
      if (stopped || video.readyState < 2) return
      try {
        const found = await detector.detect(video)
        if (found?.length) {
          const code = found[0].rawValue?.trim()
          if (code) { stop(); onFound(code) }
        }
      } catch {
        /* a bad frame; the next one will do */
      }
    }, 250)
  } catch (err) {
    stop()
    onError?.(describe(err))
  }

  return stop
}

/** Camera failures are common and worth explaining properly. */
function describe (err) {
  const name = err?.name ?? ''
  if (name === 'NotAllowedError') {
    return 'No camera permission. Allow it for this site in your browser settings and try again.'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera found on this device.'
  }
  if (name === 'NotReadableError') {
    return 'The camera is busy — close anything else using it.'
  }
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    return 'Scanning needs a secure connection (https).'
  }
  return 'Couldn’t start the camera.'
}

/** Is scanning even possible here? Cheap check before showing the button. */
export const canScan = () =>
  !!navigator.mediaDevices?.getUserMedia && window.isSecureContext
