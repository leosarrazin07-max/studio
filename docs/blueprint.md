# **App Name**: PrEPy

## Core Features:

- Activity Window Display: Display of medication activity window with 'Start PrEP Session' button.
- Confirmation Pop-up: Pop-up to confirm medication intake time with options: 'I took 2 pills now', 'I took 2 pills earlier', and 'Cancel'.
- Time Picker: Date/time picker for specifying past intake time, with 15-minute intervals up to 5 days prior.
- Status Indicator: Color-coded display (blue when effective, red on missed dose) indicating medication effectiveness status and next dose timing.
- Missed Dose Alerts: Alert system for missed doses with specific time elapsed (e.g., 'yesterday at [time]').
- Session Management Buttons: Buttons to 'End Session' and log a dose ('It's Taken') to reset timers. 'End Session' includes a buffer before the protection decreases.
- Dosage History: Scrolling history to log doses over the past 90 days.

## Style Guidelines:

- Primary color: Firebase Studio's blue (#039BE5) to represent reliability and calm. Use in the header and main UI elements.
- Background color: Light gray (#F5F5F5) for a clean, unobtrusive backdrop, inspired by Firebase Studio's interface.
- Accent color: Firebase Studio's green (#1EE3CF) for 'C'est Pris', active states, and positive confirmations.
- Body and headline font: 'Roboto' sans-serif, for a clean and neutral design suitable for displaying times and dates, with the best legibility for small text on mobile devices, mirroring Firebase Studio's typography.
- Simple, clear icons to represent dosage times and alerts, preferably in a minimalist style, consistent with Firebase Studio's icon set. Use the Firebase Studio's green (#1EE3CF) to give them more flair.
- Clean and organized layout optimized for mobile, ensuring essential information is easily accessible and prominent, inspired by Firebase Studio's user-friendly design.
- Subtle animations, similar to Firebase Studio's transitions, when confirming a new dose or ending session.