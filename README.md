# Pulp Portal Frontend

A React-based frontend application for the Pulp Portal project.

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- React Router DOM
- Axios
- Leaflet (for maps)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository:

```bash
git clone https://dev.azure.com/f20201619/pulp-portal-frontend/_git/pulp-portal-frontend
cd pulp-portal-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:

```
REACT_APP_API_URL=your_backend_api_url
```

4. Start the development server:

```bash
npm start
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This will create a `build` directory with the production-ready files.

## Project Structure

```
pulp-portal/
├── public/          # Static files
├── src/            # Source code
│   ├── components/ # React components
│   ├── pages/      # Page components
│   ├── services/   # API services
│   ├── utils/      # Utility functions
│   └── App.tsx     # Main App component
├── .env            # Environment variables
├── package.json    # Project dependencies
└── tsconfig.json   # TypeScript configuration
```

## Development

- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App

## Deployment

This project is deployed using Azure Static Web Apps. The deployment is automatic when changes are pushed to the main branch.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is proprietary and confidential.
