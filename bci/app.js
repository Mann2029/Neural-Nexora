import { BiosignalEngine } from './engine.js';

const engine = new BiosignalEngine(3000);
let charData, charControl, charBattery;
const canvas = document.getElementById('eegCanvas');
const ctx = canvas.getContext('2d');

document.getElementById('btnConnect').onclick = async () => {
    const statusLabel = document.getElementById('statusLabel');
    try {
        statusLabel.innerText = "Searching for NPG...";
        
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "NPG" }],
            optionalServices: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"]
        });
        
        statusLabel.innerText = "Connecting to GATT...";
        const server = await device.gatt.connect();
        
        statusLabel.innerText = "Fetching Services...";
        const service = await server.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        
        charData = await service.getCharacteristic("beb5483e-36e1-4688-b7f5-ea07361b26a8");
        charControl = await service.getCharacteristic("0000ff01-0000-1000-8000-00805f9b34fb");

        await charData.startNotifications();
        charData.oncharacteristicvaluechanged = (e) => engine.decode(e.target.value);

        try {
            charBattery = await service.getCharacteristic("f633d0ec-46b4-43c1-a39f-1ca06d0602e1");
            await charBattery.startNotifications();
            charBattery.oncharacteristicvaluechanged = (e) => {
                document.getElementById('battLevel').innerText = e.target.value.getUint8(0) + "%";
            };
        } catch (battErr) {
            console.warn("Battery feature missing on hardware. Skipping...");
            document.getElementById('battLevel').innerText = "N/A";
        }

        statusLabel.innerText = "Neural Nexora Connected";
        document.getElementById('btnStart').disabled = false;
        document.getElementById('btnStop').disabled = false;
        
    } catch (err) { 
        console.error("BLE Detailed Error:", err);
        document.getElementById('statusLabel').innerText = "Link Failed";
        alert("Connection Error: " + err.message + "\n\nCRITICAL FIX: Go to Windows Bluetooth Settings and 'Remove' the NPG device before trying again.");
    }
};

document.getElementById('btnStart').onclick = async () => {
    if (!charControl) return;
    try {
        await charControl.writeValue(new TextEncoder().encode("START"));
        engine.startSession();
        document.getElementById('btnDownload').disabled = true;
    } catch (err) {
        console.error("Start Session Failed:", err);
    }
};

document.getElementById('btnStop').onclick = async () => {
    if (!charControl) return;
    try {
        await charControl.writeValue(new TextEncoder().encode("STOP"));
        engine.stopSession();
        document.getElementById('btnDownload').disabled = false;
    } catch (err) {
        console.error("Stop Session Failed:", err);
    }
};

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
    const colors = ['#ec4899', '#3b82f6', '#10b981']; 
    
    if (engine.channels.length > 0) {
        const sliceWidth = canvas.width / engine.maxSamples;
        const chHeight = canvas.height / engine.channels.length;
        const verticalGain = 12.0; 

        engine.channels.forEach((data, ch) => {
            ctx.beginPath(); 
            ctx.strokeStyle = colors[ch % colors.length]; 
            ctx.lineWidth = 2.5;
            
            ctx.fillStyle = colors[ch % colors.length]; 
            ctx.font = "bold 12px Inter";
            ctx.fillText(`CH${ch+1}`, 15, (ch * chHeight) + 25);
            
            for (let i = 0; i < engine.maxSamples; i++) {
                let x = i * sliceWidth;
                let midY = (ch * chHeight) + (chHeight / 2);
                let val = data[(engine.index + i) % engine.maxSamples];
                
                let y = midY + ((val - 2048) / 2048) * (chHeight / 2) * verticalGain;
                y = Math.max(ch * chHeight + 5, Math.min(y, (ch + 1) * chHeight - 5));

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        });

        const b = engine.getBands();
        if (b) {
            if (b.focus === "LO") {
                document.getElementById('focusValue').innerText = "LO";
                document.getElementById('mlStatus').innerText = "⚠ LEADS OFF (Check Headband)";
                document.getElementById('mlStatus').style.color = "#ef4444"; 
            } else {
                document.getElementById('focusValue').innerText = b.focus + (b.isPredicting ? "%" : "");
                document.getElementById('mlStatus').innerText = b.isPredicting ? "● AI LIVE PREDICTION" : "ANALYZING BASELINE (1.5m)...";
                document.getElementById('mlStatus').style.color = b.isPredicting ? "#10b981" : "#eab308";
            }
            
            document.getElementById('barAlpha').style.width = b.alpha + "%";
            document.getElementById('barBeta').style.width = b.beta + "%";
            document.getElementById('barNoise').style.width = b.noise50 + "%";
            document.getElementById('chCount').innerText = engine.channels.length;
        }
    }
    requestAnimationFrame(render);
}

render();