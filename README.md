# Traditional Mandir Sunrise Indian Wedding Invitation HTML

An interactive digital Indian wedding invitation webpage with animated 3D carved teak temple doors, Mandir sunrise artwork with scroll-to-walk-in parallax, real-time countdown, gold foil scratch-to-reveal card, multi-event itinerary, Google Maps & Calendar integration, Web Audio synthesized Indian wedding melody, and RSVP with WhatsApp reply.

---

## Quick Start

### 1. View Directly in Browser
You can open either file in any modern web browser:
- **`index.html`**: The full-screen mobile/responsive wedding invitation.
- **`preview.html`**: A desktop interactive phone simulator with bezel, restart door, and fullscreen controls.

### 2. Run with Local Web Server
To test locally with live server:
```bash
# Using Python 3:
python3 -m http.server 8080

# Then open in your browser:
# http://localhost:8080/preview.html
# or
# http://localhost:8080/index.html
```

---

## Features

1. **3D Interactive Teak Doors**:
   - Detailed carved wooden temple doors with brass bells and lotus medallions.
   - Monogram gold coin medallion (e.g. `AR`) with pulsating ripple effect.
   - 3D door swing on tap/click with rose petal and golden glitter bursts.
2. **Audio Experience**:
   - Floating music pill with spinning vinyl record and animated equalizer bars.
   - Built-in Web Audio API synthesizer playing an Indian classical harp/santoor wedding melody without needing external MP3 files.
   - Supports YouTube song integration or custom audio files.
3. **Parallax Walk-in to Temple**:
   - Mandir sunrise painting with bride and groom.
   - Smooth scroll zoom walking towards the temple doors, dissolving seamlessly into the ornate arch card.
4. **Interactive Scratch Card ("Save The Date")**:
   - Realistic gold foil scratch canvas with touch/mouse support.
   - Unveils the wedding date with celebratory confetti burst.
5. **Live Countdown Timer**:
   - Real-time days, hours, minutes, and seconds counter until the wedding.
6. **Detailed Event Cards**:
   - Haldi, Mehendi, Sangeet, and Wedding cards with custom SVG icons, venues, timings, dress codes, and notes.
   - One-tap "Directions" (Google Maps) and "Save Date" (Google Calendar) links.
7. **Travel & Stay Section**:
   - Airport, railway station, guest stay arrangements, and seasonal weather advice.
8. **Contact Coordinators**:
   - Direct call and WhatsApp buttons for family coordinators.
9. **Interactive RSVP Form**:
   - Guest count selector, event checkboxes, personalized message.
   - Submits reply and creates pre-formatted WhatsApp response message.

---

## Customization Guide

All wedding content is cleanly configured inside the `<script type="application/json" id="invite-data">` tag in `index.html`.

### 1. Couple & Family Details
```json
"bride": {
  "name": "Ananya",
  "full": "Ananya Sharma",
  "line": "Daughter of Mr. Rajesh & Mrs. Kavita Sharma"
},
"groom": {
  "name": "Rohan",
  "full": "Rohan Mehta",
  "line": "Son of Mr. Suresh & Mrs. Neeta Mehta"
},
"city": "Jaipur, Rajasthan",
"hashtag": "#AnanyaWedsRohan"
```

### 2. Events & Dates
Each event in the `"events"` list has:
```json
{
  "id": "sangeet",
  "name": "Sangeet",
  "date": "2026-12-11T19:30:00+05:30",
  "time": "7:30 PM onwards",
  "venue": "Neelkamal Gardens",
  "address": "Tonk Road, Jaipur",
  "map": "https://maps.google.com/?q=Neelkamal+Gardens+Tonk+Road+Jaipur",
  "dress": "Indo-western",
  "note": "Both families on one stage, and a dance-off nobody will win."
}
```

### 3. RSVP & WhatsApp Number
To receive RSVPs on your WhatsApp:
```json
"rsvp": {
  "by": "1 December 2026",
  "whatsapp": "+919876543210",
  "phone": "+919876543210"
}
```

### 4. Background Music
- **Built-in synthesized tune**:
  ```json
  "song": { "mode": "tune", "timbre": "harp" }
  ```
  *(Available timbres: `"harp"`, `"santoor"`, `"musicbox"`, `"piano"`)*
- **YouTube video soundtrack**:
  ```json
  "song": {
    "mode": "youtube",
    "youtube": "YOUTUBE_VIDEO_ID",
    "title": "Kesariya",
    "by": "Arijit Singh"
  }
  ```

---

## File Structure

```
wedding/
├── index.html           # Full invitation webpage
├── preview.html         # Interactive mobile simulator for desktop
├── README.md            # Documentation & instructions
└── assets/
    ├── css/
    │   └── invite.css   # Styles, fonts, responsive layout & 3D transforms
    ├── js/
    │   ├── boot.js      # Gate locking & viewport setup
    │   ├── shared.js    # Sound synth, particles, countdown & helpers
    │   ├── canvas-art.js# Gold foil scratch card canvas logic
    │   ├── gsap-3.12.5.min.js # GSAP animation library
    │   └── invite.js    # Mandir Sunrise invitation renderer
    └── images/
        ├── temple.webp  # Mandir sunrise painting (1024x1536)
        ├── door.webp    # Carved temple doors artwork (1024x1536)
        ├── card.webp    # Arch parchment card border-image (1024x1536)
        └── frame.webp   # Foreground cut-out arch border-image (1024x1536)
```
