# 🧩 CubeTimer

![Work in Progress](https://img.shields.io/badge/status-in%20development-orange)

A **fast and lightweight CLI timer** for speedcubing. Track your solves, generate random scrambles, and analyze your times—all from the terminal!

## 🚀 Features
- ⏱️ **Simple Timer** – Start and stop the timer using the spacebar.
- 🔀 **Scramble Generator** – Get random scrambles for practice.
- 📊 **Solve Analysis** – View your past times and calculate averages.
- 🎨 **Customizable & Stylish** – Uses `chalk` for colorful output.

## 📦 Installation

### **Prerequisites**
- Requires **Node.js v16+**.

### **Install via npm**
```sh
npm install -g cubetimer
```

### **Run in Local Development**
```sh
git clone https://github.com/makapane/cubetimer.git
cd cubetimer
npm install
npm start
```

## 🎯 Usage

### **Start a Timer**
```sh
cubetimer start
```
Press **spacebar** to start/stop the timer.

### **Generate a Scramble**
```sh
cubetimer scramble
```

### **View Solve History**
```sh
cubetimer history
```

## 🔨 Development
### **Build TypeScript**
```sh
npm run build
```

## 🛠️ Dependencies
- [`@futpib/node-global-key-listener`](https://www.npmjs.com/package/@futpib/node-global-key-listener) – Global key listening for timing functionality.
- [`chalk`](https://www.npmjs.com/package/chalk) – Terminal styling.
- [`keypress`](https://www.npmjs.com/package/keypress) – Key event handling.
- [`scrambow`](https://www.npmjs.com/package/scrambow) – Scramble generation.

## 📜 License
This project is licensed under the **MIT License**.

---
🚧 **Note:** This project is very much still in development. Expect frequent updates and new features! 🚀

