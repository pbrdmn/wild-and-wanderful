import { useGameStore } from '../../stores/gameStore'
import { ItemCategory } from '../../engine/types'
import type { Item } from '../../engine/types'
import styles from './IntroView.module.css'

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

export function IntroView() {
  const offeredItems = useGameStore((s) => s.offeredItems)
  const selectItem = useGameStore((s) => s.selectItem)

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
