import express, { Application, Request, Response } from 'express';
import { errorHandler } from './middleware/error-handler.middleware.js';
import cors from 'cors';

import { createRouters } from './di/di-container.js';

const app: Application = express();

app.use(express.json());

app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to my TypeScript Express.js app!');
});

// Create all routers using the factory pattern
const routers = createRouters();

app.use('/api', routers.photoScanRouter);
app.use('/api', routers.userRouter);
app.use('/api', routers.scanStatusRouter);
app.use('/api', routers.blogRouter);
app.use('/api', routers.tagRouter);
app.use('/api', routers.photoRouter);
app.use('/api', routers.photoFileRouter);
app.use('/api', routers.sharedUserRouter);

// Handle unknown routes (404 handler)
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error-handling middleware (optional for catching errors globally)
app.use((error: Error, req: Request, res: Response) => {
  errorHandler(error, req, res); 
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
