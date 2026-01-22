import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';
import { FORMATION_TYPES, ENEMY_TYPES } from '../utils/constants.js';
import VFormation from '../formations/VFormation.js';
import GridFormation from '../formations/GridFormation.js';
import CircleFormation from '../formations/CircleFormation.js';
import WaveFormation from '../formations/WaveFormation.js';

export default class FormationManager {
    constructor(scene) {
        this.scene = scene;
        this.activeFormations = [];
        this.formationIdCounter = 0;
    }

    createFormation(type, enemyType, count, startX, startY) {
        let formation;
        
        switch (type) {
            case FORMATION_TYPES.V:
                formation = new VFormation(this.scene, enemyType, count, startX, startY);
                break;
            case FORMATION_TYPES.GRID:
                formation = new GridFormation(this.scene, enemyType, count, startX, startY);
                break;
            case FORMATION_TYPES.CIRCLE:
                formation = new CircleFormation(this.scene, enemyType, count, startX, startY);
                break;
            case FORMATION_TYPES.WAVE:
                formation = new WaveFormation(this.scene, enemyType, count, startX, startY);
                break;
            default:
                formation = new VFormation(this.scene, enemyType, count, startX, startY);
        }
        
        formation.id = this.formationIdCounter++;
        this.activeFormations.push(formation);
        
        return formation;
    }

    update(time) {
        // Update all active formations
        for (let i = this.activeFormations.length - 1; i >= 0; i--) {
            const formation = this.activeFormations[i];
            formation.update(time);
            
            // Remove empty formations
            if (formation.enemies.length === 0) {
                this.activeFormations.splice(i, 1);
            }
        }
    }

    removeFormation(formation) {
        const index = this.activeFormations.indexOf(formation);
        if (index > -1) {
            this.activeFormations.splice(index, 1);
        }
    }

    clearAll() {
        this.activeFormations.forEach(formation => {
            formation.destroy();
        });
        this.activeFormations = [];
    }

    getActiveFormationCount() {
        return this.activeFormations.length;
    }
}
