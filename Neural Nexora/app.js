import { BiosignalEngine } from './engine.js';

const engine = new BiosignalEngine(2500);
let charData, charControl, serialPort;

const canvas = document.getElementById('eegCanvas');
const ctx = canvas.getContext('2d');
const focusVal = document.getElementById('focusValue');
const statusLabel = document.getElementById('statusLabel');

// --- 🔌 USB CABLE LOGIC ---
document.getElementById('btnSerial').onclick = async () => {
    try {
        statusLabel.innerText = "Select USB Port...";
        serialPort = await navigator.serial.requestPort(); 
        await serialPort.open({ baudRate: 115200 });
        
        statusLabel.innerText = "USB Connected";
        document.getElementById('btnStart').disabled = true; 

        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();

        let buffer = "";
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            let lines = buffer.split('\n');
            buffer = lines.pop(); 
            for (let line of lines) {
                let num = parseInt(line.trim());
                if (!isNaN(num)) engine.processSample(num);
            }
        }
    } catch (err) { statusLabel.innerText = "USB Failed"; }
};

// --- 🔵 BLUETOOTH LOGIC ---
document.getElementById('btnConnect').onclick = async () => {
    try {
        statusLabel.innerText = "Scanning...";
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "NPG" }],
            optionalServices: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"]
        });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        charData = await service.getCharacteristic("beb5483e-36e1-4688-b7f5-ea07361b26a8");
        charControl = await service.getCharacteristic("0000ff01-0000-1000-8000-00805f9b34fb");

        await charData.startNotifications();
        charData.oncharacteristicvaluechanged = (e) => engine.decode(e.target.value);

        statusLabel.innerText = "BLE Connected";
        document.getElementById('btnStart').disabled = false;
        document.getElementById('btnStop').disabled = false;
    } catch (err) { statusLabel.innerText = "BLE Failed"; }
};

document.getElementById('btnStart').onclick = () => charControl.writeValue(new TextEncoder().encode("START"));
document.getElementById('btnStop').onclick = () => charControl.writeValue(new TextEncoder().encode("STOP"));

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const colors = ['#ec4899', '#3b82f6', '#10b981'];
    if (engine.channels.length > 0) {
        const slice = canvas.width / engine.maxSamples;
        const h = canvas.height / engine.channels.length;
        engine.channels.forEach((data, ch) => {
            ctx.beginPath(); ctx.strokeStyle = colors[ch % 3]; ctx.lineWidth = 2;
            ctx.fillStyle = colors[ch % 3]; ctx.font = "bold 12px monospace";
            ctx.fillText(`CH${ch+1}`, 10, (ch * h) + 20);
            for (let i = 0; i < engine.maxSamples; i++) {
                let x = i * slice;
                let y = (ch * h) + h - (data[(engine.index + i) % engine.maxSamples] / 4095 * h);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        });
        const b = engine.getBands();
        if (b) {
            focusVal.innerText = b.focus;
            focusVal.style.color = b.focus > 70 ? "#22c55e" : (b.focus > 35 ? "#eab308" : "#ef4444");
            document.getElementById('barAlpha').style.width = b.alpha + "%";
            document.getElementById('barBeta').style.width = b.beta + "%";
            document.getElementById('bar50Hz').style.width = b.noise50 + "%";
        }
    }
    requestAnimationFrame(render);
}

window.onload = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; render(); };