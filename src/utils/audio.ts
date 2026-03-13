let audioCtx: AudioContext | null = null
let muted = localStorage.getItem('sound-muted') === 'true'

function getCtx(): AudioContext | null {
  if (muted) return null
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext()
    } catch {
      return null
    }
  }
  return audioCtx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  g.gain.setValueAtTime(gain, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

const sounds = {
  tap() {
    playTone(800, 0.05, 'square', 0.06)
  },
  move() {
    playTone(220, 0.1, 'triangle', 0.1)
    setTimeout(() => playTone(260, 0.08, 'triangle', 0.08), 80)
  },
  hit() {
    playTone(120, 0.15, 'sawtooth', 0.12)
  },
  levelUp() {
    const notes = [523, 659, 784]
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'sine', 0.12), i * 120))
  },
  victory() {
    const notes = [523, 587, 659, 784, 880]
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'sine', 0.1), i * 100))
  },
  defeat() {
    playTone(220, 0.4, 'sine', 0.12)
    setTimeout(() => playTone(165, 0.5, 'sine', 0.1), 300)
  },
} as const

export type SoundName = keyof typeof sounds

export function playSound(name: SoundName) {
  sounds[name]()
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean) {
  muted = value
  localStorage.setItem('sound-muted', String(value))
  if (muted && audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
}
