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
        
        // Updated Calibration: 1 Minute
        this.calibrationTime = 60000; 
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

        // REAL-TIME BARS: These update instantly on the UI
        let alpha = Math.min(100, (amp / 1100) * 85);
        let beta = Math.min(100, (amp / 1100) * 115);
        let noise = amp > 3000 ? 95 : 12;

        const timeActive = Date.now() - this.startTime;
        const calibrating = timeActive < this.calibrationTime;

        // Prediction Score only appears after 1 minute
        let focus = calibrating ? '--' : this.aiModel.predict(alpha, beta, noise);
        
        const result = { focus, alpha: Math.round(alpha), beta: Math.round(beta), noise50: noise, isPredicting: !calibrating };

        if (this.sessionActive && Math.floor(timeActive / 1000) > this.history.length) {
            this.history.push({ time: new Date().toLocaleTimeString(), ...result });
        }

        this.cachedResults = result;
        return result;
    }
}