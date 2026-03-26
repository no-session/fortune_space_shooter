// HUD Configuration Manager
// Allows players to toggle HUD elements on/off via pause menu

const HUD_ELEMENTS = {
    score: { label: 'Score', default: true },
    combo: { label: 'Combo', default: true },
    lives: { label: 'Lives', default: true },
    wave: { label: 'Wave', default: true },
    healthBar: { label: 'Health Bar', default: true },
    accuracy: { label: 'Accuracy', default: true },
    streak: { label: 'Streak', default: true },
    currency: { label: 'Currency', default: true },
    radar: { label: 'Radar', default: true }
};

const STORAGE_KEY = 'fortune-hud-config';

export default class HUDConfig {
    constructor() {
        this.elements = {};
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to handle new elements
                for (const key of Object.keys(HUD_ELEMENTS)) {
                    this.elements[key] = parsed[key] !== undefined ? parsed[key] : HUD_ELEMENTS[key].default;
                }
            } else {
                this.resetToDefaults();
            }
        } catch (e) {
            this.resetToDefaults();
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.elements));
        } catch (e) {
            // Storage unavailable
        }
    }

    resetToDefaults() {
        for (const key of Object.keys(HUD_ELEMENTS)) {
            this.elements[key] = HUD_ELEMENTS[key].default;
        }
    }

    isVisible(elementKey) {
        return this.elements[elementKey] !== false;
    }

    toggle(elementKey) {
        if (this.elements[elementKey] !== undefined) {
            this.elements[elementKey] = !this.elements[elementKey];
            this.save();
        }
        return this.elements[elementKey];
    }

    getAll() {
        return Object.keys(HUD_ELEMENTS).map(key => ({
            key,
            label: HUD_ELEMENTS[key].label,
            visible: this.isVisible(key)
        }));
    }
}

export { HUD_ELEMENTS };
