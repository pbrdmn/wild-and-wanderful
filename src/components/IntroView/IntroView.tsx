import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { AnimalSpecies, ItemCategory } from '../../engine/types'
import type { Item, AnimalSpecies as AnimalSpeciesType } from '../../engine/types'
import { getFrontSpriteStyle } from '../../sprites/spriteConfig'
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

type IntroStep = 'wanderer' | 'heirloom'

export function IntroView() {
  const offeredItems = useGameStore((s) => s.offeredItems)
  const selectItem = useGameStore((s) => s.selectItem)
  const setWanderer = useGameStore((s) => s.setWanderer)
  const setView = useGameStore((s) => s.setView)
  const leaderboard = useGameStore((s) => s.leaderboard)

  const [step, setStep] = useState<IntroStep>('wanderer')
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<AnimalSpeciesType>(AnimalSpecies.Fox)

  const handleConfirmWanderer = () => {
    const finalName = name.trim() || 'Wanderer'
    setWanderer(finalName, species)
    setStep('heirloom')
  }

  if (step === 'wanderer') {
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
            <label className={styles.nameLabel} htmlFor="wanderer-name">Name Your Wanderer</label>
            <input
              id="wanderer-name"
              className={styles.nameInput}
              type="text"
              placeholder="Wanderer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              data-testid="name-input"
            />
          </div>

          <p className={styles.sectionLabel}>Choose Your Wanderer</p>
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
                  style={getFrontSpriteStyle(s.id)}
                />
                <span className={styles.speciesName}>{s.label}</span>
                <span className={styles.speciesFlavour}>{s.flavour}</span>
              </button>
            ))}
          </div>

          <button
            className={styles.confirmButton}
            onClick={handleConfirmWanderer}
            data-testid="confirm-wanderer"
          >
            Begin Your Tale
          </button>

          {leaderboard.length > 0 && (
            <button
              className={styles.leaderboardButton}
              onClick={() => setView('leaderboard')}
              data-testid="hall-of-wanderers-button"
            >
              Hall of Wanderers
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
            They belonged to wanderers who came before you. Choose wisely, little one.&rdquo;
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
