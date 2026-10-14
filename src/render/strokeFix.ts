import Phaser from 'phaser';

/**
 * Phaser's WebGL stroke ("A well-formed path has no zero length segments, so we don't check", `DrawLine`) divides each
 * segment by its length, so a segment of length 0 puts NaN in the vertices. Some GPUs (phones) draw those as a line to
 * the corner of the screen. Zero-length segments come from three places in our drawing: `strokePoints(pts, true, true)`
 * closes the shape twice (a copy of the first point is added by each flag), warnings that start at size 0 (an ellipse or
 * wedge whose radius has not grown yet), and lanes or arcs with no length.
 *
 * `strokePoints` (which `strokeEllipse` uses too) is wrapped to drop repeated and non-finite points, to close a shape
 * once, and to draw nothing when fewer than two distinct points are left.
 */
const SAME = 1e-4;

export function fixStrokes(): void {
  const proto = Phaser.GameObjects.Graphics.prototype as unknown as {
    strokePoints: (
      this: Phaser.GameObjects.Graphics,
      points: { x: number; y: number }[],
      closeShape?: boolean,
      closePath?: boolean,
      endIndex?: number,
    ) => Phaser.GameObjects.Graphics;
    __strokeFixed?: boolean;
  };
  if (proto.__strokeFixed) return;
  proto.__strokeFixed = true;
  const original = proto.strokePoints;
  proto.strokePoints = function (
    points,
    closeShape = false,
    closePath = false,
    endIndex = points.length,
  ) {
    const kept: { x: number; y: number }[] = [];
    for (let i = 0; i < endIndex && i < points.length; i++) {
      const p = points[i]!;
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      const last = kept[kept.length - 1];
      if (last && Math.abs(p.x - last.x) < SAME && Math.abs(p.y - last.y) < SAME) continue;
      kept.push(p);
    }
    const closed = closeShape || closePath;
    if (closed) {
      const first = kept[0];
      const last = kept[kept.length - 1];
      if (
        first &&
        last &&
        kept.length > 1 &&
        Math.abs(first.x - last.x) < SAME &&
        Math.abs(first.y - last.y) < SAME
      )
        kept.pop();
    }
    if (kept.length < 2) return this;
    // Close once, with the path flag: it also joins the last segment to the first.
    return original.call(this, kept as Phaser.Math.Vector2[], false, closed);
  };

  // The safety net for the paths built by hand (trails, bolts): a segment of length 0 is given a length of a thousandth
  // of a pixel, so its corners are finite.
  const line = Phaser.Renderer.WebGL.RenderNodes.DrawLine.prototype as unknown as {
    run: (...args: unknown[]) => unknown;
  };
  const run = line.run;
  line.run = function (this: unknown, ...args: unknown[]) {
    // (drawingContext, currentMatrix, ax, ay, bx, by, aLineWidth, bLineWidth, vertices)
    if (args[2] === args[4] && args[3] === args[5]) args[4] = (args[4] as number) + 1e-3;
    return run.apply(this, args);
  };
}
