// Import the required modules
import express, { Application, Request, Response } from 'express';

// Initialize express app
const app: Application = express();

// Middleware to parse JSON
app.use(express.json());

// Define routes
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to my TypeScript Express.js app!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});