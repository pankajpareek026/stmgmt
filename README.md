# 📊 STMGMT – Smart Management Platform

[![GitHub last commit](https://img.shields.io/github/last-commit/pankajpareek026/stmgmt)](https://github.com/pankajpareek026/stmgmt/commits/master)
[![GitHub language count](https://img.shields.io/github/languages/count/pankajpareek026/stmgmt)](https://github.com/pankajpareek026/stmgmt)
[![GitHub top language](https://img.shields.io/github/languages/top/pankajpareek026/stmgmt)](https://github.com/pankajpareek026/stmgmt)
[![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=constpro)](https://constpro.vercel.app/)

**A full‑stack management dashboard built with Next.js 16, TypeScript, and MongoDB.**  
Streamline your business operations with integrated employee, attendance, payroll, expense, and project management – all in one place.

🔗 **Live Demo:** [constpro.vercel.app](https://constpro.vercel.app/)

---

## 📌 Overview

STMGMT is a modern, enterprise‑ready web application designed to help small and medium‑sized businesses manage their workforce and finances efficiently. It consolidates multiple administrative functions into a single, intuitive interface, reducing manual overhead and providing real‑time insights.

This project demonstrates my ability to architect and deliver a full‑stack solution with:
- **Secure authentication** (JWT + bcrypt)
- **Role‑based access control**
- **Multi‑currency support**
- **Interactive dashboards** with real‑time data
- **Responsive, accessible UI** using Radix UI and Tailwind CSS

---

## ✨ Key Features

| Module | Description |
|--------|-------------|
| **Authentication** | Login, signup, password reset, and protected routes with JWT |
| **Employee Management** | CRUD operations for employees, with assignment to projects |
| **Attendance Tracking** | Calendar‑based attendance logging with duplicate entry prevention |
| **Payroll Processing** | Salary calculations with multi‑currency support |
| **Expense Management** | Track and categorise business expenses |
| **Project Management** | Create, assign, and monitor projects |
| **Reporting** | Generate insights and summaries from your data |
| **Profile & Settings** | User profile management and application preferences |
| **Multi‑Currency** | Configurable currency support across all financial modules |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (95.5%)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4 + `tailwindcss-animate`
- **Component Library:** Radix UI primitives (Accordion, Dialog, Dropdown, Tabs, Toast, etc.)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend (API Routes within Next.js)
- **Runtime:** Node.js (Next.js API routes)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken) + bcryptjs
- **Environment:** dotenv

### DevOps & Tooling
- **Package Manager:** pnpm (with npm fallback)
- **Linting:** ESLint
- **Deployment:** Vercel (automatic from GitHub)
- **Analytics:** Vercel Analytics

---

## 📁 Project Structure

```text
stmgmt/
├── app/                    # Next.js App Router – pages and layouts
│   ├── api/                # Backend API routes (serverless functions)
│   ├── attendance/         # Attendance tracking pages
│   ├── employees/          # Employee management pages
│   ├── expenses/           # Expense tracking pages
│   ├── forgot-password/    # Password reset flow
│   ├── login/              # Authentication pages
│   ├── payroll/            # Payroll processing pages
│   ├── profile/            # User profile pages
│   ├── projects/           # Project management pages
│   ├── reports/            # Reporting and analytics pages
│   ├── reset-password/     # Password reset confirmation
│   ├── signup/             # Registration pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Homepage / Dashboard
├── components/             # Reusable React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── add-employee-dialog.tsx
│   ├── attendance-calendar.tsx
│   ├── currency-provider.tsx
│   └── ...                 # Feature-specific components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions, helpers, and configurations
├── public/                 # Static assets (images, fonts, etc.)
├── server/                 # Additional server-side logic (if any)
├── styles/                 # Legacy or supplementary styles
├── .gitignore
├── components.json         # shadcn/ui configuration
├── next.config.mjs         # Next.js configuration
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs      # PostCSS (Tailwind) configuration
├── tsconfig.json           # TypeScript configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** – v18.x or higher (v20+ recommended)
- **MongoDB** – local instance or MongoDB Atlas (cloud)
- **pnpm** (recommended) – or npm/yarn as fallback

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your-super-secret-key` |
| `NEXTAUTH_SECRET` | (If using NextAuth) – fallback secret | `another-secret` |
| `NEXT_PUBLIC_APP_URL` | Public URL of your app | `http://localhost:3000` |

> ⚠️ **Never commit the `.env.local` file.** It is already ignored via `.gitignore`.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pankajpareek026/stmgmt.git
   cd stmgmt
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   - Create `.env.local` and add the variables listed above.

4. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

5. **Build for production**
   ```bash
   pnpm build
   pnpm start
   ```

---

## 🔒 Security Best Practices

This project follows industry‑standard security practices:

- **JWT-based authentication** – stateless and secure
- **Password hashing** – bcryptjs for robust password storage
- **Environment variables** – all secrets are stored in `.env.local` (never committed)
- **Input validation** – Zod schemas validate all form inputs
- **Type safety** – TypeScript catches errors at compile time

### Credentials Check

Before deploying or sharing your code, **always verify** that no credentials are hardcoded:

- **Search for patterns:** `api_key`, `secret`, `password`, `token`, `mongodb+srv`, `privateKey`
- **Check these directories:** `lib/`, `server/`, `app/api/`, `hooks/`
- **If you find any** – replace with environment variables and revoke the exposed secret immediately.

---

## 📦 Deployment

This project is optimised for **Vercel** (the live demo is hosted there).

**Deploy your own instance:**

1. Push your code to a GitHub repository.
2. Sign in to [Vercel](https://vercel.com) and import the project.
3. Vercel automatically detects Next.js and sets up the build configuration.
4. Add the required environment variables in the Vercel dashboard.
5. Deploy – your app will be live in minutes.

For other platforms (AWS, Render, etc.), use:
```bash
pnpm build
pnpm start
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve this project:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

Please ensure your code adheres to the existing style and includes relevant tests or documentation.

---

## 📄 License

This project is currently **unlicensed**. All rights reserved.  
For usage rights or collaboration inquiries, please contact the author.

---

## 📬 Contact

**Pankaj Pareek**  
- GitHub: [pankajpareek026](https://github.com/pankajpareek026)  
- Live Demo: [constpro.vercel.app](https://constpro.vercel.app/)  
- Project Link: [https://github.com/pankajpareek026/stmgmt](https://github.com/pankajpareek026/stmgmt)

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) – The React framework for production
- [shadcn/ui](https://ui.shadcn.com/) – Beautiful, accessible components
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework
- [Vercel](https://vercel.com/) – Hosting and deployment platform
- [MongoDB](https://www.mongodb.com/) – Database for modern applications
