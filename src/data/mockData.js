export const INITIAL_USERS = [
  {
    id: 1, name: "Alice Chen", email: "alice@example.com", password: "pass123",
    role: "freelancer", verified: true, avatar: "AC",
    title: "Senior React Developer", bio: "10+ years building scalable UIs. Expert in React, TypeScript, and Node.js.",
    hourly_rate: 85, availability: "available", rating: 4.9, total_earnings: 24500,
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS"],
    portfolio: [
      { id: 1, title: "E-Commerce Platform", category: "Web Dev", description: "Full-stack platform built with React & Node.js handling 50k daily users.", tools: ["React", "Node.js", "PostgreSQL"], image: "🛒" },
      { id: 2, title: "SaaS Dashboard", category: "UI/UX", description: "Analytics dashboard with real-time data visualization.", tools: ["React", "D3.js", "WebSockets"], image: "📊" },
    ],
    completeness: 92, badges: ["React", "TypeScript"], reviews_count: 18,
  },
  {
    id: 2, name: "Marcus Johnson", email: "marcus@example.com", password: "pass123",
    role: "freelancer", verified: true, avatar: "MJ",
    title: "UI/UX Designer & Brand Strategist", bio: "Creating beautiful, user-centered designs that drive results.",
    hourly_rate: 75, availability: "available", rating: 4.8, total_earnings: 18200,
    skills: ["Figma", "Branding", "UI Design", "Motion Design", "Illustration"],
    portfolio: [
      { id: 3, title: "Fintech App Redesign", category: "UI/UX", description: "Redesigned mobile banking app, increasing engagement by 40%.", tools: ["Figma", "Principle"], image: "💳" },
    ],
    completeness: 88, badges: ["Figma", "Branding"], reviews_count: 24,
  },
  {
    id: 3, name: "Sarah Kim", email: "sarah@example.com", password: "pass123",
    role: "freelancer", verified: false, avatar: "SK",
    title: "Python & ML Engineer", bio: "Building intelligent systems with Python, TensorFlow, and PyTorch.",
    hourly_rate: 95, availability: "busy", rating: 4.7, total_earnings: 31000,
    skills: ["Python", "Machine Learning", "TensorFlow", "FastAPI", "Docker"],
    portfolio: [
      { id: 4, title: "AI Content Classifier", category: "ML", description: "NLP classifier achieving 94% accuracy on 1M+ documents.", tools: ["Python", "TensorFlow", "FastAPI"], image: "🤖" },
    ],
    completeness: 76, badges: ["Python"], reviews_count: 12,
  },
  {
    id: 4, name: "Priya Sharma", email: "priya@example.com", password: "pass123",
    role: "client", verified: true, avatar: "PS",
    title: "Product Manager @ TechCorp", bio: "Building the next generation of products.",
    hourly_rate: 0, availability: "available", rating: 4.6, total_earnings: 0,
    skills: [], portfolio: [], completeness: 70, badges: [], reviews_count: 8,
    company: "TechCorp", projects_posted: 5,
  },
];

export const INITIAL_PROJECTS = [
  {
    id: 1, client_id: 4, title: "Build a Modern E-Commerce Website",
    description: "We need a full-stack e-commerce solution with product catalog, cart, payment integration, and admin dashboard. Must be mobile-responsive.",
    skills: ["React", "Node.js", "PostgreSQL", "Stripe"],
    budget_min: 3000, budget_max: 6000, deadline: "2025-08-01",
    type: "fixed", status: "open", posted_date: "2025-05-10",
    proposals_count: 3, client_name: "Priya Sharma",
  },
  {
    id: 2, client_id: 4, title: "Logo & Brand Identity Design",
    description: "Looking for a talented designer to create a complete brand identity for our fintech startup. Deliverables: logo, color palette, typography guide, business card.",
    skills: ["Branding", "Logo Design", "Figma", "Illustration"],
    budget_min: 500, budget_max: 1500, deadline: "2025-07-15",
    type: "fixed", status: "open", posted_date: "2025-05-12",
    proposals_count: 5, client_name: "Priya Sharma",
  },
  {
    id: 3, client_id: 4, title: "ML Model for Customer Churn Prediction",
    description: "Build and deploy a machine learning model to predict customer churn. Need data preprocessing pipeline, model training, REST API endpoint, and documentation.",
    skills: ["Python", "Machine Learning", "FastAPI", "Docker"],
    budget_min: 2500, budget_max: 4500, deadline: "2025-07-30",
    type: "fixed", status: "open", posted_date: "2025-05-14",
    proposals_count: 2, client_name: "Priya Sharma",
  },
  {
    id: 4, client_id: 4, title: "React Native Mobile App Development",
    description: "Need a cross-platform mobile app for iOS and Android. The app should include user authentication, real-time chat, push notifications, and API integration.",
    skills: ["React Native", "TypeScript", "Firebase"],
    budget_min: 4000, budget_max: 8000, deadline: "2025-09-01",
    type: "fixed", status: "open", posted_date: "2025-05-15",
    proposals_count: 1, client_name: "Priya Sharma",
  },
];

export const INITIAL_PROPOSALS = [
  {
    id: 1, project_id: 1, freelancer_id: 1, amount: 4500, duration_days: 30,
    cover_message: "I have extensive experience building e-commerce platforms. My recent project for a retail client saw a 60% increase in conversion rates. I'll use React, Node.js, and Stripe for a seamless experience.",
    status: "submitted", score: 92, submitted_date: "2025-05-11",
    freelancer_name: "Alice Chen", freelancer_title: "Senior React Developer", freelancer_rating: 4.9, freelancer_avatar: "AC",
  },
  {
    id: 2, project_id: 1, freelancer_id: 3, amount: 5200, duration_days: 35,
    cover_message: "While I primarily do ML work, I have strong full-stack skills. I can handle this project efficiently.",
    status: "submitted", score: 67, submitted_date: "2025-05-12",
    freelancer_name: "Sarah Kim", freelancer_title: "Python & ML Engineer", freelancer_rating: 4.7, freelancer_avatar: "SK",
  },
  {
    id: 3, project_id: 2, freelancer_id: 2, amount: 950, duration_days: 10,
    cover_message: "Brand design is my passion! I've created identities for 30+ startups in the fintech space. My process includes competitor analysis, mood boards, and 3 revision rounds.",
    status: "submitted", score: 97, submitted_date: "2025-05-13",
    freelancer_name: "Marcus Johnson", freelancer_title: "UI/UX Designer", freelancer_rating: 4.8, freelancer_avatar: "MJ",
  },
];

export const INITIAL_CONTRACTS = [
  {
    id: 1, project_id: 2, freelancer_id: 2, client_id: 4,
    project_title: "Logo & Brand Identity Design", freelancer_name: "Marcus Johnson",
    client_name: "Priya Sharma", total_amount: 950, status: "active",
    start_date: "2025-05-14",
    milestones: [
      { id: 1, description: "Initial concepts & mood board", amount: 300, due_date: "2025-05-20", status: "completed", approved: true },
      { id: 2, description: "Final logo & brand kit delivery", amount: 650, due_date: "2025-06-01", status: "pending", approved: false },
    ],
    messages: [
      { id: 1, sender_id: 4, sender: "Priya Sharma", text: "Excited to get started! Looking forward to seeing your initial concepts.", time: "2025-05-14 10:00" },
      { id: 2, sender_id: 2, sender: "Marcus Johnson", text: "Thanks! I'll have the mood board ready by Thursday. Quick question — do you have any existing brand colors in mind?", time: "2025-05-14 11:30" },
      { id: 3, sender_id: 4, sender: "Priya Sharma", text: "We're thinking blues and greens — trustworthy and innovative. But open to your creative direction!", time: "2025-05-14 12:00" },
    ],
  },
];

export const COMMUNITY_POSTS = [
  { id: 1, author_id: 1, author: "Alice Chen", avatar: "AC", content: "Just shipped a major e-commerce platform using React 18 + Suspense. The new concurrent features are game-changing for performance! Happy to share learnings.", likes: 24, comments: 8, time: "2h ago", tags: ["React", "Performance"] },
  { id: 2, author_id: 2, author: "Marcus Johnson", avatar: "MJ", content: "Design tip: Stop using generic stock photos in your portfolios. Custom illustrations differentiate you 10x more. I've seen my proposal acceptance rate double since switching.", likes: 41, comments: 15, time: "5h ago", tags: ["Design", "Portfolio"] },
  { id: 3, author_id: 3, author: "Sarah Kim", avatar: "SK", content: "Hot take: Writing clear API documentation is just as important as writing the API itself. Just spent 3 days helping a client understand an undocumented system. Never again.", likes: 67, comments: 22, time: "1d ago", tags: ["Backend", "Best Practices"] },
];

export const CHALLENGES = [
  { id: 1, title: "Redesign the Checkout Flow", category: "Design", description: "Redesign an e-commerce checkout flow for maximum conversion. Submit a Figma prototype.", prize: "$500 + Featured Badge", deadline: "2025-06-01", entries: 34, status: "active" },
  { id: 2, title: "Build a CLI Tool in Go", category: "Development", description: "Create a useful CLI productivity tool in Go. Must include tests and documentation.", prize: "$300 + Pro Month", deadline: "2025-06-08", entries: 18, status: "active" },
];
