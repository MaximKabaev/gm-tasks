# G&M Studio Task Management

A complete self-hosted task management web application for G&M Studio, built with Next.js 14+, TypeScript, Tailwind CSS, and SQLite.

## Features

- **Authentication**: JWT-based authentication with httpOnly cookies and bcrypt password hashing
- **Project Management**: CRUD operations for projects with client information
- **Kanban Boards**: Drag-and-drop task management with 4 columns (To Do, In Progress, Review, Done)
- **Task Management**:
  - Full CRUD operations
  - Assignee management
  - Priority levels (Low, Medium, High, Urgent)
  - Due dates with overdue tracking
  - Predefined labels (frontend, backend, design, bug, feature, urgent)
  - Comments system
  - Quick-add task buttons in each column
- **Dashboard**: Personal task overview with overdue tasks and active tasks
- **Dark Theme**: Clean, modern dark theme with responsive design

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite via Prisma ORM
- **Authentication**: JWT with bcrypt
- **Drag & Drop**: @hello-pangea/dnd

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma migrate dev
npx prisma db seed
```

3. Build the application:
```bash
npm run build
```

4. Start the production server:
```bash
npm start
```

The application will be available at `http://localhost:3080`

### Development Mode

To run in development mode:
```bash
npm run dev
```

## Default Users

The application is seeded with 2 users:

- **Maxim**: maxim@gm-studio.dev / changeme123
- **German**: german@gm-studio.dev / changeme123

## Environment Variables

The application uses a `.env` file with the following variables:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="gm-studio-jwt-secret-change-in-production"
```

**Important**: Change the `JWT_SECRET` in production!

## Project Structure

```
gm-tasks/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── projects/     # Project CRUD
│   │   ├── tasks/        # Task CRUD and comments
│   │   └── users/        # User endpoints
│   ├── dashboard/        # User dashboard page
│   ├── login/            # Login page
│   ├── projects/[id]/    # Project detail with Kanban board
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Projects list (home page)
│   └── globals.css       # Global styles
├── components/
│   ├── KanbanBoard.tsx   # Drag-and-drop Kanban board
│   ├── Navbar.tsx        # Navigation component
│   ├── TaskCard.tsx      # Task card component
│   └── TaskDetailModal.tsx # Task detail modal with comments
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── prisma.ts         # Prisma client
│   └── types.ts          # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── middleware.ts         # Authentication middleware
└── .env                  # Environment variables
```

## Database Schema

- **User**: Authentication and user information
- **Project**: Projects with client information
- **Task**: Tasks with status, priority, assignee, labels, and more
- **Comment**: Comments on tasks
- **Activity**: Activity log (future use)

## Features Detail

### Kanban Board
- 4 columns: To Do, In Progress, Review, Done
- Drag and drop tasks between columns
- Quick-add task button in each column header
- Real-time task counts

### Task Management
- Click any task to open detail modal
- Edit all task fields inline
- Add comments to tasks
- Delete tasks with confirmation
- Color-coded labels and priorities
- Due date tracking with overdue indicators

### Dashboard
- Overview of all your assigned tasks
- Overdue tasks highlighted in red
- Task statistics by status
- Quick navigation to projects

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens stored in httpOnly cookies
- Protected routes with middleware
- CSRF protection via sameSite cookies

## License

Private - G&M Studio
