
# Expense Tracker Application

A full-stack Expense Tracker web application built with Node.js, Express, PostgreSQL, and JavaScript (Bootstrap 5).

---

##  Backend Setup & API

A RESTful API built with Express, Node.js, and PostgreSQL to manage personal expenses, handle data validation, and store expenses safely in a database.

### Prerequisites
Make sure you have **Node.js**, **PostgreSQL** (with pgAdmin), and **VS Code** installed.

### Database Setup
1. Open pgAdmin and create a new database named `expense_tracker`.
2. Open the Query Tool in `expense_tracker`, paste the contents of `schema.sql`, and execute it to create the `expenses` table and insert initial sample data.

### Backend Setup
1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend

2. Install the required packages:

     Bash
     npm install
3. Create a .env file in the backend directory (you can copy .env.example) and add your PostgreSQL credentials.

4. Start the server:

     Bash
     node server.js

(Note: API testing screenshots can be found inside the backend/screenshots folder.)

Frontend Setup & Features

A responsive dynamic user interface built with HTML5, Bootstrap 5, and vanilla JavaScript using async/await Fetch API.

Features
1. Live Summary Cards: Displays total expenses amount, expense count, and highest expense dynamically calculated from all recorded expenses (styled using CSS Grid).

2. CRUD Operations: Add, Edit, and Delete expenses with real-time UI updates.

3. Category Filtering: Filter displayed expenses by categories (Food, Transport, Bills, Entertainment, Other) without altering summary card calculations.

4. Form Validations & Modal Support: Interactive modal for updating entries and client-side validations to ensure clean data entry.

5. Security: XSS prevention applied when rendering dynamic data.

How to Run Frontend
1. Ensure the backend server is running at http://localhost:3000.

2. Navigate to the frontend folder.

3. Open index.html directly in your browser or launch it using the VS Code Live Server extension.

Challenges & Solutions: Dark Mode Implementation & Theme Persistence
Challenge:
Implementing a dark mode toggle resulted in visual "flashes" of the light theme during initial page reloads. Additionally, maintaining consistent color contrast across custom UI elements and dynamically loaded components while preserving the user's theme preference across browser sessions proved challenging.

Solution:
Utilized CSS custom properties (variables) managed at the root level alongside a JavaScript event listener to handle theme switching seamlessly. To eliminate theme flickering on reload, the user's selected preference was saved in localStorage and applied immediately before the DOM rendered. All UI components were tested against accessibility contrast guidelines to ensure readability in both modes.

#### Important Links 
1. Demo Video : https://drive.google.com/file/d/1HjuSpUi_OtsWy3fk0cTzt1SXeY2wqCLD/view?usp=sharing
2. GitHub Repository : https://github.com/shahd-abdalslam/expense-tracker.git