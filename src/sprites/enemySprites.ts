interface EnemySpriteData {
  color: string
  symbol: string
}

const enemySpriteData: Record<string, EnemySpriteData> = {
  'shadow-wolf':     { color: '#4a4a5a', symbol: '🐺' },
  'thorn-sprite':    { color: '#5a8a4a', symbol: '🌿' },
  'bandit-rat':      { color: '#8a7a5a', symbol: '🐀' },
  'wild-boar':       { color: '#6a4a3a', symbol: '🐗' },
  'marsh-serpent':   { color: '#5a6a48', symbol: '🐍' },
  'stone-golem':     { color: '#7a7a7a', symbol: '🗿' },
  'highwayman-fox':  { color: '#a86a3a', symbol: '🦊' },
  'wandering-shade': { color: '#6a5a8a', symbol: '👻' },
}

const DEFAULT_SPRITE: EnemySpriteData = { color: '#5a5a5a', symbol: '❓' }

export function getEnemySpriteData(enemyId: string): EnemySpriteData {
  return enemySpriteData[enemyId] ?? DEFAULT_SPRITE
}

export function getEnemySpriteStyle(enemyId: string): React.CSSProperties {
  const data = getEnemySpriteData(enemyId)
  return {
    backgroundColor: data.color,
  }
}
