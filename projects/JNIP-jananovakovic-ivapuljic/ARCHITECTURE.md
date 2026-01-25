# Budgetly - Architecture Documentation

## Overview

**Budgetly** is a web application for tracking and analyzing personal finances. It helps users track spending, plan savings, and understand their financial habits through transaction analysis and data visualization.

**Tech Stack:**
- **Frontend:** React 18.3.1 + Vite 6.0.5 + Tailwind CSS 4.0.3
- **Backend:** Express.js 4.21.2 + Node.js
- **Database:** MongoDB with Mongoose 8.10.0
- **Authentication:** JWT (JSON Web Tokens) with bcryptjs

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Browser]
    end

    subgraph "Frontend (React SPA)"
        App[App.jsx]
        Router[React Router]
        Pages[Page Components]
        Context[UserContext]
        API[Axios Client]
    end

    subgraph "API Layer"
        Server[Express Server]
        Auth[Auth Middleware]
        Routes[API Routes]
        Controllers[Controllers]
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB Database)]
    end

    Browser -->|HTTP/HTTPS| App
    App --> Router
    Router --> Pages
    Context --> Pages
    Pages --> API
    API -->|REST API| Server
    Server --> Auth
    Auth --> Routes
    Routes --> Controllers
    Controllers --> MongoDB

    style Browser fill:#e1f5fe
    style App fill:#fff9c4
    style Server fill:#c8e6c9
    style MongoDB fill:#ffccbc
```

---

## Component Architecture

### Frontend Components

```mermaid
graph TD
    subgraph "Authentication Pages"
        LoginForm[LoginForm.jsx]
        SignUpForm[SignUpForm.jsx]
    end

    subgraph "Main Pages"
        Home[Home.jsx - Dashboard]
        IncomePage[Income Page]
        ExpensePage[Expense Page]
    end

    subgraph "Dashboard Components"
        FinanceOverview[FinanceOverview.jsx]
        Last30Days[Last30DaysExpenses.jsx]
        Last60Days[Last60DaysExpenses.jsx]
        SavingsGoals[SavingsGoals.jsx]
    end

    subgraph "Income Components"
        AddIncome[AddIncomeForm.jsx]
        IncomeList[IncomeList.jsx]
        IncomeOverview[IncomeOverview.jsx]
    end

    subgraph "Expense Components"
        AddExpense[AddExpenseForm.jsx]
        ExpenseList[ExpenseList.jsx]
        ExpenseOverview[ExpenseOverview.jsx]
    end

    subgraph "Shared Components"
        PieChart[PieChart.jsx]
        LineChart[LineChart.jsx]
        BarChart[BarChart.jsx]
        Card[Card.jsx]
    end

    subgraph "Context"
        UserContext[UserContext.jsx]
    end

    LoginForm --> UserContext
    SignUpForm --> UserContext
    Home --> FinanceOverview
    Home --> Last30Days
    Home --> Last60Days
    Home --> SavingsGoals
    IncomePage --> AddIncome
    IncomePage --> IncomeList
    IncomePage --> IncomeOverview
    ExpensePage --> AddExpense
    ExpensePage --> ExpenseList
    ExpensePage --> ExpenseOverview
    FinanceOverview --> PieChart
    FinanceOverview --> LineChart
    FinanceOverview --> BarChart
    Last30Days --> Card
    Last60Days --> Card
    IncomeOverview --> PieChart
    ExpenseOverview --> PieChart

    style UserContext fill:#ffe0b2
    style Home fill:#c5cae9
    style IncomePage fill:#c5cae9
    style ExpensePage fill:#c5cae9
```

### Backend Components

```mermaid
graph TD
    subgraph "Server"
        Server[server.js]
    end

    subgraph "Middleware"
        AuthMiddleware[authMiddleware.js]
        ErrorMiddleware[errorMiddleware]
        CORSMiddleware[CORS]
    end

    subgraph "Routes"
        AuthRoutes[/api/v1/auth/*]
        IncomeRoutes[/api/v1/income/*]
        ExpenseRoutes[/api/v1/expense/*]
        DashboardRoutes[/api/v1/dashboard/*]
    end

    subgraph "Controllers"
        AuthController[authController.js]
        IncomeController[incomeController.js]
        ExpenseController[expenseController.js]
        DashboardController[dashboardController.js]
    end

    subgraph "Models"
        User[User.js]
        Income[Income.js]
        Expense[Expense.js]
    end

    subgraph "Database"
        MongoDB[(MongoDB)]
    end

    Server --> AuthMiddleware
    Server --> CORSMiddleware
    Server --> ErrorMiddleware
    AuthMiddleware --> AuthRoutes
    AuthMiddleware --> IncomeRoutes
    AuthMiddleware --> ExpenseRoutes
    AuthMiddleware --> DashboardRoutes

    AuthRoutes --> AuthController
    IncomeRoutes --> IncomeController
    ExpenseRoutes --> ExpenseController
    DashboardRoutes --> DashboardController

    AuthController --> User
    IncomeController --> Income
    ExpenseController --> Expense
    DashboardController --> Income
    DashboardController --> Expense

    User --> MongoDB
    Income --> MongoDB
    Expense --> MongoDB

    style Server fill:#81c784
    style AuthMiddleware fill:#64b5f6
    style MongoDB fill:#ff8a65
```

---

## Data Flow

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant JWT
    participant MongoDB

    User->>Frontend: Enter credentials
    Frontend->>API: POST /api/v1/auth/login
    API->>MongoDB: Find user by email
    MongoDB-->>API: User document
    API->>API: Compare password (bcrypt)
    alt Valid Credentials
        API->>JWT: Generate token
        JWT-->>API: JWT token
        API-->>Frontend: { success: true, token }
        Frontend->>Frontend: Store token in localStorage
        Frontend->>User: Redirect to dashboard
    else Invalid Credentials
        API-->>Frontend: { success: false, message }
        Frontend->>User: Show error
    end
```

### Transaction Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant MongoDB

    User->>Frontend: Add income/expense
    Frontend->>Frontend: Get JWT from localStorage
    Frontend->>API: POST /api/v1/income (or /expense)
    Note over Frontend,API: Headers: Authorization: Bearer <JWT>
    API->>API: authMiddleware verifies JWT
    API->>MongoDB: Create document with userId
    MongoDB-->>API: Saved document
    API-->>Frontend: { success: true, data }
    Frontend->>User: Update UI with new data
```

### Dashboard Data Aggregation Flow

```mermaid
sequenceDiagram
    participant Frontend
    participant API
    participant MongoDB

    Frontend->>API: GET /api/v1/dashboard/data
    API->>MongoDB: Aggregate income by userId
    API->>MongoDB: Aggregate expenses by userId
    API->>API: Calculate totals (30/60 days)
    API->>API: Merge and sort transactions
    API->>API: Calculate balance
    API-->>Frontend: { income, expenses, balance, transactions }
    Frontend->>Frontend: Render charts and cards
```

---

## Database Schema

```mermaid
erDiagram
    USER ||--o{ INCOME : creates
    USER ||--o{ EXPENSE : creates

    USER {
        string _id PK
        string name
        string email UK
        string password "hashed"
        string profileImage
        date createdAt
    }

    INCOME {
        string _id PK
        string userId FK
        string source "e.g., Salary, Freelance"
        number amount
        date date
        string icon
        date createdAt
    }

    EXPENSE {
        string _id PK
        string userId FK
        string category "e.g., Food, Transport"
        number amount
        date date
        string icon
        date createdAt
    }
```

---

## API Endpoints Structure

```mermaid
graph LR
    subgraph "Authentication API"
        A1[POST /api/v1/auth/login]
        A2[POST /api/v1/auth/signup]
    end

    subgraph "Income API"
        I1[POST /api/v1/income/add-income]
        I2[GET /api/v1/income/get-income]
        I3[DELETE /api/v1/income/delete-income/:id]
        I4[GET /api/v1/income/export-income]
    end

    subgraph "Expense API"
        E1[POST /api/v1/expense/add-expense]
        E2[GET /api/v1/expense/get-expenses]
        E3[DELETE /api/v1/expense/delete-expense/:id]
        E4[GET /api/v1/expense/export-expenses]
    end

    subgraph "Dashboard API"
        D1[GET /api/v1/dashboard/data]
    end

    Client[Client] --> A1
    Client --> A2
    Client --> I1
    Client --> I2
    Client --> I3
    Client --> I4
    Client --> E1
    Client --> E2
    Client --> E3
    Client --> E4
    Client --> D1

    style A1 fill:#4caf50,color:#fff
    style A2 fill:#4caf50,color:#fff
    style I1 fill:#2196f3,color:#fff
    style I2 fill:#2196f3,color:#fff
    style I3 fill:#f44336,color:#fff
    style I4 fill:#ff9800,color:#fff
    style E1 fill:#2196f3,color:#fff
    style E2 fill:#2196f3,color:#fff
    style E3 fill:#f44336,color:#fff
    style E4 fill:#ff9800,color:#fff
    style D1 fill:#9c27b0,color:#fff
```

### API Details

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| POST | `/api/v1/auth/login` | User login | No |
| POST | `/api/v1/auth/signup` | User registration | No |
| POST | `/api/v1/income/add-income` | Add income entry | Yes |
| GET | `/api/v1/income/get-income` | Get user income | Yes |
| DELETE | `/api/v1/income/delete-income/:id` | Delete income | Yes |
| GET | `/api/v1/income/export-income` | Export income to Excel | Yes |
| POST | `/api/v1/expense/add-expense` | Add expense entry | Yes |
| GET | `/api/v1/expense/get-expenses` | Get user expenses | Yes |
| DELETE | `/api/v1/expense/delete-expense/:id` | Delete expense | Yes |
| GET | `/api/v1/expense/export-expenses` | Export expenses to Excel | Yes |
| GET | `/api/v1/dashboard/data` | Get dashboard analytics | Yes |

---

## Routing Structure

### Frontend Routes

```mermaid
graph TD
    Root[/]

    Root -->|redirect| Login[/login]
    Root -->|navigate| SignUp[/signUp]
    Root -->|protected| Dashboard[/dashboard]
    Root -->|protected| Income[/income]
    Root -->|protected| Expense[/expense]

    Dashboard --> Home[Home.jsx]
    Income --> IncomePage[Income Page]
    Expense --> ExpensePage[Expense Page]

    Login --> LoginForm[LoginForm.jsx]
    SignUp --> SignUpForm[SignUpForm.jsx]

    style Login fill:#ffcdd2
    style SignUp fill:#ffcdd2
    style Dashboard fill:#c8e6c9
    style Income fill:#c8e6c9
    style Expense fill:#c8e6c9
```

---

## State Management

```mermaid
graph TD
    subgraph "UserContext State"
        User[user object]
        Token[JWT token]
        Loading[loading state]
    end

    subgraph "Components that consume UserContext"
        LoginForm[LoginForm]
        SignUpForm[SignUpForm]
        Home[Home/Dashboard]
        Income[Income Pages]
        Expense[Expense Pages]
    end

    User --> LoginForm
    User --> SignUpForm
    User --> Home
    User --> Income
    User --> Expense
    Token --> LoginForm
    Token --> Home
    Token --> Income
    Token --> Expense
    Loading --> Home

    style User fill:#fff9c4
    style Token fill:#fff9c4
    style Loading fill:#fff9c4
```

---

## Project Structure

```
budgetly/
├── frontend/expense-tracker/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── income/
│   │   │   ├── expense/
│   │   │   └── charts/
│   │   ├── context/
│   │   │   └── UserContext.jsx
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   ├── incomeController.js
    │   ├── expenseController.js
    │   └── dashboardController.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── models/
    │   ├── User.js
    │   ├── Income.js
    │   └── Expense.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── incomeRoutes.js
    │   ├── expenseRoutes.js
    │   └── dashboardRoutes.js
    ├── server.js
    └── package.json
```

---

## Environment Variables

### Backend (.env)
```bash
MONGO_URI=mongodb://localhost:27017/budgetly
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
PORT=5000
```

---

## Security Features

1. **Password Hashing:** All passwords are hashed using bcryptjs before storage
2. **JWT Authentication:** Stateless authentication using JSON Web Tokens
3. **Protected Routes:** All API endpoints (except auth) require valid JWT
4. **CORS Configuration:** Cross-origin requests restricted to client URL
5. **Input Validation:** Basic validation on API endpoints

---

## Key Features Implemented

- [x] User registration and login
- [x] JWT-based authentication
- [x] Income tracking with categories and icons
- [x] Expense tracking with categories and icons
- [x] Dashboard with financial overview
- [x] Data visualization (Pie, Line, Bar charts)
- [x] Export to Excel functionality
- [x] Profile image upload
- [x] Responsive design with Tailwind CSS

---

## Features Not Yet Implemented (Per Specification)

- [ ] AI Agent for savings recommendations
- [ ] Spending prediction algorithms
- [ ] Category-based spending alerts
- [ ] Automated financial advice based on patterns

---

## Entry Points

| Component | Path |
|-----------|------|
| Frontend Entry | `frontend/expense-tracker/src/main.jsx` |
| React Router | `frontend/expense-tracker/src/App.jsx` |
| Backend Server | `backend/server.js` |
| Database Config | `backend/config/db.js` |
