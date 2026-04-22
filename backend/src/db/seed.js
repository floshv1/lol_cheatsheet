import db from './connection.js'

export function runSeed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM my_champions').get().c
  if (count > 0) return

  db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('patch', '16.8.1')").run()

    // ── Garen (Top) ───────────────────────────────────────────────────────────
    const garenId = db.prepare(
      'INSERT INTO my_champions (name, role, comfort, notes) VALUES (?, ?, ?, ?)'
    ).run('Garen', 'Top', 4, 'Reliable into melee match-ups. Weak vs ranged poke.').lastInsertRowid

    const garenRuneId = db.prepare(`
      INSERT INTO rune_pages (champion_id, label, is_default, primary_path, keystone, slot1, slot2, slot3, secondary_path, sec1, sec2, shard_offense, shard_flex, shard_defense)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(garenId, 'Standard Conqueror', 'Precision', 'Conqueror', 'Triumph', 'LegendTenacity', 'LastStand', 'Resolve', 'Conditioning', 'Unflinching', 'Adaptive Force', 'Adaptive Force', 'Health Scaling').lastInsertRowid

    const garenVsRangedRuneId = db.prepare(`
      INSERT INTO rune_pages (champion_id, label, is_default, primary_path, keystone, slot1, slot2, slot3, secondary_path, sec1, sec2, shard_offense, shard_flex, shard_defense)
      VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(garenId, 'Grasp vs Ranged', 'Resolve', 'GraspOfTheUndying', 'Demolish', 'SecondWind', 'Overgrowth', 'Precision', 'Triumph', 'LegendTenacity', 'Adaptive Force', 'Adaptive Force', 'Health Scaling').lastInsertRowid

    const garenBuildId = db.prepare(
      'INSERT INTO builds (champion_id, label, is_default) VALUES (?, ?, 1)'
    ).run(garenId, 'Standard').lastInsertRowid

    const garenItems = [
      { name: "Doran's Blade",    id: 1055, slot: 'starter',     idx: 0, note: '' },
      { name: 'Trinity Force',    id: 3078, slot: 'core',         idx: 0, note: 'First item always' },
      { name: "Sterak's Gage",    id: 3053, slot: 'core',         idx: 1, note: 'VS burst damage' },
      { name: 'Black Cleaver',    id: 3071, slot: 'core',         idx: 2, note: 'VS armor stacking' },
      { name: 'Plated Steelcaps', id: 3047, slot: 'boots',        idx: 0, note: 'VS heavy AD' },
      { name: "Mercury's Treads", id: 3111, slot: 'boots',        idx: 1, note: 'VS heavy CC/AP' },
      { name: 'Bramble Vest',     id: 3076, slot: 'situational',  idx: 0, note: 'Rush vs healing' },
      { name: 'Mortal Reminder',  id: 3033, slot: 'situational',  idx: 1, note: 'Full anti-heal if needed' },
    ]
    const insertItem = db.prepare('INSERT INTO build_items (build_id, item_name, item_id, slot, order_index, note) VALUES (?, ?, ?, ?, ?, ?)')
    for (const i of garenItems) insertItem.run(garenBuildId, i.name, i.id, i.slot, i.idx, i.note)

    const garenMatchups = [
      { enemy: 'Darius',    diff: 'hard', tip: 'Never let him stack passive. Trade short with Q-silence then disengage before 5 stacks. Buy Bramble Vest ASAP.', runeId: null,              itemNote: 'Rush Bramble Vest into Black Cleaver' },
      { enemy: 'Teemo',     diff: 'hard', tip: 'Rush Mercs. Walk through terrain when blinded. All-in when he has no Flash. Never fight in his shrooms.',        runeId: garenVsRangedRuneId, itemNote: 'Mercs mandatory. QSS if behind.' },
      { enemy: 'Malphite',  diff: 'easy', tip: 'He scales on armor — your %max HP R cuts through. Take Conqueror. Push and TP-roam.',                            runeId: null,              itemNote: '' },
      { enemy: 'Fiora',     diff: 'hard', tip: 'Bait her Riposte before using Q. Short trades only, never extended. Buy Bramble Vest early.',                    runeId: null,              itemNote: 'Bramble Vest rush is mandatory' },
      { enemy: 'Nasus',     diff: 'easy', tip: 'Bully him early, deny his Q stacks. He spikes at level 6+items — end before then or roam.',                      runeId: null,              itemNote: '' },
    ]
    for (const m of garenMatchups) {
      db.prepare('INSERT INTO matchups (champion_id, enemy_name, difficulty, laning_tip, rune_page_id, item_notes) VALUES (?, ?, ?, ?, ?, ?)').run(garenId, m.enemy, m.diff, m.tip, m.runeId, m.itemNote)
    }

    // ── Jinx (Bot) ────────────────────────────────────────────────────────────
    const jinxId = db.prepare(
      'INSERT INTO my_champions (name, role, comfort, notes) VALUES (?, ?, ?, ?)'
    ).run('Jinx', 'Bot', 4, 'Late-game hypercarry. Weak early. Needs peel support.').lastInsertRowid

    const jinxRuneId = db.prepare(`
      INSERT INTO rune_pages (champion_id, label, is_default, primary_path, keystone, slot1, slot2, slot3, secondary_path, sec1, sec2, shard_offense, shard_flex, shard_defense)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(jinxId, 'Lethal Tempo', 'Precision', 'LethalTempo', 'Triumph', 'LegendBloodline', 'LastStand', 'Domination', 'TasteOfBlood', 'TreasureHunter', 'Attack Speed', 'Adaptive Force', 'Health Scaling').lastInsertRowid

    const jinxFleetRuneId = db.prepare(`
      INSERT INTO rune_pages (champion_id, label, is_default, primary_path, keystone, slot1, slot2, slot3, secondary_path, sec1, sec2, shard_offense, shard_flex, shard_defense)
      VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(jinxId, 'Fleet vs Poke', 'Precision', 'FleetFootwork', 'Triumph', 'LegendBloodline', 'LastStand', 'Inspiration', 'BiscuitDelivery', 'TimeWarpTonic', 'Attack Speed', 'Adaptive Force', 'Health Scaling').lastInsertRowid

    const jinxBuildId = db.prepare(
      'INSERT INTO builds (champion_id, label, is_default) VALUES (?, ?, 1)'
    ).run(jinxId, 'Standard').lastInsertRowid

    const jinxItems = [
      { name: "Doran's Blade",      id: 1055, slot: 'starter',    idx: 0, note: '' },
      { name: 'Kraken Slayer',      id: 6672, slot: 'core',        idx: 0, note: 'Always first item' },
      { name: "Runaan's Hurricane", id: 3085, slot: 'core',        idx: 1, note: 'Teamfight AoE' },
      { name: 'Infinity Edge',      id: 3031, slot: 'core',        idx: 2, note: 'After 60% crit' },
      { name: "Berserker's Greaves",id: 3006, slot: 'boots',       idx: 0, note: 'Standard' },
      { name: "Lord Dominik's",     id: 3036, slot: 'situational', idx: 0, note: 'VS 2+ tanks' },
      { name: 'Mortal Reminder',    id: 3033, slot: 'situational', idx: 1, note: 'VS healing comps' },
      { name: 'Immortal Shieldbow', id: 6673, slot: 'situational', idx: 2, note: 'VS burst/dive heavy' },
    ]
    for (const i of jinxItems) insertItem.run(jinxBuildId, i.name, i.id, i.slot, i.idx, i.note)

    const jinxMatchups = [
      { enemy: 'Draven',   diff: 'hard', tip: 'Play under tower levels 1-3. Never trade 1v1. Wait for him to drop axes. Scale to 3 items.', runeId: null,           itemNote: 'Immortal Shieldbow if very behind' },
      { enemy: 'Caitlyn',  diff: 'even', tip: 'Step out of Headshot range. Use E in lane to zone her. Scale and outfight mid-game.',        runeId: jinxFleetRuneId, itemNote: '' },
      { enemy: 'Ashe',     diff: 'easy', tip: 'Win short trades with Minigun. Dodge her volley. She has no mobility — all-in post-6.',      runeId: null,           itemNote: '' },
      { enemy: 'Ezreal',   diff: 'even', tip: 'Dodge Q. Trade when his Q is on cooldown. He outscales you in very long games.',             runeId: null,           itemNote: '' },
      { enemy: "Kog'Maw",  diff: 'easy', tip: "No escape — dive him. He has more DPS late but you win mid-game spike hard.",               runeId: null,           itemNote: '' },
    ]
    for (const m of jinxMatchups) {
      db.prepare('INSERT INTO matchups (champion_id, enemy_name, difficulty, laning_tip, rune_page_id, item_notes) VALUES (?, ?, ?, ?, ?, ?)').run(jinxId, m.enemy, m.diff, m.tip, m.runeId, m.itemNote)
    }

    // ── Ahri (Mid) ────────────────────────────────────────────────────────────
    const ahriId = db.prepare(
      'INSERT INTO my_champions (name, role, comfort, notes) VALUES (?, ?, ?, ?)'
    ).run('Ahri', 'Mid', 3, 'Roam-heavy assassin. Wins by snowballing side lanes, not trading.').lastInsertRowid

    const ahriRuneId = db.prepare(`
      INSERT INTO rune_pages (champion_id, label, is_default, primary_path, keystone, slot1, slot2, slot3, secondary_path, sec1, sec2, shard_offense, shard_flex, shard_defense)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ahriId, 'Electrocute Burst', 'Domination', 'Electrocute', 'TasteOfBlood', 'EyeballCollection', 'TreasureHunter', 'Sorcery', 'ManaflowBand', 'Transcendence', 'Adaptive Force', 'Adaptive Force', 'Health Scaling').lastInsertRowid

    const ahriPhaseRuneId = db.prepare(`
      INSERT INTO rune_pages (champion_id, label, is_default, primary_path, keystone, slot1, slot2, slot3, secondary_path, sec1, sec2, shard_offense, shard_flex, shard_defense)
      VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ahriId, 'Phase Rush vs Zed', 'Sorcery', 'PhaseRush', 'ManaflowBand', 'Transcendence', 'GatheringStorm', 'Domination', 'TasteOfBlood', 'TreasureHunter', 'Adaptive Force', 'Adaptive Force', 'Health Scaling').lastInsertRowid

    const ahriBuildId = db.prepare(
      'INSERT INTO builds (champion_id, label, is_default) VALUES (?, ?, 1)'
    ).run(ahriId, 'Standard').lastInsertRowid

    const ahriItems = [
      { name: "Doran's Ring",        id: 1056, slot: 'starter',    idx: 0, note: '' },
      { name: "Luden's Tempest",     id: 6655, slot: 'core',        idx: 0, note: 'Roam amplifier + poke' },
      { name: "Shadowflame",         id: 4645, slot: 'core',        idx: 1, note: 'VS shields' },
      { name: "Rabadon's Deathcap",  id: 3089, slot: 'core',        idx: 2, note: 'Power spike #3' },
      { name: "Sorcerer's Shoes",    id: 3020, slot: 'boots',       idx: 0, note: 'Standard' },
      { name: "Zhonya's Hourglass",  id: 3157, slot: 'situational', idx: 0, note: 'VS Zed/Fizz/AD assassins' },
      { name: "Banshee's Veil",      id: 3102, slot: 'situational', idx: 1, note: 'VS poke/engage mages' },
      { name: "Void Staff",          id: 3135, slot: 'situational', idx: 2, note: 'VS MR stacking' },
    ]
    for (const i of ahriItems) insertItem.run(ahriBuildId, i.name, i.id, i.slot, i.idx, i.note)

    const ahriMatchups = [
      { enemy: 'Zed',      diff: 'hard', tip: 'Phase Rush to escape his R combo. Use R dashes to dodge W+Q poke. Buy Zhonya.',    runeId: ahriPhaseRuneId, itemNote: "Zhonya's active during his R" },
      { enemy: 'Syndra',   diff: 'even', tip: 'Dodge E spheres. Trade after she uses Q+E combo. Push and roam.',                  runeId: null,            itemNote: "Banshee's Veil if she's ahead" },
      { enemy: 'Viktor',   diff: 'even', tip: 'Respect his E laser. Charm him when he steps forward to last-hit.',                runeId: null,            itemNote: '' },
      { enemy: 'LeBlanc',  diff: 'hard', tip: 'Save R mobility to dodge her chain. Trade only after she uses W dash.',            runeId: null,            itemNote: "Banshee's Veil first item" },
      { enemy: 'Orianna',  diff: 'easy', tip: 'Charm her when she steps up for Q poke. No escape — all-in post-6.',               runeId: null,            itemNote: '' },
    ]
    for (const m of ahriMatchups) {
      db.prepare('INSERT INTO matchups (champion_id, enemy_name, difficulty, laning_tip, rune_page_id, item_notes) VALUES (?, ?, ?, ?, ?, ?)').run(ahriId, m.enemy, m.diff, m.tip, m.runeId, m.itemNote)
    }
  })()

  console.log('Seed complete: Garen (Top), Jinx (Bot), Ahri (Mid) — patch 16.8.1')
}
