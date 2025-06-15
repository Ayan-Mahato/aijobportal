import express from 'express';
import Profile from '../models/Profile.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, requireRole(['jobseeker']), async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    
    if (!profile) {
      // Create empty profile if doesn't exist
      profile = new Profile({ user: req.user._id });
      await profile.save();
    }

    res.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/', authenticateToken, requireRole(['jobseeker']), async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    // Update profile fields
    const allowedFields = [
      'personalInfo',
      'summary',
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'languages'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get public profile (for employers to view)
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId })
      .populate('user', 'name email');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Only allow employers to view other profiles, or users to view their own
    if (req.user.role !== 'employer' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

export default router;