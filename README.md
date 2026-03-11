# Doomsday Countdown — Real-Time Global Visitor Tracker

A cinematic web application that counts down to a global event while visualizing where viewers are watching from around the world in real time.

What began as a simple countdown timer has evolved into a *live global analytics experience*, combining geolocation, real-time database updates, and interactive data visualization.

---

## ✨ Overview

The application displays a precise UTC-based countdown and simultaneously tracks visitors across the globe.

Each visitor is detected using IP-based geolocation, stored in a database, and reflected on a live world map.

This creates a *shared global experience*, allowing users to see how many others are viewing the countdown and from which countries.

---

## 🚀 Key Features

- ⏳ *Accurate UTC Countdown Engine*  
  Displays months, days, hours, minutes, and seconds remaining until the event.

- 🔄 *Automatic Mode Switching*  
  Once the countdown reaches the target date, the timer automatically switches to elapsed-time mode.

- 🌍 *Global Visitor Visualization*  
  An interactive world map showing where visitors are accessing the countdown.

- ⚡ *Real-Time Data Updates*  
  Map updates instantly when new visitors arrive using Supabase realtime subscriptions.

- 👁 *Live Visitor Counter*  
  Tracks total viewers interacting with the application.

- 📍 *IP-Based Geolocation*  
  Automatically detects visitor's country and coordinates.

- 🎬 *Cinematic User Interface*  
  Designed with a minimal, immersive visual style.

---

## ⏳ Dynamic Countdown Behavior

The timer intelligently switches its behavior depending on the event status.

### Before the Event

The application displays:

DOOMSDAY IS COMING

The timer counts *down toward the target event date*.

### After the Event

Once the event date is reached, the application automatically switches to:

SINCE DOOMSDAY

The timer begins *counting how much time has passed since the event occurred*.

### Logic Flow


Current Time < Event Date
        ↓
Countdown Mode
        ↓
Display: DOOMSDAY IS COMING

Current Time ≥ Event Date
        ↓
Elapsed Time Mode
        ↓
Display: SINCE DOOMSDAY


All calculations are performed using *UTC time*, ensuring consistent behavior regardless of the visitor's timezone.

---

## 🧠 System Flow


1. Visitor opens the website

2. IP geolocation API detects location
   
3. Visitor country stored in Supabase
        
4. Realtime database event triggered
        
5. React listener receives update
      
6. Global map updates instantly


---

## 🛠 Technology Stack

### Frontend
- React
- Vite
- React Simple Maps
- CSS

### Backend
- Supabase (PostgreSQL)
- Supabase Realtime

### External Services
- IP Geolocation API

---



## ⚙️ Local Development

Clone the repository

bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO


Install dependencies

bash
npm install


Start the development server

bash
npm run dev


---

## 🔐 Environment Variables

Create a .env file in the root directory.


VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key


---

## 🌐 Deployment

The project can be deployed using modern hosting platforms such as:

- Vercel (recommended)
- Netlify

---

## 📈 Future Enhancements

- Visitor activity heatmap
- Unique visitor tracking
- Animated live map pulses
- Event analytics dashboard
- Live visitor ticker showing countries joining in real time

---

## 👨‍💻 Author

*Sanjay Babu*

Building interactive and data-driven web applications.
