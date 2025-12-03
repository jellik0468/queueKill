# QueueKill

QueueKill is a real-time restaurant queue management system with two roles:

- **Customers** — scan a QR code to join a queue, view wait times, and see live updates.
- **Owners** — create and manage restaurant queues, call next customer, and monitor activity.

Built as a full-stack project with modern web technologies and real-time Socket.IO communication.

---

## Features

### Customer
- Scan QR code to open queue page  
- Join queue (name, phone, group size)  
- View current position + estimated wait  
- Live updates when queue changes  
- “You’re Up” alert when called  

### Owner
- Register/login as a restaurant owner  
- Create restaurant + multiple queues  
- Real-time queue dashboard  
- Call next customer  
- Remove/cancel queue entries  

### System
- Real-time updates using Socket.IO  
- QR code generation for each queue  
- Role-based authentication with JWT  
- Clean, scalable backend architecture  

---

## Tech Stack

### Frontend
- React + TypeScript  
- TailwindCSS  
- React Router  
- Axios  
- Zustand  
- Socket.IO client  

### Backend
- Node.js + Express + TypeScript  
- Prisma ORM + PostgreSQL  
- Socket.IO  
- JWT Authentication  
- Zod Validation  
- QR Code Generation  

### Infrastructure
- Vercel (Frontend)  
- Render / Railway (Backend)  
- Neon / Supabase (PostgreSQL)  

---

## Deployment

### Frontend
Deploy to **Vercel**  
- Add `VITE_API_URL` environment variable  
- Configure production domain for QR code system  

### Backend
Deploy to **Render** or **Railway**  
- Add `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`  
- Enable WebSocket support  
- Set CORS to allow the frontend domain  

### Database
Use **Neon** or **Supabase** PostgreSQL  
- Connect with Prisma  
- Run migrations on deploy  

---

## Notes
- Push notifications require PWA + HTTPS (This version only allow in bronwser prompt)  
- Google sign in is not implemented

---

## License
MIT
