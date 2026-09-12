const UNAVAILABLE =
  '[node-port] WhatsApp adapter unavailable: @whiskeysockets/baileys is not installed in the Node build'

export const DisconnectReason = {
  loggedOut: 401,
  restartRequired: 514,
}

function unavailable(): never {
  throw new Error(UNAVAILABLE)
}

export function makeWASocket(..._args: unknown[]): any {
  return unavailable()
}

export async function useMultiFileAuthState(..._args: unknown[]): Promise<any> {
  return unavailable()
}

export async function fetchLatestBaileysVersion(..._args: unknown[]): Promise<any> {
  return unavailable()
}

export function makeCacheableSignalKeyStore(..._args: unknown[]): any {
  return unavailable()
}

export function normalizeMessageContent(..._args: unknown[]): any {
  return unavailable()
}

export async function downloadMediaMessage(..._args: unknown[]): Promise<any> {
  return unavailable()
}
