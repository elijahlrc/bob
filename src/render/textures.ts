import Phaser from 'phaser';

export const TILE = 32;

/** Damage-type colours: physical, lightning, cold, fire, chaos. */
export const DTYPE_COLORS = [0xe8e2d0, 0xc890ff, 0x8fd8ff, 0xff8a3a, 0x8ae05a];
export const RARITY_COLORS: Record<string, number> = {
  magic: 0x6a8cff,
  rare: 0xffd84a,
  miniboss: 0xff9a2a,
  boss: 0xff5a2a,
};
export const VARIANT_TINTS: Record<string, number> = {
  none: 0xffffff,
  fire: 0xffa060,
  cold: 0xa8e0ff,
  lightning: 0xd0a0ff,
};

function shade(c: number, f: number): string {
  const r = Math.min(255, Math.max(0, Math.round(((c >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((c >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((c & 255) * f)));
  return `rgb(${r},${g},${b})`;
}

/** Floor/wall tileset for a theme: index 0–1 floor variants, 2 wall, 3 wall edge. */
export function makeTileset(scene: Phaser.Scene, key: string, floor: number, wall: number): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, TILE * 4, TILE)!;
  const ctx = tex.getContext();
  for (let t = 0; t < 4; t++) {
    const ox = t * TILE;
    const base = t < 2 ? floor : wall;
    ctx.fillStyle = shade(base, t === 1 ? 0.92 : t === 3 ? 1.25 : 1);
    ctx.fillRect(ox, 0, TILE, TILE);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = shade(base, 0.8 + Math.random() * 0.4);
      ctx.fillRect(ox + Math.floor(Math.random() * TILE), Math.floor(Math.random() * TILE), 2, 2);
    }
    if (t >= 2) {
      ctx.strokeStyle = shade(base, 0.6);
      ctx.strokeRect(ox + 0.5, 0.5, TILE - 1, TILE - 1);
    } else {
      ctx.fillStyle = shade(base, 0.85);
      ctx.fillRect(ox, TILE - 1, TILE, 1);
      ctx.fillRect(ox + TILE - 1, 0, 1, TILE);
    }
  }
  tex.refresh();
}

/** Bake the entity textures once at boot (§14.5). */
export function makeEntityTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('player')) return;
  const g = scene.make.graphics({}, false);
  const bake = (key: string, w: number, h: number, draw: () => void) => {
    g.clear();
    draw();
    g.generateTexture(key, w, h);
  };
  const bone = 0xe9e4d4;
  const dark = 0x2a2620;
  // Player: a circle with a facing wedge (tinted by class colour).
  bake('player', 32, 32, () => {
    g.fillStyle(0xffffff, 1).fillCircle(16, 16, 12);
    g.fillStyle(0x222222, 1).fillTriangle(30, 16, 20, 10, 20, 22);
    g.lineStyle(2, 0x111111, 1).strokeCircle(16, 16, 12);
  });
  // Warrior: circle with a blade line.
  bake('warrior', 32, 32, () => {
    g.fillStyle(bone, 1).fillCircle(16, 16, 11);
    g.fillStyle(dark, 1).fillCircle(12, 13, 2).fillCircle(20, 13, 2);
    g.lineStyle(3, 0xb8c0c8, 1).lineBetween(16, 16, 31, 8);
  });
  // Brute: large, square-ish.
  bake('brute', 44, 44, () => {
    g.fillStyle(bone, 1).fillRoundedRect(4, 4, 36, 36, 8);
    g.fillStyle(dark, 1).fillRect(12, 14, 6, 5).fillRect(26, 14, 6, 5);
    g.fillRect(14, 28, 16, 3);
  });
  // Archer: circle with a bow arc.
  bake('archer', 32, 32, () => {
    g.fillStyle(bone, 1).fillCircle(14, 16, 10);
    g.fillStyle(dark, 1).fillCircle(11, 13, 2).fillCircle(17, 13, 2);
    g.lineStyle(2, 0x8a5a2a, 1).beginPath().arc(18, 16, 12, -1.1, 1.1).strokePath();
  });
  // Mage: circle with an orb.
  bake('mage', 32, 32, () => {
    g.fillStyle(bone, 1).fillCircle(14, 17, 10);
    g.fillStyle(dark, 1).fillCircle(11, 15, 2).fillCircle(17, 15, 2);
    g.fillStyle(0xffffff, 1).fillCircle(25, 8, 5);
  });
  // The Ossuary Regent: a huge crowned skull.
  bake('boss', 64, 64, () => {
    g.fillStyle(bone, 1).fillCircle(32, 36, 24);
    g.fillStyle(dark, 1).fillCircle(23, 34, 6).fillCircle(41, 34, 6);
    g.fillRect(24, 48, 16, 4);
    g.fillStyle(0xd8b040, 1)
      .fillTriangle(12, 16, 20, 2, 26, 16)
      .fillTriangle(26, 14, 32, 0, 38, 14)
      .fillTriangle(38, 16, 44, 2, 52, 16);
    g.fillRect(12, 14, 40, 5);
  });
  bake('ring', 64, 64, () => {
    g.lineStyle(3, 0xffffff, 1).strokeCircle(32, 32, 29);
  });
  bake('proj', 12, 12, () => {
    g.fillStyle(0xffffff, 1).fillCircle(6, 6, 5);
  });
  bake('chest', 24, 20, () => {
    g.fillStyle(0x8a5a2a, 1).fillRect(1, 4, 22, 15);
    g.fillStyle(0xd8b040, 1).fillRect(1, 9, 22, 3).fillRect(10, 8, 4, 6);
  });
  bake('drop', 16, 16, () => {
    g.fillStyle(0xffffff, 1).fillTriangle(8, 1, 15, 8, 8, 15).fillTriangle(8, 1, 1, 8, 8, 15);
  });
  bake('exit', 48, 48, () => {
    g.lineStyle(4, 0x7af0ff, 1).strokeCircle(24, 24, 18);
    g.lineStyle(2, 0xffffff, 0.8).strokeCircle(24, 24, 11);
  });
  bake('pip', 8, 8, () => {
    g.fillStyle(0xffffff, 1).fillCircle(4, 4, 3);
  });
  bake('star', 24, 24, () => {
    g.fillStyle(0xffe060, 1);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.fillCircle(12 + Math.cos(a) * 9, 12 + Math.sin(a) * 9, 2.5);
    }
  });
  g.destroy();
}
