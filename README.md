# Engezhaly - Freelance Marketplace

Engezhaly is a freelance marketplace platform tailored for the Egyptian market. It connects clients with freelancers in a simple, teenager-friendly environment.

## Project Identity & Design System

*   **Name:** Engezhaly
*   **Target Audience:** Teenager-friendly, simple, Egyptian market.
*   **Design Philosophy:** "Thumb-friendly" with big buttons, large text, and minimal steps.
*   **Color Palette:**
    *   **Primary:** `#09BF44` (Green) – Used for buttons, icons, logos, hover states.
    *   **Secondary:** `#333333` (Grey) – Used for text, headers, borders.
    *   **Background:** `#FFFFFF` (Pure White).

## Tech Stack

*   **Frontend:** Next.js (App Router), Tailwind CSS, Lucide Icons.
*   **Backend:** Node.js, Express, Socket.io, Mongoose.
*   **Database:** MongoDB.

## Features

1.  **Public Homepage:** Unauthenticated browse view.
2.  **Authentication:** Sign Up/In flow for Clients and Freelancers.
3.  **Freelancer Onboarding:** Strict 5-step approval process.
4.  **Projects System:** Projects with Basic/Standard/Premium pricing.
5.  **Client Dashboard:** Hiring, Wallet, and Job Posting.
6.  **Real-time Communication:** Chat with text, files, voice, and moderation.
7.  **Financial Logic:** Platform fees, wallet top-ups, escrow.
8.  **Admin Panel:** Approvals, Monitoring, Strike System.

## Project Structure

```text
/engezhaly-platform
├── /client (Next.js)
│   ├── /app
│   │   ├── /auth
│   │   ├── /dashboard
│   │   ├── /projects
│   │   └── /chat
│   ├── /components
│   └── /lib
│
├── /server (Node.js/Express)
│   ├── /models
│   ├── /routes
│   ├── /sockets
│   ├── /middleware
│   └── /services
```
