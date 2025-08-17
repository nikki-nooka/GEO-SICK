# GeoSick: AI-Powered Environmental Health Intelligence

**A sophisticated web application that leverages Google's Gemini AI to provide real-time, location-based environmental health analysis and personalized health insights.**

---

## Team: [Your Team Name]
- [Your Name/Member 1]
- [Member 2]
- [Member 3]
- ...

## Problem Statement
Access to timely, understandable, and actionable environmental health data is a critical global challenge. Public health officials, NGOs, and communities often struggle to connect complex environmental factors—like climate, geography, and pollution—to specific, localized health risks. This information gap leads to reactive healthcare systems that treat diseases after they emerge, rather than preventing them. There is a pressing need for a tool that can democratize environmental intelligence, making it easy for anyone to understand the potential health hazards in their immediate surroundings and take proactive measures.

## Overview of Our Solution
GeoSick is a cutting-edge web application that bridges the gap between environmental data and public health. Powered by Google's advanced Gemini AI models, GeoSick provides users with an intuitive platform to analyze environmental health risks from anywhere in the world.

By leveraging AI for location-based analysis, image recognition, and natural language processing, GeoSick transforms raw data into a clear, actionable intelligence briefing. It identifies potential hazards, predicts associated diseases, suggests preventive measures, and connects users with nearby health resources. Our goal is to empower individuals and communities to shift from a reactive to a proactive stance on health, mitigating crises before they begin.

## Key Features
- **🌍 Interactive 3D Globe Explorer**: Click anywhere on a high-fidelity 3D globe or use the search function to initiate a detailed environmental health analysis for that specific location.
- **📸 AI Image Analysis**: Upload a photo of a local area (e.g., a neighborhood, park, or water source) to get an instant AI-driven report on potential health hazards, associated disease risks, and recommended precautions.
- **📜 Prescription Analysis**: Simply take a picture of a doctor's prescription, and our AI will transcribe the medicines, dosages, and instructions into a clear, easy-to-understand format.
- **🩺 AI Symptom Checker**: Describe your symptoms in natural language to receive a cautious, AI-generated analysis of potential conditions and recommended next steps. **(Note: Not a substitute for professional medical advice)**.
- **🧠 Mental Wellness Check-in**: Answer a short, confidential questionnaire to receive a supportive, non-clinical reflection on your mental well-being, including gentle observations and helpful coping strategies.
- **🤖 AI Health Assistant**: An integrated chatbot, powered by a specialized Gemini model, is available to answer your questions about diseases, symptoms, and prevention in a conversational way.
- **☀️ Daily Health Briefing**: Get a personalized daily health forecast based on your location, including analyses of air quality, pollen counts, UV index, and other environmental risk factors.
- **🏥 Nearby Facility Finder**: After an analysis, find nearby hospitals, clinics, and pharmacies with a single click, complete with distances and directions.
- **📈 Personal Activity History**: Logged-in users have access to a persistent history of their past scans and activities, allowing them to review previous analysis results at any time.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **AI & Machine Learning**: Google Gemini API (`gemini-2.5-flash`, `imagen-3.0-generate-002`)
- **3D Visualization**: `react-globe.gl`, `three.js`
- **Build Tool**: Vite

## Installation and Setup
Follow these steps to get a local copy of GeoSick up and running.

**Prerequisites:**
- Node.js (v18 or later recommended)
- npm or yarn

**1. Clone the Repository**
```bash
git clone https://github.com/your-username/geosick.git
cd geosick
```

**2. Install Dependencies**
```bash
npm install
# or
yarn install
```

**3. Set Up Environment Variables**
GeoSick requires a Google Gemini API key to function.

- Create a file named `.env` in the root of your project directory.
- Add your API key to this file:
  ```
  API_KEY=YOUR_GEMINI_API_KEY
  ```
- You can obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

**4. Run the Development Server**
```bash
npm run dev
# or
yarn dev
```
The application should now be running on `http://localhost:5173`.

## Usage Guide
1.  **Homepage**: On the first visit, you'll see an intro animation. You can then explore the globe or sign up/log in.
2.  **Explore the Globe**: Click the "Explore Now" button. You can either click directly on the 3D globe or use the search bar to find a location. A detailed analysis panel will appear with hazards, potential diseases, and nearby health facilities.
3.  **Analyze an Image**: After logging in, select "Analyze Image". Upload a photo or use your camera to capture one. The AI will analyze it and produce a report.
4.  **Use Other Tools**: From the welcome dashboard, you can access the Prescription Analyzer, Symptom Checker, Mental Wellness Check-in, or your Daily Health Briefing. Follow the on-screen instructions for each tool.
5.  **View History**: From the welcome dashboard, click "Activity History" to see a log of your past scans and logins. You can view the details of any previous analysis.
6.  **Chat with the AI**: Click the chatbot icon in the bottom-right corner at any time to ask health-related questions.

## Demo
- **Live Demo Link**: [Insert Your Live Demo URL Here]
- **Video Walkthrough**: [Link to YouTube, Loom, or other video here]

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
