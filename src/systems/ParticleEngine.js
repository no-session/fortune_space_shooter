/**
 * ParticleEngine — Reusable particle system for all visual effects.
 *
 * Usage:
 *   const pe = new ParticleEngine(scene);
 *   pe.createBurst(x, y, { count: 20, colors: [0xff0000], minSpeed: 50, maxSpeed: 200 });
 *   pe.createStream(x, y, { count: 3, colors: [0x00ffff], interval: 100 });
 *   pe.createTrail(sprite, { colors: [0xff8800], count: 1, interval: 50 });
 *
 * Config options:
 *   count, colors[], minSpeed, maxSpeed, minLife, maxLife, gravity,
 *   fadeOut, spin, shape('circle'|'square'|'triangle'), minSize, maxSize
 */
export default class ParticleEngine {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];    // all active particle objects
        this.streams = [];      // active stream emitters
        this.trails = [];       // active trail attachments
        this.MAX_PARTICLES = 200;
    }

    // ── Defaults ──────────────────────────────────────────
    static defaults() {
        return {
            count: 10,
            colors: [0xffffff],
            minSpeed: 50,
            maxSpeed: 200,
            minLife: 300,
            maxLife: 800,
            gravity: 0,
            fadeOut: true,
            spin: 0,          // radians per second
            shape: 'circle',  // 'circle' | 'square' | 'triangle'
            minSize: 2,
            maxSize: 5,
            depth: 100
        };
    }

    // ── Burst ─────────────────────────────────────────────
    // Spawn N particles in a radial burst at (x, y).
    createBurst(x, y, userCfg = {}) {
        const cfg = { ...ParticleEngine.defaults(), ...userCfg };

        for (let i = 0; i < cfg.count; i++) {
            this._enforceLimit();

            const angle = Math.random() * Math.PI * 2;
            const speed = Phaser.Math.Between(cfg.minSpeed, cfg.maxSpeed);
            const life = Phaser.Math.Between(cfg.minLife, cfg.maxLife);
            const size = Phaser.Math.FloatBetween(cfg.minSize, cfg.maxSize);
            const color = Phaser.Utils.Array.GetRandom(cfg.colors);

            const p = this._createShape(x, y, cfg.shape, size, color, cfg.depth);
            if (!p) continue;

            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            p._pe = { vx, vy, gravity: cfg.gravity, spin: cfg.spin, life, elapsed: 0, fadeOut: cfg.fadeOut };
            this.particles.push(p);

            // Tween-based lifecycle
            this.scene.tweens.add({
                targets: p,
                alpha: cfg.fadeOut ? 0 : p.alpha,
                scale: { from: p.scaleX, to: p.scaleX * 0.3 },
                duration: life,
                onUpdate: () => {
                    if (!p.active) return;
                    const dt = this.scene.game.loop.delta / 1000;
                    p.x += p._pe.vx * dt;
                    p.y += p._pe.vy * dt;
                    p._pe.vy += p._pe.gravity * dt;
                    if (p._pe.spin) p.rotation += p._pe.spin * dt;
                },
                onComplete: () => {
                    this._removeParticle(p);
                }
            });
        }
    }

    // ── Stream ────────────────────────────────────────────
    // Continuous emission at a fixed position. Returns a handle with stop().
    createStream(x, y, userCfg = {}) {
        const cfg = { ...ParticleEngine.defaults(), count: 2, ...userCfg };
        const interval = cfg.interval || 100;

        const timer = this.scene.time.addEvent({
            delay: interval,
            loop: true,
            callback: () => {
                this.createBurst(x, y, { ...cfg, count: cfg.count });
            }
        });

        const handle = { timer, stop: () => timer.destroy() };
        this.streams.push(handle);
        return handle;
    }

    // ── Trail ─────────────────────────────────────────────
    // Attach a particle trail to a moving game object. Returns handle with stop().
    createTrail(target, userCfg = {}) {
        const cfg = {
            ...ParticleEngine.defaults(),
            count: 1,
            minSpeed: 10,
            maxSpeed: 40,
            minLife: 150,
            maxLife: 400,
            minSize: 1,
            maxSize: 3,
            ...userCfg
        };
        const interval = cfg.interval || 60;

        const timer = this.scene.time.addEvent({
            delay: interval,
            loop: true,
            callback: () => {
                if (!target || !target.active) return;
                this.createBurst(target.x, target.y, { ...cfg });
            }
        });

        const handle = { timer, target, stop: () => timer.destroy() };
        this.trails.push(handle);
        return handle;
    }

    // ── Shape Factory ─────────────────────────────────────
    _createShape(x, y, shape, size, color, depth) {
        let obj;
        if (shape === 'square') {
            obj = this.scene.add.rectangle(x, y, size * 2, size * 2, color);
        } else if (shape === 'triangle') {
            // Use a small triangle via graphics rendered to texture (fast approach: use rectangle rotated)
            obj = this.scene.add.rectangle(x, y, size * 2, size * 2, color);
            obj.rotation = Math.PI / 4; // diamond look
        } else {
            // Default: circle
            obj = this.scene.add.circle(x, y, size, color);
        }
        obj.setDepth(depth);
        obj.setAlpha(0.9);
        return obj;
    }

    // ── Particle Limit ────────────────────────────────────
    _enforceLimit() {
        while (this.particles.length >= this.MAX_PARTICLES) {
            const oldest = this.particles.shift();
            if (oldest && oldest.active) oldest.destroy();
        }
    }

    _removeParticle(p) {
        const idx = this.particles.indexOf(p);
        if (idx >= 0) this.particles.splice(idx, 1);
        if (p && p.active) p.destroy();
    }

    // ── Cleanup ───────────────────────────────────────────
    destroy() {
        this.particles.forEach(p => { if (p && p.active) p.destroy(); });
        this.particles = [];
        this.streams.forEach(s => s.stop());
        this.streams = [];
        this.trails.forEach(t => t.stop());
        this.trails = [];
    }
}
