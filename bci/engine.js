import { FocusPredictor } from './ml.js';

export class BiosignalEngine {
    constructor(bufferSize = 3000) {
        this.maxSamples = bufferSize;
        this.channels = [];
        this.index = 0;
        this.emaAlpha = 0.25;
        this.previousValues = [];
        this.aiModel = new FocusPredictor();
        this.startTime = 0;
        this.history = [];
        this.sessionActive = false;
        
        this.calibrationTime = 90000; 
        this.cachedResults = { focus: '--', alpha: 0, beta: 0, noise50: 0, isPredicting: false };
    }

    startSession() { this.startTime = Date.now(); this.history = []; this.sessionActive = true; }
    stopSession() { this.sessionActive = false; }
    getSessionData() { return this.history; }

    configure(count) {
        if (this.channels.length !== count) {
            this.channels = Array(count).fill().map(() => new Float32Array(this.maxSamples).fill(2048));
            this.previousValues = Array(count).fill(2048);
        }
    }

    decode(dataView) {
        const BLOCK = 10;
        const sampleLen = dataView.byteLength / BLOCK;
        const detected = Math.floor((sampleLen - 1) / 2);
        this.configure(detected);
        for (let i = 0; i < BLOCK; i++) {
            let off = i * sampleLen;
            for (let ch = 0; ch < detected; ch++) {
                let raw = dataView.getUint16(off + 1 + (ch * 2), false);
                let smoothed = (this.emaAlpha * raw) + ((1 - this.emaAlpha) * this.previousValues[ch]);
                this.previousValues[ch] = smoothed;
                this.channels[ch][this.index] = smoothed;
            }
            this.index = (this.index + 1) % this.maxSamples;
        }
        return detected;
    }

    getBands() {
        if (this.channels.length === 0 || !this.channels[0] || this.startTime === 0) return this.cachedResults;
        
        const data = this.channels[0];
        let min = 4096, max = 0;
        for (let i = 0; i < 400; i++) {
            let val = data[(this.index - i + this.maxSamples) % this.maxSamples];
            if (val < min) min = val; if (val > max) max = val;
        }
        const amp = max - min;

        // --- 🛑 ROBUST STATIC FILTER ---
        // 1. amp < 50: Signal is totally dead flat
        // 2. max > 4000: Signal is railed to the ceiling (floating pin)
        // 3. min < 50: Signal is railed to the floor
        const isStatic = (amp < 50 || max > 4000 || min < 50);

        let alpha = 0, beta = 0, noise = 0;

        if (!isStatic) {
            alpha = Math.min(100, (amp / 1100) * 85);
            beta = Math.min(100, (amp / 1100) * 115);
            noise = amp > 2800 ? 90 : 12;
        } else {
            // Force bars to absolute zero if no human is connected
            alpha = 0; beta = 0; noise = 0;
        }

        const timeActive = Date.now() - this.startTime;
        const calibrating = timeActive < this.calibrationTime;

        let focus = "--";
        if (!calibrating && !isStatic) {
            focus = this.aiModel.predict(alpha, beta, noise);
        } else if (isStatic) {
            focus = "LO"; // Leads Off Warning
        }
        
        const result = { focus, alpha: Math.round(alpha), beta: Math.round(beta), noise50: noise, isPredicting: (!calibrating && !isStatic) };

        if (this.sessionActive && !isStatic && Math.floor(timeActive / 1000) > this.history.length) {
            this.history.push({ time: new Date().toLocaleTimeString(), ...result });
        }

        this.cachedResults = result;
        return result;
    }
}