import express from 'express';
import cors from 'cors';
import domainRoutes from './routes/domain'; // Make sure this exports a Router

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/domains_list', domainRoutes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://139.59.70.195:${PORT}`);
});
