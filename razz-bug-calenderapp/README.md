# Calendar Notes App

A simple, accessible calendar application built with React and TypeScript. It displays three months in a grid layout and allows users to click on any date to add a short note via an overlay popup. Notes are persisted using `localStorage`.

---

## 🚀 Features

- Displays previous, current, and next month in a responsive grid
- Highlights today's date
- Clickable dates open an overlay for adding/viewing notes
- Notes saved per-date and persisted in `localStorage`
- Overlay dynamically aligns to clicked date (left, center, or right)
- Accessibility features:
  - Keyboard navigation
  - Focus trap inside overlay
  - ESC to close
  - ARIA-compliant modals and buttons
- Responsive layout for desktop and mobile

---

## 🧠 Approach

### 🗂️ State Management

- **React Context API** is used to store and update note data
- Notes are stored in memory and synced with `localStorage` using `useEffect`.

### 📍 Overlay Positioning

- When a date is clicked, its `getBoundingClientRect` is used to capture position and width.
- The app determines overlay alignment:
  - `left` for right-aligned calendar cells (e.g., days 5–7)
  - `right` for left-aligned calendar cells (e.g., days 1–2)
  - `center` for middle column (day 4) or on mobile
- The overlay positions itself dynamically and includes an arrow pointing to the clicked date using CSS.

---

## 🔄 Trade-offs & Future Improvements

### ✅ What works well:
- Dynamic overlay with accurate pointer positioning
- Keyboard-accessible experience
- Seamless note editing and saving

### 🔧 If I had more time:
- Improve date keyboard navigation (arrow keys to move days)
- Add animations to overlay open/close
- Improve styling with a component library like Tailwind
- Sync notes across devices using backend storage
---

## 🛠️ Local Setup Instructions

1. **Clone the repo**

```bash
git clone https://github.com/abdrzqsalihu/calendar-notes-app.git
cd calendar-notes-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

