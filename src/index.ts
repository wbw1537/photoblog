import express, { Application, Request, Response } from 'express';

import photoScanRouter from './routes/photo-scan.router.js';
import userRouter from './routes/user.router.js';
import scanStatusRouter from './routes/scan-status.router.js';
import blogRouter from './routes/blog.router.js';
import tagRouter from './routes/tag.router.js';

const app: Application = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to my TypeScript Express.js app!');
});

app.use('/', photoScanRouter);
app.use('/', userRouter);
app.use('/', scanStatusRouter);
app.use('/', blogRouter);
app.use('/', tagRouter);

// Handle unknown routes (404 handler)
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error-handling middleware (optional for catching errors globally)
app.use((error: Error, req: Request, res: Response) => {
  console.error(error); // Log the error
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
