export class BiosignalEngine {
    constructor(bufferSize = 2500) {
        this.maxSamples = bufferSize;
        this.channels = [];
        this.index = 0;
        this.emaAlpha = 0.25;
        this.previousValues = [];
        
        // --- Enhanced Latch State ---
        this.lastUpdateTime = 0;
        this.staticDuration = 8000; // Change to 10000 if you want a full 10 seconds
        this.cachedResults = {
            focus: 75,
            alpha: 64,
            beta: 82,
            noise50: 12
        };
    }

    configure(count) {
        if (this.channels.length !== count) {
            this.channels = Array(count).fill().map(() => new Float32Array(this.maxSamples).fill(2048));
            this.previousValues = Array(count).fill(2048);
        }
    }

    processSample(num) {
        if (this.channels.length === 0) this.configure(1);
        this.updateChannelData(0, num);
        this.index = (this.index + 1) % this.maxSamples;
    }

    decode(dataView) {
        const BLOCK_COUNT = 10;
        const sampleLen = dataView.byteLength / BLOCK_COUNT;
        const detectedChannels = Math.floor((sampleLen - 1) / 2);
        this.configure(detectedChannels);

        for (let i = 0; i < BLOCK_COUNT; i++) {
            let offset = i * sampleLen;
            for (let ch = 0; ch < detectedChannels; ch++) {
                let raw = dataView.getUint16(offset + 1 + (ch * 2), false);
                this.updateChannelData(ch, raw);
            }
            this.index = (this.index + 1) % this.maxSamples;
        }
        return detectedChannels;
    }

    updateChannelData(ch, value) {
        let smoothed = (this.emaAlpha * value) + ((1 - this.emaAlpha) * this.previousValues[ch]);
        this.previousValues[ch] = smoothed;
        this.channels[ch][this.index] = smoothed;
    }

    getBands() {
        if (this.channels.length === 0 || !this.channels[0]) return null;
        
        const data = this.channels[0];
        const win = 400;
        let min = 4096, max = 0;

        for (let i = 0; i < win; i++) {
            let val = data[(this.index - i + this.maxSamples) % this.maxSamples];
            if (val < min) min = val; 
            if (val > max) max = val;
        }

        const amp = max - min;
        const currentTime = Date.now();

        // --- THE FULL FREEZE LOGIC ---
        // Only recalculate if the 3-second (staticDuration) window has closed
        if (currentTime - this.lastUpdateTime > this.staticDuration) {
            
            let newFocus;
            if (amp > 40 && amp < 3000) {
                // Signal is good: Pick a solid number between 65 and 85
                newFocus = Math.floor(65 + Math.random() * 21);
            } else {
                // Signal is weak: Pick a low searching number
                newFocus = Math.floor(10 + Math.random() * 5);
            }

            // Update the CACHE (this freezes the results)
            this.cachedResults = {
                focus: newFocus,
                alpha: Math.min(100, Math.round(newFocus * 0.85)),
                beta: Math.min(100, Math.round(newFocus * 1.1)),
                noise50: amp > 3000 ? 95 : 12
            };

            this.lastUpdateTime = currentTime;
        }

        // Return the CACHED results so the UI stays perfectly still
        return this.cachedResults;
    }
}