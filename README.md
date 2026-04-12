# 🧠 Neural Nexora | Advanced AI Neural Analytics

> **Real-Time Neurofeedback · AI Focus Detection · Browser-Based BCI**

NPG STUDIO is a **high-performance, browser-native neurofeedback platform** that monitors real-time student focus using **EEG/EOG biosignals + AI (TensorFlow.js)**.

It combines **IoT hardware + signal processing + deep learning** into a **single interactive dashboard**.

---

## 🌟 Overview

Neural Nexora transforms raw brain signals into actionable insights:

- ⚡ Real-time EEG signal processing  
- 🧠 AI-based focus prediction  
- 📊 Multi-channel waveform visualization  
- 🔌 Web Bluetooth connectivity  
- 💾 Research-grade data export  

---

## 🧩 System Architecture
EEG Sensors → ESP32 → BLE → Browser
↓
BiosignalEngine (JS)
↓
TensorFlow.js AI Model
↓
Web Dashboard


---

## 🚀 Core Features

### 🔗 Connectivity
- Web Bluetooth API (GATT)
- Real-time streaming from **NPG devices**

---

### 📡 Real-Time Waveform Engine
- Canvas-based rendering
- Multi-channel EEG visualization
- Ultra gain: **15x amplification**

---

### 🧠 AI Focus Prediction (TensorFlow.js)

- 3-Layer Neural Network
- Runs **fully in browser**
- Output: **15% → 85% focus score**

---

### ⏱️ Smart Calibration
- **1-minute baseline learning**
- AI activates after calibration
- Prevents inaccurate predictions

---

### 📊 Frequency Analysis
- Alpha (Relaxation)
- Beta (Focus)
- Noise (50Hz interference)

---

### 💾 Data Export
- JSON session logging
- Per-second tracking
- Research-ready format

---

## 📁 Project Structure
Neural-Nexora/
│
├── index.html # UI layout + TensorFlow.js
├── style.css # Soft-Light UI design
├── app.js # BLE + Rendering + Controls
├── engine.js # Signal processing core
├── ml.js # AI model (TensorFlow.js)
└── README.md


---

## 🖥️ Frontend (index.html)

Main dashboard includes:

- Device controls (PAIR / START / STOP / EXPORT)
- EEG Canvas rendering
- Focus score panel
- Frequency bars

```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
<canvas id="eegCanvas"></canvas>

🎨 UI Design (style.css)

Soft-Light Theme:

Blue → Focus
Yellow → Calibration
Off-white → Background

Features:

Glass-style cards
Responsive grid layout
Real-time progress bars

⚙️ Core Logic (app.js)

Handles:

🔌 BLE Connection
navigator.bluetooth.requestDevice(...)
📡 Data Streaming
Receives binary packets
Sends to BiosignalEngine
🎥 Rendering
Canvas-based waveform drawing
15x vertical gain
💾 Export
JSON.stringify(engine.getSessionData())
⚙️ Signal Processing Engine (engine.js)
🔄 Data Flow
Decode BLE packets
Apply EMA smoothing
Store circular buffer
Extract features
Send to AI
📉 EMA Filter
y(t) = αx(t) + (1 - α)y(t-1)
α = 0.25
Removes noise from ADC
📊 Feature Extraction
Amplitude (last 400 samples)
Alpha / Beta estimation
Noise detection
⏱️ Calibration Logic
this.calibrationTime = 60000; // 1 minute
Before 1 min → --
After → AI prediction starts
🤖 AI Model (ml.js)
Architecture
Input: [alpha, beta, noise]

Dense(12, relu)
Dense(8, relu)
Dense(1, sigmoid)
Prediction Logic
Normalized inputs
Sigmoid output
Scaled to 15–85%
Smart Heuristic Boost
if (beta > alpha * 1.2 && noise < 20)

→ boosts focus score

🚦 Workflow
1. Pair Device
Click PAIR DEVICE
Connect via BLE
2. Start Session
Click START SESSION
Data begins streaming
3. Calibration (0–60 sec)
Focus shows --
System learns baseline
4. AI Prediction
Real-time focus %
Live frequency bars
5. Export Data
Click EXPORT DATA
Download JSON
⚠️ Troubleshooting
Issue	Fix
BLE not connecting	Unpair device
Flat signals	Check electrodes
Focus = --	Wait calibration
No export	Stop session first
💰 Cost Advantage
System	Cost
Imported	₹70k–₹90k
Nexora	₹6k–₹7.5k
🏆 Unique Points
🇮🇳 First classroom BCI system in India
⚡ Real-time AI in browser
💻 No installation required
📊 Research-ready data
👥 Team Neural Nexora
Lavina Korani – Team Lead, BCI Research
Mann Chavda – IoT Developer
Nisarg Pandya – DSA Expert
Aman Yadav – Cloud (AWS)
Tasneem Kolsawala – MERN Dev
Tanishka Trivedi – MERN Dev
📜 License

MIT License © 2026

🧠 Vision

To make brain-computer interfaces accessible, affordable, and practical for real-world classrooms.
