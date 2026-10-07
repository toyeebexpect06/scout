# Scouter Full HTML/CSS/JS

This is a standalone browser implementation of a Scouter-style bulk email outreach dashboard.

Features:
- Recipient input and CSV/TXT import
- Recipient validation and counts
- 3 subject-line + 3 message-body variants
- Each variant is a matched subject/body pair
- Shuffle mode randomly assigns one of the 3 variants to each recipient
- {name}, {email}, and {domain} personalization
- Generated email list
- mailto links
- Clicked/sent status
- Search and status filtering
- Copy all
- CSV export
- Campaign statistics
- Email domain analytics
- Templates
- Scheduling UI
- Light/dark mode
- LocalStorage persistence
- Responsive layout

Important:
This is front-end HTML/CSS/JS. It does not silently send bulk email through a user's mailbox. Clicking a generated message opens the user's default mail application using a mailto link. For real automatic sending, connect an authorized email provider/API and a backend.
