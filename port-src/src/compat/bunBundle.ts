
const cachedList = (() => {
  const raw = process.env.CC_HAHA_FEATURES ?? 'TRANSCRIPT_CLASSIFIER'
  return new Set(
    raw
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(entry => entry.split('=').shift()!.trim()),
  )
})()

export function feature(name: string): boolean | string | undefined {
  if (cachedList.has(name)) return true
  return false
}

export default { feature }
