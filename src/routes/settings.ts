import { Router, Request, Response } from 'express';
import Country from '../models/Country';
import State from '../models/State';

const router = Router();

router.get('/countries', async (_req: Request, res: Response) => {
  try {
    const countries = await Country.find({}, { name: 1, code: 1 })  // _id is included by default
      .sort({ name: 1 });

    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});
router.get('/states-by-country', async (req: Request, res: Response): Promise<void> => {
  // Extract countryId from query string
  const countryId = req.query.countryId as string;  // `countryId` should be a string

  // If countryId is missing, return error
  if (!countryId) {
    res.status(400).json({ error: 'countryId query parameter is required' });
    return;
  }

  try {
    // Query the database for states belonging to the specified country
    const states = await State.find({ country: countryId }, { name: 1, code: 1, _id: 1 }).sort({ name: 1 });
    
    // Send the states data as a response
    res.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

export default router;
