import express from 'express';
import cors from 'cors';
// import domainRoutes from './routes/domain'; // Make sure this exports a Router

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// app.use('api/orders/', domainRoutes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.220.33:${PORT}`);
});
