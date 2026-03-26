/**
 * DOM-based touch controls overlay for mobile devices.
 * Creates a virtual joystick (left) and fire button (right).
 */
export default class TouchControls {
    constructor(player) {
        this.player = player;
        this.active = false;

        // Joystick state
        this.joystickActive = false;
        this.joystickStartX = 0;
        this.joystickStartY = 0;
        this.joystickX = 0;
        this.joystickY = 0;
        this.maxDistance = 40; // max thumb distance from center

        // Fire state
        this.fireActive = false;

        this.createDOM();
        this.bindEvents();
        this.active = true;
    }

    static isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }

    createDOM() {
        // Container
        this.container = document.createElement('div');
        this.container.id = 'touch-controls';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 1000; user-select: none;
            -webkit-user-select: none; -webkit-touch-callout: none;
        `;

        // --- Joystick (bottom-left) ---
        this.joystickOuter = document.createElement('div');
        this.joystickOuter.style.cssText = `
            position: absolute; bottom: 80px; left: 40px;
            width: 120px; height: 120px; border-radius: 50%;
            background: rgba(255,255,255,0.12); border: 2px solid rgba(255,255,255,0.3);
            pointer-events: auto; touch-action: none;
            display: flex; align-items: center; justify-content: center;
        `;

        this.joystickInner = document.createElement('div');
        this.joystickInner.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: rgba(0,255,255,0.5); border: 2px solid rgba(0,255,255,0.8);
            transition: none; pointer-events: none;
        `;
        this.joystickOuter.appendChild(this.joystickInner);

        // --- Fire button (bottom-right) ---
        this.fireButton = document.createElement('div');
        this.fireButton.style.cssText = `
            position: absolute; bottom: 90px; right: 50px;
            width: 80px; height: 80px; border-radius: 50%;
            background: rgba(255,50,50,0.4); border: 3px solid rgba(255,80,80,0.7);
            pointer-events: auto; touch-action: none;
            display: flex; align-items: center; justify-content: center;
            font-family: monospace; font-size: 14px; font-weight: bold;
            color: rgba(255,255,255,0.8); text-shadow: 0 0 6px rgba(255,0,0,0.6);
        `;
        this.fireButton.textContent = 'FIRE';

        this.container.appendChild(this.joystickOuter);
        this.container.appendChild(this.fireButton);
        document.body.appendChild(this.container);
    }

    bindEvents() {
        // --- Joystick touch ---
        this.joystickOuter.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const rect = this.joystickOuter.getBoundingClientRect();
            this.joystickActive = true;
            this.joystickStartX = rect.left + rect.width / 2;
            this.joystickStartY = rect.top + rect.height / 2;
            this.updateJoystick(touch.clientX, touch.clientY);
        }, { passive: false });

        this.joystickOuter.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystickActive) return;
            const touch = e.changedTouches[0];
            this.updateJoystick(touch.clientX, touch.clientY);
        }, { passive: false });

        const joystickEnd = (e) => {
            e.preventDefault();
            this.joystickActive = false;
            this.joystickX = 0;
            this.joystickY = 0;
            this.joystickInner.style.transform = 'translate(0px, 0px)';
            if (this.player && this.player.active) {
                this.player.setMobileVelocity(0, 0);
            }
        };
        this.joystickOuter.addEventListener('touchend', joystickEnd, { passive: false });
        this.joystickOuter.addEventListener('touchcancel', joystickEnd, { passive: false });

        // --- Fire button touch ---
        this.fireButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.fireActive = true;
            if (this.player) this.player.isFiring = true;
            this.fireButton.style.background = 'rgba(255,80,80,0.7)';
            this.fireButton.style.transform = 'scale(0.92)';
        }, { passive: false });

        const fireEnd = (e) => {
            e.preventDefault();
            this.fireActive = false;
            if (this.player) this.player.isFiring = false;
            this.fireButton.style.background = 'rgba(255,50,50,0.4)';
            this.fireButton.style.transform = 'scale(1)';
        };
        this.fireButton.addEventListener('touchend', fireEnd, { passive: false });
        this.fireButton.addEventListener('touchcancel', fireEnd, { passive: false });
    }

    updateJoystick(touchX, touchY) {
        let dx = touchX - this.joystickStartX;
        let dy = touchY - this.joystickStartY;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.maxDistance) {
            dx = (dx / dist) * this.maxDistance;
            dy = (dy / dist) * this.maxDistance;
        }

        // Move inner circle visual
        this.joystickInner.style.transform = `translate(${dx}px, ${dy}px)`;

        // Normalize to -1..1
        this.joystickX = dx / this.maxDistance;
        this.joystickY = dy / this.maxDistance;

        // Apply to player
        if (this.player && this.player.active) {
            const speed = this.player.speed;
            this.player.setMobileVelocity(this.joystickX * speed, this.joystickY * speed);
        }
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.active = false;
    }
}
