# 🧠 NPG Studio | Modular Biosignal Dashboard

> **Real-Time Neurofeedback · Browser-Native · Hardware-Integrated**

**NPG Studio** is a high-performance, browser-based neurofeedback and biosignal visualization platform engineered for the **NPG-Lite** ecosystem. It enables real-time EEG/EMG signal acquisition, intelligent signal processing, and cognitive focus estimation—directly in the browser with zero native installations.

---

## 🌟 Overview

NPG Studio bridges **biosignal hardware** with **modern web technologies**, providing:

- ⚡ Real-time signal streaming & processing  
- 🧠 Cognitive state (Focus) estimation  
- 📊 Multi-channel waveform visualization (up to 6 channels)  
- 🔌 Seamless BLE + USB connectivity  
- 🎨 Professional, modern UI  

---

## 🚀 Key Features

### 🔗 Dual-Mode Connectivity
- **Bluetooth Low Energy (BLE)**  
  - Wireless operation  
  - Low-latency streaming  
  - Ideal for wearable setups  

- **Web Serial (USB)**  
  - High stability  
  - Consistent throughput  
  - Perfect for lab/research environments  

---

### 📡 High-Fidelity Waveform Visualization
- Real-time rendering using **HTML Canvas**
- Supports up to **6 simultaneous channels**
- Fully adjustable:
  - 📏 Vertical Gain (amplitude scaling)
  - 🔍 Horizontal Zoom (time scaling)
- Smooth and optimized for high refresh rates  

---

### 🧠 Intelligent Signal Analysis

#### 🎯 Focus Scoring System
- Real-time cognitive load estimation  
- Based on:
  - Signal amplitude  
  - Variance analysis  
- Includes **3-second static latch logic**:
  - Prevents flickering  
  - Improves readability  
  - Stabilizes output  

---

#### 📊 Frequency Band Tracking
- **Alpha Waves** → Relaxation  
- **Beta Waves** → Focus & alertness  
- Continuous real-time tracking  

---

#### ⚡ Noise Detection
- Detects:
  - **50Hz** (India/Europe)  
  - **60Hz** (US)  
- Identifies electrical interference instantly  

---

### 🎨 Glassmorphism UI
- Modern **dark-themed dashboard**
- Neon accents for clarity  
- CSS Backdrop Filters (glass effect)  
- Clean, minimal, professional layout  

---

## 🛠️ Tech Stack

| Layer        | Technology |
|-------------|-----------|
| Frontend     | HTML5, CSS3 (Glassmorphism UI) |
| Logic        | Vanilla JavaScript (ES6+) |
| Communication| Web Bluetooth API, Web Serial API |
| Rendering    | HTML Canvas |
| Processing   | Custom `BiosignalEngine` |

---

## 📁 Project Structure
NPG-Studio/
│
├── index.html # Main dashboard structure
├── style.css # Neon / Glass UI styling
├── app.js # Hardware interface + rendering logic
├── engine.js # Signal processing + Focus Score logic
└── README.md # Documentation


---

## 🔌 Hardware Setup

### Supported Devices
- **NPG-Lite**
- **Beast Playmate**
- Compatible ESP32-based biosignal boards  

---

### 🔵 Bluetooth (BLE)

1. Power ON device  
2. Remove device from system Bluetooth settings (**must be unpaired**)  
3. Click **CONNECT BLE**  
4. Select device from browser popup  

---

### 🔌 USB Serial

1. Connect using a **data cable**  
2. Click **CONNECT USB**  
3. Select correct COM port  
4. Use baud rate: 115200


---

## ⚙️ How It Works

The system is powered by a custom **`BiosignalEngine`**, designed for **low-latency, real-time signal processing**.

---

## 🔄 Signal Processing Pipeline

### 1. Data Acquisition
- BLE → Binary packets  
- USB → Text stream  

---

### 2. De-Interleaving
- Extracts multi-channel data  
- Uses **16-bit Big Endian decoding**

---

### 3. Noise Reduction (EMA Filter)
y(t) = αx(t) + (1 - α)y(t-1)


- Default: **α = 0.25**
- Reduces ADC noise while preserving signal shape  

---

### 4. Feature Extraction
- Signal amplitude  
- Rolling variance (**400-sample window**)  

---

### 5. Focus Score Computation
- Combines amplitude + variance  
- Outputs normalized cognitive state  

---

### 6. Static Latching
- Freezes output for **3 seconds**
- Ensures stable and professional display  

---

## ⚙️ Customization

### 🔍 Zoom (Time Axis)
```js
bufferSize: 5000
