import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { AnimalSpecies, ItemCategory } from '../../engine/types'
import type { Item, AnimalSpecies as AnimalSpeciesType } from '../../engine/types'
import styles from './IntroView.module.css'

const SPECIES_LIST: { id: AnimalSpeciesType; label: string; flavour: string }[] = [
  { id: AnimalSpecies.Fox, label: 'Fox', flavour: 'Quick-witted and light on their feet.' },
  { id: AnimalSpecies.Bear, label: 'Bear', flavour: 'Sturdy and warm-hearted.' },
  { id: AnimalSpecies.Mouse, label: 'Mouse', flavour: 'Small but fiercely brave.' },
  { id: AnimalSpecies.Raccoon, label: 'Raccoon', flavour: 'Curious and resourceful.' },
  { id: AnimalSpecies.Cat, label: 'Cat', flavour: 'Graceful and independent.' },
  { id: AnimalSpecies.Bird, label: 'Bird', flavour: 'Sharp-eyed and free-spirited.' },
  { id: AnimalSpecies.Frog, label: 'Frog', flavour: 'Patient and surprisingly tough.' },
]

const SPRITE_CONFIG: Record<AnimalSpeciesType, { col: number; row: number; cols: number }> = {
  fox:     { col: 0, row: 0, cols: 3 },
  bear:    { col: 1, row: 0, cols: 3 },
  mouse:   { col: 2, row: 0, cols: 3 },
  raccoon: { col: 0, row: 1, cols: 4 },
  cat:     { col: 1, row: 1, cols: 4 },
  bird:    { col: 2, row: 1, cols: 4 },
  frog:    { col: 3, row: 1, cols: 4 },
}

function getSpriteStyle(species: AnimalSpeciesType, sheet: string): React.CSSProperties {
  const cfg = SPRITE_CONFIG[species] ?? SPRITE_CONFIG.fox
  const bgSize = `${cfg.cols * 100}% 200%`
  const posX = cfg.cols > 1 ? (cfg.col / (cfg.cols - 1)) * 100 : 0
  const posY = cfg.row * 100
  return {
    backgroundImage: `url(${sheet})`,
    backgroundSize: bgSize,
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundRepeat: 'no-repeat',
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  [ItemCategory.Melee]: 'Melee',
  [ItemCategory.Ranged]: 'Ranged',
  [ItemCategory.Magic]: 'Magic',
}

function ItemCard({ item, onSelect }: { item: Item; onSelect: () => void }) {
  return (
    <button
      className={styles.itemCard}
      onClick={onSelect}
      data-testid={`heirloom-card-${item.id}`}
    >
      <span className={styles.categoryBadge}>{CATEGORY_LABELS[item.category] ?? item.category}</span>
      <h3 className={styles.itemName}>{item.name}</h3>
      <p className={styles.itemDesc}>{item.description}</p>
      <p className={styles.itemStats}>Attack: {item.attackPower}</p>
      <p className={styles.itemFlavour}>{item.flavourText}</p>
    </button>
  )
}

type IntroStep = 'character' | 'heirloom'

export function IntroView() {
  const offeredItems = useGameStore((s) => s.offeredItems)
  const selectItem = useGameStore((s) => s.selectItem)
  const setCharacter = useGameStore((s) => s.setCharacter)
  const setView = useGameStore((s) => s.setView)
  const leaderboard = useGameStore((s) => s.leaderboard)

  const [step, setStep] = useState<IntroStep>('character')
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<AnimalSpeciesType>(AnimalSpecies.Fox)

  const handleConfirmCharacter = () => {
    const finalName = name.trim() || 'Wanderer'
    setCharacter(finalName, species)
    setStep('heirloom')
  }

  if (step === 'character') {
    return (
      <div className={styles.introView}>
        <header className={styles.header}>
          <h1 className={styles.title}>Wild & Wanderful</h1>
        </header>

        <main className={styles.content}>
          <div className={styles.narrative} data-testid="intro-narrative">
            <p>
              Before your journey begins, tell us about yourself&hellip;
            </p>
          </div>

          <div className={styles.nameSection} data-testid="name-section">
            <label className={styles.nameLabel} htmlFor="character-name">Name Your Character</label>
            <input
              id="character-name"
              className={styles.nameInput}
              type="text"
              placeholder="Wanderer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              data-testid="name-input"
            />
          </div>

          <p className={styles.sectionLabel}>Choose Your Character</p>
          <div className={styles.speciesGrid} data-testid="species-choices">
            {SPECIES_LIST.map((s) => (
              <button
                key={s.id}
                className={`${styles.speciesCard} ${species === s.id ? styles.speciesSelected : ''}`}
                onClick={() => setSpecies(s.id)}
                data-testid={`species-card-${s.id}`}
              >
                <div
                  className={styles.speciesSprite}
                  style={getSpriteStyle(s.id, '/character-selection.png')}
                />
                <span className={styles.speciesName}>{s.label}</span>
                <span className={styles.speciesFlavour}>{s.flavour}</span>
              </button>
            ))}
          </div>

          <button
            className={styles.confirmButton}
            onClick={handleConfirmCharacter}
            data-testid="confirm-character"
          >
            Begin Your Tale
          </button>

          {leaderboard.length > 0 && (
            <button
              className={styles.leaderboardButton}
              onClick={() => setView('leaderboard')}
              data-testid="hall-of-heroes-button"
            >
              Hall of Heroes
            </button>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className={styles.introView}>
      <header className={styles.header}>
        <h1 className={styles.title}>Wild & Wanderful</h1>
      </header>

      <main className={styles.content}>
        <div className={styles.narrative} data-testid="intro-narrative">
          <p>
            An old badger adjusts her spectacles and peers at you from behind a cluttered
            workbench. The cottage smells of dried lavender and woodsmoke.
          </p>
          <p>
            &ldquo;Ah, another brave soul setting off into the wilds! Here &mdash; take one of these.
            They belonged to heroes who came before you. Choose wisely, little one.&rdquo;
          </p>
        </div>

        <div className={styles.choices} data-testid="heirloom-choices">
          {offeredItems.map((item) => (
            <ItemCard key={item.id} item={item} onSelect={() => selectItem(item.id)} />
          ))}
        </div>
      </main>
    </div>
  )
}
