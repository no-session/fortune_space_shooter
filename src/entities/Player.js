import Phaser from 'phaser';
import { GAME_CONFIG, SHIP_SKINS, WEAPON_TYPES, WEAPON_CONFIG } from '../utils/constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_m');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setScale(0.8);
        this.setDepth(100);

        // Apply selected skin
        this.skinId = localStorage.getItem('fortune-selected-skin') || 'default';
        this.rainbowTween = null;
        this.applySkin();

        // Trail effect
        this.trailSprites = [];
        this.trailFrameCount = 0;
        
        // Player stats
        this.health = GAME_CONFIG.PLAYER_HEALTH;
        this.maxHealth = GAME_CONFIG.PLAYER_HEALTH;
        this.speed = GAME_CONFIG.PLAYER_SPEED;
        this.lives = GAME_CONFIG.PLAYER_LIVES;
        
        // Weapon stats
        this.fireRate = 150; // milliseconds between shots
        this.lastFired = 0;
        this.bulletSpeed = GAME_CONFIG.BULLET_SPEED;
        this.bulletSpread = 1; // number of bullets per shot
        this.weaponLevel = 1;

        // Weapon type system
        this.currentWeapon = WEAPON_TYPES.BLASTER;
        this.availableWeapons = [WEAPON_TYPES.BLASTER]; // unlocked via XP
        this.laserGraphic = null;
        this.laserActive = false;
        
        // Controls
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Bullet group
        this.bullets = scene.physics.add.group();
        
        // Manual fire only (space bar)
        this.autoFire = false;
        this.isFiring = false;
        
        // Banking animation state
        this.currentFrame = 'player_m';
        this.bankingTween = null;
        
        // Exhaust effect
        this.createExhaust();
        
        // Invincibility and dying state
        this.invincible = false;
        this.isDying = false;

        // Power-up states
        this.shieldHits = 0;
        this.shieldGraphic = null;
        this.shieldNodes = [];
        this.shieldAngle = 0;
        this.rapidFire = false;
        this.baseFireRate = this.fireRate;
        this.magnetActive = false;
        this.baseMagnetRange = 80;
        
        // Mobile velocity (set by TouchControls)
        this.mobileVelocityX = 0;
        this.mobileVelocityY = 0;
        this.mobileActive = false;

        // Set up input
        this.setupInput();

        // Override setActive to log unexpected deactivation
        const originalSetActive = this.setActive.bind(this);
        this.setActive = (value) => {
            if (!value && this.lives > 0 && !this.isDying) {
                console.error('WARNING: setActive(false) called on living player!', new Error().stack);
            }
            return originalSetActive(value);
        };
    }

    applySkin() {
        const skin = SHIP_SKINS[this.skinId];
        if (!skin) return;

        // Stop any existing rainbow tween
        if (this.rainbowTween) {
            this.rainbowTween.destroy();
            this.rainbowTween = null;
        }

        if (skin.tint === 'rainbow') {
            // Cycle through rainbow colors
            let colorIndex = 0;
            this.rainbowTween = this.scene.time.addEvent({
                delay: 500,
                callback: () => {
                    if (this.active) {
                        this.setTint(skin.colors[colorIndex]);
                        colorIndex = (colorIndex + 1) % skin.colors.length;
                    }
                },
                loop: true
            });
        } else if (skin.tint) {
            this.setTint(skin.tint);
        } else {
            this.clearTint();
        }
    }

    updateTrail() {
        this.trailFrameCount++;
        if (this.trailFrameCount % 3 !== 0) return;
        if (!this.body) return;

        const speed = Math.abs(this.body.velocity.x) + Math.abs(this.body.velocity.y);
        if (speed < 50) return;

        // Create trail sprite
        const trail = this.scene.add.image(this.x, this.y, this.currentFrame);
        trail.setScale(this.scaleX);
        trail.setDepth(99);
        trail.setAlpha(0.4);

        // Tint based on power-up state
        if (this.rapidFire) {
            trail.setTint(0xff4444);
        } else if (this.magnetActive) {
            trail.setTint(0xffd700);
        } else {
            const skin = SHIP_SKINS[this.skinId];
            if (skin && skin.tint && skin.tint !== 'rainbow') {
                trail.setTint(skin.tint);
            }
        }

        this.trailSprites.push(trail);

        // Fade out
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                trail.destroy();
                const idx = this.trailSprites.indexOf(trail);
                if (idx >= 0) this.trailSprites.splice(idx, 1);
            }
        });

        // Limit max trail sprites
        while (this.trailSprites.length > 8) {
            const old = this.trailSprites.shift();
            if (old) old.destroy();
        }
    }

    restoreSkinTint() {
        const skin = SHIP_SKINS[this.skinId];
        if (!skin || !skin.tint || skin.tint === 'rainbow') {
            this.clearTint();
        } else {
            this.setTint(skin.tint);
        }
    }

    createExhaust() {
        // Create exhaust sprite behind the player
        // Check if the texture exists before creating the sprite
        if (!this.scene.textures.exists('exhaust_1')) {
            this.exhaust = null;
            return;
        }

        this.exhaust = this.scene.add.sprite(this.x, this.y + 30, 'exhaust_1');
        this.exhaust.setScale(0.6);
        this.exhaust.setDepth(99);

        // Check if animation exists before playing
        if (this.scene.anims.exists('exhaust')) {
            this.exhaust.play('exhaust');
        }
    }

    setupInput() {
        // Space bar for manual fire
        this.spaceKey.on('down', () => {
            this.isFiring = true;
        });

        this.spaceKey.on('up', () => {
            this.isFiring = false;
        });

        // Q key to cycle weapons
        this.qKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.qKey.on('down', () => {
            this.cycleWeapon();
        });
    }

    cycleWeapon() {
        if (this.availableWeapons.length <= 1) return;
        const idx = this.availableWeapons.indexOf(this.currentWeapon);
        const nextIdx = (idx + 1) % this.availableWeapons.length;
        this.currentWeapon = this.availableWeapons[nextIdx];

        // Clean up laser if switching away
        if (this.currentWeapon !== WEAPON_TYPES.LASER && this.laserGraphic) {
            this.laserGraphic.destroy();
            this.laserGraphic = null;
            this.laserActive = false;
        }

        // Show weapon switch popup
        if (this.scene && this.scene.effectManager) {
            const config = WEAPON_CONFIG[this.currentWeapon];
            this.scene.effectManager.showScorePopup(this.x, this.y - 40, config.name, {
                color: '#ffffff', size: '18px', prefix: ''
            });
        }
    }

    unlockWeapon(weaponType) {
        if (!this.availableWeapons.includes(weaponType)) {
            this.availableWeapons.push(weaponType);
        }
    }

    update(time) {
        // Safety check - don't update if physics body doesn't exist
        if (!this.body || !this.active) {
            // Attempt to recover if player should be alive
            if (this.lives > 0 && !this.isDying && this.scene) {
                // Recreate physics body if missing
                if (!this.body) {
                    this.scene.physics.add.existing(this);
                    this.setCollideWorldBounds(true);
                }
                // Reactivate if inactive
                if (!this.active) {
                    this.setActive(true);
                }
                this.setVisible(true);
                this.setAlpha(1);
            }
            return;
        }

        // Don't update if dying
        if (this.isDying) {
            this.setVelocity(0, 0);
            return;
        }

        // Visibility safety check
        if (this.lives > 0 && !this.isDying) {
            if (!this.visible || this.alpha < 0.1) {
                this.setAlpha(1);
                this.setVisible(true);
                this.setActive(true);
            }

            if (!this.invincible && this.alpha < 1.0) {
                this.setAlpha(1);
                this.setVisible(true);
            } else if (this.invincible && this.alpha < 0.5) {
                this.setAlpha(0.5);
                this.setVisible(true);
            }
        }

        // Movement — mobile joystick takes priority when active
        let velocityX = 0;
        let velocityY = 0;

        if (this.mobileActive) {
            velocityX = this.mobileVelocityX;
            velocityY = this.mobileVelocityY;
        } else {
            if (this.cursors.left.isDown || this.wasd.A.isDown) {
                velocityX = -this.speed;
            } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
                velocityX = this.speed;
            }

            if (this.cursors.up.isDown || this.wasd.W.isDown) {
                velocityY = -this.speed;
            } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
                velocityY = this.speed;
            }

            // Normalize diagonal movement
            if (velocityX !== 0 && velocityY !== 0) {
                velocityX *= 0.707;
                velocityY *= 0.707;
            }
        }

        this.setVelocity(velocityX, velocityY);
        
        // Update banking animation based on horizontal movement
        this.updateBankingAnimation(velocityX);

        // Trail effect
        this.updateTrail();

        // Update exhaust position
        if (this.exhaust) {
            this.exhaust.setPosition(this.x, this.y + 35);
        }

        // Update shield visual
        if (this.shieldHits > 0) {
            this.updateShield();
        }
        
        // Shooting
        if (this.currentWeapon === WEAPON_TYPES.LASER) {
            this.updateLaser(time);
        } else if (this.autoFire || this.isFiring) {
            if (time > this.lastFired) {
                this.shoot();
                this.lastFired = time + this.fireRate;
            }
        }

        // Update wave bullets (sine movement)
        const bulletsList = this.bullets.children.entries.slice();
        for (let i = bulletsList.length - 1; i >= 0; i--) {
            const bullet = bulletsList[i];
            if (bullet && bullet.active && bullet.isWaveBullet) {
                bullet.waveTime += 0.15;
                const config = WEAPON_CONFIG[WEAPON_TYPES.WAVE];
                const offsetX = Math.sin(bullet.waveTime + bullet.wavePhase) * config.amplitude;
                bullet.x = bullet.baseX + offsetX;
            }
        }
    }

    updateBankingAnimation(velocityX) {
        let targetFrame = 'player_m';
        
        if (velocityX < -50) {
            targetFrame = velocityX < -150 ? 'player_l2' : 'player_l1';
        } else if (velocityX > 50) {
            targetFrame = velocityX > 150 ? 'player_r2' : 'player_r1';
        }
        
        if (targetFrame !== this.currentFrame) {
            this.currentFrame = targetFrame;
            this.setTexture(targetFrame);
        }
    }

    shoot() {
        // Laser handled separately in update loop
        if (this.currentWeapon === WEAPON_TYPES.LASER) return;

        const bulletX = this.x;
        const bulletY = this.y - 30;

        // Determine bullet texture based on weapon level
        const bulletTexture = this.weaponLevel >= 3 ? 'bullet_proton1' : 'bullet_plasma1';

        let shotsCreated = 0;

        if (this.currentWeapon === WEAPON_TYPES.WAVE) {
            // Wave weapon: sine-wave bullets
            this.createWaveBullet(bulletX, bulletY, bulletTexture);
            shotsCreated = 1;
            if (this.bulletSpread >= 2) {
                this.createWaveBullet(bulletX - 15, bulletY, bulletTexture, Math.PI);
                shotsCreated = 2;
            }
            if (this.bulletSpread >= 3) {
                this.createWaveBullet(bulletX + 15, bulletY, bulletTexture, Math.PI / 2);
                shotsCreated = 3;
            }
        } else {
            // Blaster: default behavior
            if (this.bulletSpread === 1) {
                this.createBullet(bulletX, bulletY, 0, bulletTexture);
                shotsCreated = 1;
            } else if (this.bulletSpread === 2) {
                this.createBullet(bulletX - 15, bulletY, 0, bulletTexture);
                this.createBullet(bulletX + 15, bulletY, 0, bulletTexture);
                shotsCreated = 2;
            } else if (this.bulletSpread >= 3) {
                this.createBullet(bulletX, bulletY, 0, bulletTexture);
                this.createBullet(bulletX - 20, bulletY, -50, bulletTexture);
                this.createBullet(bulletX + 20, bulletY, 50, bulletTexture);
                shotsCreated = 3;
            }
        }

        // Track shots for accuracy bonus
        if (this.scene.bonusSystem) {
            for (let i = 0; i < shotsCreated; i++) {
                this.scene.bonusSystem.recordShotFired();
            }
        }

        // Play shoot sound if available
        if (this.scene.soundManager) {
            this.scene.soundManager.playShoot();
        }
    }

    createWaveBullet(x, y, texture, phaseOffset = 0) {
        const bullet = this.bullets.create(x, y, texture);
        if (bullet) {
            bullet.setVelocityY(-this.bulletSpeed);
            bullet.setScale(0.5);
            bullet.setDepth(50);
            bullet.body.allowGravity = false;
            bullet.setTint(WEAPON_CONFIG[WEAPON_TYPES.WAVE].color);
            // Store wave properties for sine movement
            bullet.isWaveBullet = true;
            bullet.waveTime = 0;
            bullet.wavePhase = phaseOffset;
            bullet.baseX = x;
        }
    }

    updateLaser(time) {
        if (this.currentWeapon !== WEAPON_TYPES.LASER) {
            if (this.laserGraphic) {
                this.laserGraphic.destroy();
                this.laserGraphic = null;
                this.laserActive = false;
            }
            return;
        }

        if (!this.isFiring && !this.autoFire) {
            if (this.laserGraphic) {
                this.laserGraphic.setVisible(false);
                this.laserActive = false;
            }
            return;
        }

        this.laserActive = true;
        const config = WEAPON_CONFIG[WEAPON_TYPES.LASER];
        const beamX = this.x;
        const beamTopY = 0;
        const beamBottomY = this.y - 25;
        const beamHeight = beamBottomY - beamTopY;

        if (!this.laserGraphic) {
            this.laserGraphic = this.scene.add.rectangle(
                beamX, beamTopY + beamHeight / 2,
                config.beamWidth, beamHeight,
                config.color, 0.7
            );
            this.laserGraphic.setDepth(95);
        } else {
            this.laserGraphic.setPosition(beamX, beamTopY + beamHeight / 2);
            this.laserGraphic.setSize(config.beamWidth, beamHeight);
            this.laserGraphic.setVisible(true);
        }

        // Pulse width for visual effect
        const pulse = 1 + 0.3 * Math.sin(time * 0.01);
        this.laserGraphic.setScale(pulse, 1);
    }

    createBullet(x, y, offsetX, texture) {
        const bullet = this.bullets.create(x, y, texture);
        if (bullet) {
            bullet.setVelocityY(-this.bulletSpeed);
            bullet.setVelocityX(offsetX);
            bullet.setScale(0.5);
            bullet.setDepth(50);
            bullet.body.allowGravity = false;
        }
    }

    takeDamage(amount) {
        if (this.invincible || this.isDying) return;
        if (!this.scene || !this.scene.time) return; // Safety check
        if (!this.active || !this.visible) return; // Don't take damage if not visible

        // Shield absorbs hit
        if (this.shieldHits > 0) {
            this.absorbShieldHit();
            // Play hit sound but no damage
            if (this.scene.soundManager) {
                this.scene.soundManager.playHit();
            }
            return;
        }

        this.health -= amount;

        // Break kill streak on damage
        if (this.scene.streakManager) {
            this.scene.streakManager.resetStreak();
        }

        // Track damage for wave bonus
        if (this.scene.bonusSystem) {
            this.scene.bonusSystem.recordDamageTaken();
        }

        // Play hit sound
        if (this.scene.soundManager) {
            this.scene.soundManager.playHit();
        }

        // Brief invincibility after taking damage
        this.invincible = true;
        this.scene.time.delayedCall(200, () => {
            if (!this.isDying) {
                this.invincible = false;
            }
        });

        // Flash effect (but don't affect alpha during blink animation)
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            // Restore skin tint instead of clearing
            this.restoreSkinTint();
        });

        // Screen shake
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(100, 0.01);
        }

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        if (this.isDying) return;
        this.isDying = true;
        this.invincible = true;

        this.lives--;

        // Create explosion
        this.createDeathExplosion();

        // Play explosion sound
        if (this.scene.soundManager) {
            this.scene.soundManager.playExplosion();
        }

        if (this.lives > 0) {
            // Hide player temporarily during death animation
            this.setAlpha(0);
            this.setVisible(false);

            // IMPORTANT: Also hide the exhaust sprite
            if (this.exhaust) {
                this.exhaust.setVisible(false);
            }

            // Respawn after short delay
            if (this.scene && this.scene.time) {
                this.scene.time.delayedCall(500, () => {
                    // Reset player state
                    this.health = this.maxHealth;
                    this.setPosition(this.scene.scale.width / 2, this.scene.scale.height - 50);
                    this.isDying = false;

                    // FORCE visibility
                    this.setAlpha(1);
                    this.setActive(true);
                    this.setVisible(true);

                    // IMPORTANT: Also show the exhaust sprite
                    if (this.exhaust) {
                        this.exhaust.setVisible(true);
                    }

                    // Stop any existing blink tweens first
                    if (this.blinkTween) {
                        if (this.blinkTween.isPlaying()) {
                            this.blinkTween.stop();
                        }
                        this.blinkTween = null;
                    }

                    // Blink effect during invincibility (NO alpha below 0.5)
                    this.blinkTween = this.scene.tweens.add({
                        targets: this,
                        alpha: { from: 0.5, to: 1.0 },
                        duration: 150,
                        repeat: 10,
                        yoyo: true,
                        onComplete: () => {
                            // FORCE full visibility when tween completes
                            if (this.active) {
                                this.setAlpha(1);
                                this.setVisible(true);
                            }
                        }
                    });

                    // End invincibility after 2 seconds
                    this.scene.time.delayedCall(2000, () => {
                        this.invincible = false;

                        // FORCE full visibility
                        if (this.active) {
                            this.setAlpha(1);
                            this.setVisible(true);
                        }

                        // Stop tween if still playing
                        if (this.blinkTween && this.blinkTween.isPlaying()) {
                            this.blinkTween.stop();
                        }
                        this.blinkTween = null;
                    });
                });
            }
        } else {
            // Game over - no more lives
            this.setAlpha(0); // Hide player
            this.isDying = false;

            // IMPORTANT: Also hide the exhaust sprite
            if (this.exhaust) {
                this.exhaust.setVisible(false);
            }

            // Trigger game over after a short delay
            if (this.scene && this.scene.time && this.scene.triggerGameOver) {
                this.scene.time.delayedCall(1000, () => {
                    this.scene.triggerGameOver();
                });
            }
        }
    }

    createDeathExplosion() {
        // Check if explosion texture exists
        if (!this.scene.textures.exists('explosion1_1')) {
            return;
        }
        
        const explosion = this.scene.add.sprite(this.x, this.y, 'explosion1_1');
        explosion.setScale(1.5);
        explosion.setDepth(200);
        
        // Check if animation exists before playing
        if (this.scene.anims.exists('explode_medium')) {
            explosion.play('explode_medium');
            explosion.on('animationcomplete', () => {
                explosion.destroy();
            });
        } else {
            // Fallback: destroy after a short delay
            this.scene.time.delayedCall(300, () => {
                explosion.destroy();
            });
        }
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    upgradeWeapon() {
        this.weaponLevel++;
        if (this.weaponLevel === 2) {
            this.bulletSpread = 2;
            this.fireRate = 120;
        } else if (this.weaponLevel === 3) {
            this.bulletSpread = 3;
            this.fireRate = 100;
        } else if (this.weaponLevel >= 4) {
            this.bulletSpread = 4;
            this.fireRate = 80;
        }
    }

    upgradeSpeed() {
        this.speed += 50;
    }

    // Power-up: Shield (hexagonal force field)
    activateShield(hits) {
        this.shieldHits = hits;
        this.shieldAngle = 0;
        this.shieldNodes = [];

        // Clean up old shield
        if (this.shieldGraphic) {
            this.shieldGraphic.destroy();
        }
        this.shieldNodes.forEach(n => { if (n) n.destroy(); });
        this.shieldNodes = [];

        // Create 6 small circles in hexagonal arrangement
        for (let i = 0; i < 6; i++) {
            const node = this.scene.add.circle(0, 0, 5, 0x00aaff, 0.7);
            node.setStrokeStyle(1, 0x00ddff, 0.9);
            node.setDepth(101);
            this.shieldNodes.push(node);
        }

        // Center shield graphic (connecting lines)
        this.shieldGraphic = this.scene.add.graphics();
        this.shieldGraphic.setDepth(100);
    }

    updateShield() {
        if (this.shieldHits <= 0 || this.shieldNodes.length === 0) return;

        this.shieldAngle += 0.02;
        const radius = 32;
        const cracking = this.shieldHits === 1;

        for (let i = 0; i < this.shieldNodes.length; i++) {
            const angle = this.shieldAngle + (Math.PI * 2 * i) / 6;
            const nx = this.x + Math.cos(angle) * radius;
            const ny = this.y + Math.sin(angle) * radius;
            this.shieldNodes[i].setPosition(nx, ny);

            if (cracking) {
                // Flicker red when about to break
                const flicker = Math.sin(this.scene.time.now * 0.02) > 0 ? 0.7 : 0.2;
                this.shieldNodes[i].setFillStyle(0xff3333, flicker);
                this.shieldNodes[i].setStrokeStyle(1, 0xff6666, flicker);
            } else {
                this.shieldNodes[i].setFillStyle(0x00aaff, 0.7);
                this.shieldNodes[i].setStrokeStyle(1, 0x00ddff, 0.9);
            }
        }

        // Draw connecting lines
        if (this.shieldGraphic) {
            this.shieldGraphic.clear();
            const lineColor = cracking ? 0xff3333 : 0x00aaff;
            const lineAlpha = cracking ? 0.3 : 0.25;
            this.shieldGraphic.lineStyle(1, lineColor, lineAlpha);
            this.shieldGraphic.beginPath();
            for (let i = 0; i < this.shieldNodes.length; i++) {
                const node = this.shieldNodes[i];
                if (i === 0) {
                    this.shieldGraphic.moveTo(node.x, node.y);
                } else {
                    this.shieldGraphic.lineTo(node.x, node.y);
                }
            }
            this.shieldGraphic.closePath();
            this.shieldGraphic.strokePath();
        }
    }

    absorbShieldHit() {
        if (this.shieldHits <= 0) return false;
        this.shieldHits--;

        // Flash shield white on hit
        this.shieldNodes.forEach(node => {
            if (node) {
                node.setFillStyle(0xffffff, 1);
                node.setStrokeStyle(2, 0xffffff, 1);
            }
        });

        this.scene.time.delayedCall(100, () => {
            if (this.shieldHits <= 0) {
                // Shield breaks - shatter animation
                this.shatterShield();
            }
        });

        return true;
    }

    shatterShield() {
        // Fly 6 pieces outward and fade
        this.shieldNodes.forEach((node, i) => {
            if (!node) return;
            const angle = (Math.PI * 2 * i) / 6;
            this.scene.tweens.add({
                targets: node,
                x: node.x + Math.cos(angle) * 60,
                y: node.y + Math.sin(angle) * 60,
                alpha: 0,
                scale: 0.3,
                duration: 400,
                ease: 'Power2',
                onComplete: () => node.destroy()
            });
        });
        this.shieldNodes = [];

        if (this.shieldGraphic) {
            this.shieldGraphic.destroy();
            this.shieldGraphic = null;
        }
    }

    // Power-up: Rapid Fire
    activateRapidFire(duration) {
        this.rapidFire = true;
        this.fireRate = Math.floor(this.baseFireRate / 2);
    }

    deactivateRapidFire() {
        this.rapidFire = false;
        this.fireRate = this.baseFireRate;
    }

    // Power-up: Magnet
    activateMagnet(magnetRange) {
        this.magnetActive = true;
    }

    deactivateMagnet() {
        this.magnetActive = false;
    }

    getMagnetRange() {
        return this.magnetActive ? 200 : this.baseMagnetRange;
    }

    setMobileVelocity(x, y) {
        this.mobileVelocityX = x;
        this.mobileVelocityY = y;
        this.mobileActive = (x !== 0 || y !== 0);
    }

    isAlive() {
        return this.lives > 0;
    }

    destroy() {
        if (this.shieldGraphic) {
            this.shieldGraphic.destroy();
            this.shieldGraphic = null;
        }
        if (this.shieldNodes) {
            this.shieldNodes.forEach(n => { if (n) n.destroy(); });
            this.shieldNodes = [];
        }
        if (this.laserGraphic) {
            this.laserGraphic.destroy();
            this.laserGraphic = null;
        }
        // Stop any running blink tween
        if (this.blinkTween && this.blinkTween.isPlaying()) {
            this.blinkTween.stop();
        }
        if (this.rainbowTween) {
            this.rainbowTween.destroy();
            this.rainbowTween = null;
        }
        // Clean up trail sprites
        this.trailSprites.forEach(t => { if (t) t.destroy(); });
        this.trailSprites = [];

        if (this.exhaust) {
            this.exhaust.destroy();
        }
        super.destroy();
    }
}
