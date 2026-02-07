# Setup Instructions

These instructions explain how to set up and run the Digital Will – Digital Inheritance Solution on a local system for evaluation.

## Prerequisites
Ensure the following are installed before proceeding:
- Git (to clone the repository)
- Node.js (v18 or higher)
- npm (comes with Node.js)
- A modern web browser (Chrome / Firefox)

Verify installation (optional):
node -v
npm -v
git --version

## Project Setup

1. Clone the repository from GitHub:
git clone https://github.com/Praneeth0910/Digital_will.git

2. Move into the project directory:
cd Digital_will

3. Install all required dependencies:
npm install

This command installs all libraries required to run the application.

## Environment Configuration

Create a `.env` file in the root directory and add:

PORT=5000
APP_ENV=development

The application uses port 5000 by default for local execution.

## Run the Application

Start the application using:
npm start

Once started, the server will run locally.

## Access the Application

Open a browser and visit:
http://localhost:5000

The Digital Will application interface should now be visible.

## Build Reproducibility (Mandatory)

To ensure the build can be reproduced from scratch:

rm -rf node_modules
npm install
npm start

If the application runs successfully again, the build is reproducible.
- Core flow: user setup → inactivity trigger → Digital Will access

