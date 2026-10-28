# 🌐 LabShare — Resource Sharing Platform

**Unlock Underused Equipment and Spaces**

LabShare is a resource-sharing platform designed to connect resource owners with students, researchers, startups, and other users who need access to laboratory equipment, facilities, and workspaces. The goal is to improve resource utilization, reduce unnecessary costs, and encourage collaboration.

## 🎯 Problem Statement

Many laboratories, institutions, and organizations have equipment and spaces that remain underused. At the same time, students, researchers, and startups may struggle to access these resources because of limited availability or high costs.

LabShare aims to bridge this gap by making available resources easier to discover and share.

## 💡 Our Solution

LabShare provides a centralized platform where users can discover available resources and connect with their owners. It aims to make resource sharing more accessible, efficient, and collaborative.

## ✨ Key Features

- **Resource Discovery:** Explore available equipment, facilities, and spaces.
- **Resource Sharing:** Help owners make underused resources available to others.
- **User Authentication:** Provide a foundation for user registration and login.
- **Resource Management:** Support the organization and management of shared resources.
- **Collaboration:** Connect people who have resources with those who need them.

*Note: The features above describe the project's intended functionality. Update this section as features become fully implemented.*

## 🛠️ Technology Stack

The project uses a modern web development setup.

- **Frontend:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS
- **Backend / Database Services:** Supabase
- **Package Manager:** npm
- **Version Control:** Git and GitHub

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- [Git](https://git-scm.com/)
- A Supabase account for configuring backend services

### 1. Clone the repository

```bash
git clone https://github.com/kamblepranjali88-code/LabShare.git
```

### 2. Navigate to the project directory

```bash
cd LabShare
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the project root and add your own Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the placeholders with the appropriate values from your Supabase project. Never commit `.env.local` or expose secret/service-role keys in client-side code.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👥 Collaboration

LabShare is developed collaboratively using GitHub.

1. Clone the repository.
2. Create a separate branch for your task.
3. Implement and test your changes.
4. Commit your work and push the branch.
5. Open a pull request for review before merging into `main`.

## 🌱 Vision

Our vision is to make underused resources more accessible by encouraging sharing, sustainability, and collaboration among institutions, researchers, students, and startups.

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome. Please coordinate with the project team and test changes before submitting a pull request.

## 📄 License

The project's license and usage permissions should be confirmed by the project team before public release.

---

**Built for Code Hack India**  
*Making resource sharing smarter, more accessible, and more sustainable.*
