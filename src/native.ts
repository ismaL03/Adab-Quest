import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

// Pont vers le service Android qui affiche un mot à chaque déverrouillage.
type UnlockPlugin = {
  getStatus(): Promise<{ enabled: boolean; overlay: boolean; notifications: boolean }>
  setEnabled(o: { enabled: boolean; interval: number }): Promise<void>
  requestOverlay(): Promise<void>
  requestNotifications(): Promise<void>
  dismiss(): Promise<void>
  addListener(event: 'unlock', cb: () => void): Promise<PluginListenerHandle>
}

export const isAndroid = Capacitor.getPlatform() === 'android'
export const isNative = Capacitor.isNativePlatform()
export const Unlock = registerPlugin<UnlockPlugin>('Unlock')
