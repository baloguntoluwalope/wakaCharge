// Store deferred install prompt globally
let deferredPrompt: any = null

export const initPWA = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    // Dispatch custom event so components can react
    window.dispatchEvent(new CustomEvent('pwa-installable'))
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.dispatchEvent(new CustomEvent('pwa-installed'))
  })
}

export const promptInstall = async (): Promise<boolean> => {
  if (!deferredPrompt) return false
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  return outcome === 'accepted'
}

export const isPWAInstalled = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

export const isPWAInstallable = (): boolean => {
  return deferredPrompt !== null
}