import express, { Request, Response } from 'express';
import { Settings } from '../models/Settings.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json({ ...settings.toObject(), id: settings._id.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
      await settings.save();
    } else {
      settings.set(req.body);
      await settings.save();
    }
    res.json({ ...settings.toObject(), id: settings._id.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
