To build this game using an AI agent (like Claude or GPT-4o within Cursor), you need a prompt that establishes the technical architecture while maintaining the design "soul" of the project.
Copy and paste the following prompt into Cursor to begin the "Scaffolding" phase
------------------------------

Project Prompt: Wild and Wanderful: A Cozy Adventure
Build a mobile-first, offline-first, turn-based RPG using [Insert your preferred tech stack, e.g., React, TypeScript, and Tailwind CSS]. The game is a "cozy-roguelike" with a Studio Ghibli aesthetic and cute animal characters.
Core Game Loop & State Management

   1. Grid System: Create a 20x20 coordinate-based grid. Each tile stores terrainType, isExplored, enemyData, and itemData.
   2. Turn-Based Engine: Implement an Action Point (AP) system. Players start with 3 AP. Actions (Move, Attack, Search) consume AP.
   3. Wound System: Replace HP with Wound Slots (1 slot per level). Implement a Rest function that restores 1 Wound but has a 10% chance of triggering an Ambush.
   4. Persistence: All game state must be saved locally (e.g., localStorage or IndexedDB) to ensure 100% offline-first play.

UI/UX Architecture (Immersive & Minimalist)

   1. One-Thing-at-a-Time View:

* Scene View (Main): Display a text description of the current tile. Include "Peripheral Glimpses" (e.g., "To the North, you see a Dense Forest").
  * Interaction Buttons: [Attack], [Search], [Rest], [Inventory].

   1. The Physical Map: Create an Inventory item called "The Map." When used, it renders the 20x20 grid. Users navigate by tapping an adjacent tile on the map.
   2. Visual Style: Use a "soft" UI palette (creams, forest greens, muted oranges). Use CSS transitions to make scene changes feel like "turning a page."

Item & Skill Logic

   1. Item-Based Skills: Skills are "Active" only if the required item is equipped (e.g., Heavy Strike requires a Sword).
   2. The Full-Turn Swap: Implement a mechanic where swapping an item or changing active skills consumes the entire turn's AP.
   3. Search Mechanic: Program a Search function that has a chance to flip an "Impassable" terrain tile (Cliff, Thicket) into a "Hidden Path" tile.

Initial Task
Start by setting up the Project Structure and the Global State Provider (to handle AP, Wounds, and Player Inventory). Then, generate the Scene View component that displays the text description of the starting village at the player's location (randomly selected).