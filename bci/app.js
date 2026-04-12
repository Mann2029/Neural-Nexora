import { BiosignalEngine } from './engine.js';

const engine = new BiosignalEngine(3000);
let charData, charControl, charBattery;
const canvas = document.getElementById('eegCanvas');
const ctx = canvas.getContext('2d');

// --- Bluetooth Pairing ---
document.getElementById('btnConnect').onclick = async () => {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "NPG" }],
            optionalServices: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"]
        });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        
        charData = await service.getCharacteristic("beb5483e-36e1-4688-b7f5-ea07361b26a8");
        charControl = await service.getCharacteristic("0000ff01-0000-1000-8000-00805f9b34fb");
        charBattery = await service.getCharacteristic("f633d0ec-46b4-43c1-a39f-1ca06d0602e1");

        await charData.startNotifications();
        charData.oncharacteristicvaluechanged = (e) => engine.decode(e.target.value);

        await charBattery.startNotifications();
        charBattery.oncharacteristicvaluechanged = (e) => {
            document.getElementById('battLevel').innerText = e.target.value.getUint8(0) + "%";
        };

        document.getElementById('statusLabel').innerText = "Neural Nexora Connected";
        document.getElementById('btnStart').disabled = false;
        document.getElementById('btnStop').disabled = false;
    } catch (err) { console.error("BLE Failed"); }
};

document.getElementById('btnStart').onclick = () => {
    charControl.writeValue(new TextEncoder().encode("START"));
    engine.startSession();
    document.getElementById('btnDownload').disabled = true;
};

document.getElementById('btnStop').onclick = () => {
    charControl.writeValue(new TextEncoder().encode("STOP"));
    engine.stopSession();
    document.getElementById('btnDownload').disabled = false;
};

// --- JSON Session Export ---
document.getElementById('btnDownload').onclick = () => {
    const data = engine.getSessionData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nexora_Analytics_${Date.now()}.json`;
    a.click();
};

function render() {
    const rect = canvas.parentElement.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width; canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (engine.channels.length > 0) {
        const sliceWidth = canvas.width / engine.maxSamples;
        const chHeight = canvas.height / engine.channels.length;
        const verticalGain = 15.0; // High Visibility Zoom

        engine.channels.forEach((data, ch) => {
            ctx.beginPath(); ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3;
            for (let i = 0; i < engine.maxSamples; i++) {
                let midY = (ch * chHeight) + (chHeight / 2);
                let val = data[(engine.index + i) % engine.maxSamples];
                let y = midY + ((val - 2048) / 2048) * (chHeight / 2) * verticalGain;
                y = Math.max(ch * chHeight + 10, Math.min(y, (ch + 1) * chHeight - 10));
                i === 0 ? ctx.moveTo(i * sliceWidth, y) : ctx.lineTo(i * sliceWidth, y);
            }
            ctx.stroke();
        });

        const b = engine.getBands();
        if (b) {
            document.getElementById('focusValue').innerText = b.focus + (b.isPredicting ? "%" : "");
            document.getElementById('mlStatus').innerText = b.isPredicting ? "● AI LIVE PREDICTION" : "ANALYZING BASELINE (1m)...";
            document.getElementById('mlStatus').style.color = b.isPredicting ? "#10b981" : "#eab308";
            document.getElementById('barAlpha').style.width = b.alpha + "%";
            document.getElementById('barBeta').style.width = b.beta + "%";
            document.getElementById('barNoise').style.width = b.noise50 + "%";
            document.getElementById('chCount').innerText = engine.channels.length;
        }
    }
    requestAnimationFrame(render);
}
render();