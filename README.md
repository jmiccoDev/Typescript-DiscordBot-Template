<div align="center">

# **@TypeScript DiscordBot Template**

![Last Commit](https://img.shields.io/github/last-commit/jmiccoDev/Typescript-DiscordBot-Template)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![Languages](https://img.shields.io/github/languages/count/jmiccoDev/Typescript-DiscordBot-Template)
![License](https://img.shields.io/github/license/jmiccoDev/Typescript-DiscordBot-Template)

*Built with the tools and technologies:*

![JSON](https://img.shields.io/badge/-JSON-black?logo=json&logoColor=white)
![Markdown](https://img.shields.io/badge/-Markdown-black?logo=markdown&logoColor=white)
![npm](https://img.shields.io/badge/-npm-red?logo=npm&logoColor=white)
![Prettier](https://img.shields.io/badge/-Prettier-yellow?logo=prettier&logoColor=white)
![.ENV](https://img.shields.io/badge/-.ENV-yellow)
![Nodemon](https://img.shields.io/badge/-Nodemon-green?logo=nodemon&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-blue?logo=typescript&logoColor=white)
![ts-node](https://img.shields.io/badge/-tsnode-blue)
![Discord](https://img.shields.io/badge/-Discord-blueviolet?logo=discord&logoColor=white)
![ESLint](https://img.shields.io/badge/-ESLint-purple?logo=eslint&logoColor=white)

</div>

---

## 📌 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Testing](#testing)

---

## 📖 Overview
**Typescript-DiscordBot-Template** provides a solid starting point for creating Discord bots with:
- Clean, modular, and maintainable architecture
- Slash command & event handling system
- Integrated MySQL database support
- Pre-configured tools for development and deployment

---

## ✨ Features
- 🧩 **Command & Event Templates** – Rapidly create and organize bot features.
- 🚀 **Deployment Tools** – Automatic slash command registration.
- 🗃️ **Database Integration** – MySQL setup for persistent storage.
- 🔍 **Error Logging** – Centralized error handling with detailed logs.
- 🛡️ **Permission Checks** – Role-based access and command restrictions.
- ⏱️ **Cooldown System** – Prevents command spam.
- 🎯 **Scalable Structure** – Easy to expand and maintain over time.
- 🧹 **Code Quality Tools** – ESLint, Prettier, and TypeScript strict mode.

---

## 📂 Project Structure
```
Typescript-DiscordBot-Template/
│
├── src/
│   ├── commands/        # Command files
│   ├── events/          # Event handlers
│   ├── config/          # Configurations (.env loading, constants)
│   ├── handlers/        # Handlers interacting with the bot (Command & Event Handler, Deploy Commands, GuildCommand Manager)
│   ├── services/        # Services Modules (Database MySQL Module)
│   ├── tools/           # Tools functions (Cooldown, Permission Handler, Error Handler)
│   ├── types/           # Interfaces for Commands & Events
│   └── index.ts         # Bot entry point
│
├── .env.example         # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) (comes with Node.js)
- TypeScript knowledge

### Installation
```sh
# Clone the repository
git clone https://github.com/jmiccoDev/Typescript-DiscordBot-Template

# Move into the project directory
cd Typescript-DiscordBot-Template

# Install dependencies
npm install
```

---

### Usage
```sh
# Development mode
npm run dev

# Build for production
npm run build

# Start production bot
npm start
```
---

## 📜 License
This project is licensed under the [MIT License](LICENSE).
