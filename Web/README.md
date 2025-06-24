# RecommendationAlgo - Web Interface

A modern React application for nutrition-based meal planning and price comparison.

## Features

- **Smart Menu Generation**: AI-powered meal recommendations based on nutritional goals
- **Daily Menu Planning**: Plan and track your daily meals
- **Product Catalog**: Browse products with nutrition information and pricing
- **User Authentication**: Secure login and user management
- **Price Comparison**: Find the best deals across multiple stores

## Technology Stack

- **Frontend**: React 19 + Vite
- **Routing**: React Router DOM
- **Styling**: Custom CSS with responsive design
- **HTTP Client**: Axios
- **UI Components**: Lucide React icons
- **Notifications**: React Hot Toast

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── services/       # API and external services
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── styles/         # CSS files
└── utils/          # Utility functions
```

## Environment Setup

The app connects to:
- Node.js API server (backend)
- Python AI service (recommendations)
- PostgreSQL database
