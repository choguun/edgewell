import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  WebView,
  type WebViewErrorEvent,
  type WebViewHttpErrorEvent,
  type WebViewNavigationEvent,
} from 'react-native-webview'
import { Worklet } from 'react-native-bare-kit'
import { Directory, File, Paths } from 'expo-file-system'
// IMPORTANT: we only IMPORT the descriptor so the bare worker has a
// `registry://` URL to hand to `loadModel`. We deliberately do NOT call
// any function from `@qvac/sdk` — the first such call would lazily spawn
// a hidden bare worklet via `expo-rpc-client.js` whose stale `js_ref_t`
// handles then crash the worker we start below. See the boot() body.
import { LLAMA_3_2_1B_INST_Q4_0 } from '@qvac/sdk'

import { webFiles } from './src/web-assets'
import { serverBundle } from './src/server-bundle'

/** Remove a trailing `file://` prefix (the legacy way of getting the bare path). */
function stripFileUri(uri: string): string {
  return uri.replace(/^file:\/\//, '')
}

/**
 * Resolve the bare-runtime HOME_DIR from `Paths.document.uri`.
 * Throws a clear error if the document directory isn't available
 * (e.g. iOS simulator without a writable FS, broken Expo config).
 */
function resolveHomeDir(): string {
  const uri = Paths.document?.uri
  if (typeof uri !== 'string' || uri.length === 0) {
    throw new Error('expo-file-system: Paths.document.uri is unavailable')
  }
  // Trim trailing slash so concatenations like `homeDir + '/web'` don't
  // produce double slashes that confuse downstream path-joining code.
  return stripFileUri(uri).replace(/\/+$/, '')
}

type Phase = 'init' | 'assets' | 'worklet' | 'starting' | 'ready' | 'error'

const SERVER_PORT = 8787
const SERVER_URL = `http://localhost:${SERVER_PORT}`
// Generous because the bare worker still has to download + load a
// ~770 MB model from the network into disk and then into RAM before
// `http.listen` resolves on cold start.
const SERVER_READY_TIMEOUT_MS = 300_000
// Length of a single `waitForServer` HTTP probe (kept short so a stalled
// server doesn't burn the whole budget on one connection).
const SERVER_PROBE_TIMEOUT_MS = 2_000
// How long to wait between probes.
const SERVER_PROBE_INTERVAL_MS = 500
// Polling period for the post-ready liveness probe. If the bare worker is
// OOM-killed by Android while we're sitting in the WebView, this is what
// notices and pops the user back to the loading screen.
const LIVENESS_PROBE_INTERVAL_MS = 5_000

/** Format a thrown value into a one-line message suitable for the UI. */
function describe(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('init')
  const [status, setStatus] = useState('Starting…')
  const [webViewKey, setWebViewKey] = useState(0)
  // `bootNonce` is included in the boot effect's deps so a user-driven
  // "Try again" re-runs the entire pipeline (assets → worklet →
  // wait-for-server) instead of just retrying the WebView.
  const [bootNonce, setBootNonce] = useState(0)
  const [retryNonce, setRetryNonce] = useState(0)
  const workletRef = useRef<Worklet | null>(null)
  // Guard setState calls after unmount / boot cancellation.
  const aliveRef = useRef(true)

  const fail = useCallback((message: string, err?: unknown) => {
    if (!aliveRef.current) return
    if (err !== undefined) console.error('[App]', message, err)
    else console.error('[App]', message)
    setPhase('error')
    setStatus(message)
  }, [])

  /**
   * "Retry" inside the WebView error view only refreshes the WebView
   * (most failures are transient — DNS hiccup, WebView render glitch).
   * Bumping `webViewKey` forces React to mount a fresh WebView; bumping
   * `retryNonce` re-keys the error view so the Pressable doesn't reuse
   * a stale event handler closure.
   */
  const retryWebView = useCallback(() => {
    setWebViewKey((k) => k + 1)
    setRetryNonce((n) => n + 1)
  }, [])

  /** "Try again" on the boot error screen: re-run the full pipeline. */
  const retryBoot = useCallback(() => {
    console.log('[App] retry boot requested')
    setBootNonce((n) => n + 1)
  }, [])

  useEffect(() => {
    aliveRef.current = true

    async function boot(): Promise<void> {
      let homeDir: string
      try {
        homeDir = resolveHomeDir()
      } catch (e) {
        fail(`Error: ${describe(e)}`)
        return
      }

      const webDir = homeDir + '/web'
      // `registry://…` URL — the bare worker's `loadModel` will:
      //   1. Hit `${HOME_DIR}/.qvac/models/<sha256[:16]>_<basename>` first
      //      (cache check; size + SHA-256 validated against the descriptor)
      //   2. Fall back to downloading from the registry on first run.
      // On subsequent runs the file is reused and loadModel resolves
      // in a couple of seconds.
      const modelSrc = LLAMA_3_2_1B_INST_Q4_0.src

      // --- Materialise the bundled web UI into the document directory ---
      console.log('[App] writing web assets')
      setPhase('assets')
      setStatus('Preparing web UI…')
      try {
        const webDirectory = new Directory(Paths.document, 'web')
        webDirectory.create({ intermediates: true, idempotent: true })
        for (const [name, content] of Object.entries(webFiles)) {
          if (typeof content !== 'string' || content.length === 0) {
            // Skip empties to avoid creating 0-byte files that the WebView
            // would later fail to fetch.
            console.warn(`[App] skipping empty asset: ${name}`)
            continue
          }
          const file = new File(webDirectory, name)
          if (!file.exists) {
            // `File.write` calls `create()` itself when the file is missing,
            // so we don't need a separate `file.create()` step here.
            file.write(content, { encoding: 'utf8' })
          }
        }
      } catch (e) {
        fail(`Error writing web assets: ${describe(e)}`, e)
        return
      }
      if (!aliveRef.current) return

      // --- Boot the bare worker (EdgeWell HTTP server) ---
      // Note: we deliberately do NOT call any client-side SDK function
      // (e.g. `downloadAsset`) from React Native before this. The first
      // such call would lazily spawn a *second* bare worklet via
      // `expo-rpc-client.js` to host the RPC channel; that hidden worker
      // registers the same native addons (`@qvac/llm-llamacpp`,
      // `@qvac/embed-llamacpp`, …) as ours and leaves stale `js_ref_t`
      // handles in its V8 isolate that crash the *next* worker on first
      // access. The SDK's `close()` is supposed to release those handles
      // (`__shutdown__` → `cleanupForTerminate` → `releaseLogger`), but on
      // mobile that path is best-effort and has been observed to leave
      // residue. The robust fix is to never auto-spawn the SDK worker in
      // the first place: let our bare worker own model download + load
      // and the HTTP server, end to end.
      console.log('[App] starting bare worker')
      setPhase('worklet')
      setStatus('Starting EdgeWell server…')

      const worklet = new Worklet()
      workletRef.current = worklet
      try {
        worklet.start('/edgewell-server.js', serverBundle, [
          'edgewell',
          'entry.mjs',
          JSON.stringify({
            HOME_DIR: homeDir,
            MODEL_PATH: modelSrc,
            WEB_DIR: webDir,
            PORT: SERVER_PORT,
          }),
        ])
      } catch (e) {
        fail(`Error starting server: ${describe(e)}`, e)
        return
      }
      if (!aliveRef.current) return

      // --- Poll /health until the server (and the model) is ready ---
      console.log('[App] waiting for server')
      setPhase('starting')
      setStatus('Starting EdgeWell server…')
      try {
        await waitForServer(SERVER_READY_TIMEOUT_MS)
      } catch (e) {
        fail(`Error: ${describe(e)}`, e)
        return
      }
      if (!aliveRef.current) return

      console.log('[App] ready')
      setPhase('ready')
    }

    void boot()

    return () => {
      aliveRef.current = false
      // Tear down the bare worker so we don't leak its native isolate
      // (and the model loaded into it) when the component unmounts.
      const w = workletRef.current
      if (w) {
        try {
          w.terminate()
        } catch (e) {
          console.warn('[App] worklet terminate failed', e)
        }
        workletRef.current = null
      }
    }
  }, [fail, bootNonce])

  // --- Hardware back button on Android: bail out of the boot screen ---
  // `BackHandler` is a no-op on iOS. While a WebView is mounted we let the
  // WebView handle back navigation itself; only on the loading / error
  // screens do we want to actually exit the app.
  useEffect(() => {
    if (phase === 'ready') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp()
      return true
    })
    return () => sub.remove()
  }, [phase])

  // --- Post-ready liveness probe ---
  // If the bare worker is OOM-killed by Android while we're sitting in the
  // WebView, `/health` will start failing. We use that signal to drop back
  // to the loading screen so the user isn't stuck looking at a broken page.
  useEffect(() => {
    if (phase !== 'ready') return
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), SERVER_PROBE_TIMEOUT_MS)
        try {
          const res = await fetch(`${SERVER_URL}/health`, { signal: controller.signal })
          if (!res.ok) throw new Error(`status ${res.status}`)
        } finally {
          clearTimeout(timer)
        }
      } catch {
        console.warn('[App] server liveness probe failed; reverting to loading screen')
        if (!cancelled) {
          setPhase('starting')
          setStatus('Reconnecting to server…')
          setBootNonce((n) => n + 1)
        }
      }
    }
    const id = setInterval(tick, LIVENESS_PROBE_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [phase])

  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090a0f" />
        <View style={styles.loading}>
          <Text style={styles.errorTitle}>EdgeWell couldn't start</Text>
          <Text style={styles.errorText}>{status}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={retryBoot}
            accessibilityRole="button"
            accessibilityLabel="Try starting EdgeWell again"
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  if (phase !== 'ready') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090a0f" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.status}>{status}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090a0f" />
      <WebView
        // `key` forces a fresh WebView when the user taps "Retry"; without
        // it, an already-broken WebView tends to keep its broken state.
        key={webViewKey}
        source={{ uri: SERVER_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        mixedContentMode="always"
        cacheEnabled
        originWhitelist={[SERVER_URL]}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.status}>Loading EdgeWell…</Text>
          </View>
        )}
        onLoad={(_e: WebViewNavigationEvent) =>
          console.log('[WebView] page loaded')
        }
        onHttpError={(e: WebViewHttpErrorEvent) =>
          console.warn('[WebView] HTTP error:', e.nativeEvent.statusCode, e.nativeEvent.url)
        }
        onError={(e: WebViewErrorEvent) =>
          console.error('[WebView] error:', e.nativeEvent)
        }
        renderError={(errorDomain, errorCode, errorDesc) => (
          <View style={styles.loading} key={`renderError-${retryNonce}`}>
            <Text style={styles.errorTitle}>Couldn't reach the EdgeWell server</Text>
            <Text style={styles.errorText}>
              {errorDomain ?? 'error'} ({errorCode}): {errorDesc}
            </Text>
            <Pressable
              style={styles.retryBtn}
              onPress={retryWebView}
              accessibilityRole="button"
              accessibilityLabel="Retry connecting to the EdgeWell server"
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

async function waitForServer(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), SERVER_PROBE_TIMEOUT_MS)
    try {
      const res = await fetch(`${SERVER_URL}/health`, { signal: controller.signal })
      if (res.ok) return
    } catch {
      /* server not up yet */
    } finally {
      clearTimeout(timer)
    }
    await new Promise((r) => setTimeout(r, SERVER_PROBE_INTERVAL_MS))
  }
  throw new Error(`Server did not start within ${timeoutMs}ms`)
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090a0f' },
  loading: {
    flex: 1,
    backgroundColor: '#090a0f',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  status: { color: '#A7A7B3', fontSize: 16, textAlign: 'center' },
  errorTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#22C55E',
    borderRadius: 8,
  },
  retryText: { color: '#090a0f', fontSize: 16, fontWeight: '600' },
  webview: { flex: 1 },
})
