import express from 'express';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Profile from '../models/Profile.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { calculateATSScore } from '../services/geminiService.js';

const router = express.Router();

// Get all jobs (public route with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      location, 
      type, 
      minSalary, 
      maxSalary, 
      experience,
      skills,
      page = 1, 
      limit = 10 
    } = req.query;

    const query = { status: 'active' };

    // Build search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (type) {
      query.type = type;
    }

    if (minSalary || maxSalary) {
      query['salary.min'] = {};
      if (minSalary) query['salary.min'].$gte = parseInt(minSalary);
      if (maxSalary) query['salary.max'] = { $lte: parseInt(maxSalary) };
    }

    if (experience) {
      const expRange = experience.split('-');
      if (expRange.length === 2) {
        query['experience.min'] = { $gte: parseInt(expRange[0]) };
        query['experience.max'] = { $lte: parseInt(expRange[1]) };
      }
    }

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query['skills.name'] = { $in: skillsArray };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const jobs = await Job.find(query)
      .populate('employer', 'name company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalJobs = await Job.countDocuments(query);

    res.json({
      jobs,
      totalJobs,
      totalPages: Math.ceil(totalJobs / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Get jobs with ATS scores for authenticated jobseeker
router.get('/matches', authenticateToken, requireRole(['jobseeker']), async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found. Please complete your profile first.' });
    }

    const jobs = await Job.find({ status: 'active' })
      .populate('employer', 'name company')
      .sort({ createdAt: -1 });

    // Calculate ATS scores for each job
    const jobsWithScores = await Promise.all(
      jobs.map(async (job) => {
        try {
          const atsData = await calculateATSScore(
            {
              title: job.title,
              description: job.description,
              requirements: job.requirements,
              skills: job.skills,
              experience: job.experience
            },
            {
              experience: profile.experience,
              skills: profile.skills,
              education: profile.education,
              summary: profile.summary
            }
          );

          return {
            ...job.toObject(),
            atsScore: atsData.overallScore,
            matchDetails: atsData
          };
        } catch (error) {
          console.error(`Error calculating ATS score for job ${job._id}:`, error);
          return {
            ...job.toObject(),
            atsScore: 0,
            matchDetails: null
          };
        }
      })
    );

    // Sort by ATS score descending
    jobsWithScores.sort((a, b) => b.atsScore - a.atsScore);

    res.json({ jobs: jobsWithScores });
  } catch (error) {
    console.error('Error fetching job matches:', error);
    res.status(500).json({ message: 'Error fetching job matches' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name company email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // If user is authenticated and is a jobseeker, calculate ATS score
    let atsData = null;
    if (req.user && req.user.role === 'jobseeker') {
      const profile = await Profile.findOne({ user: req.user._id });
      if (profile) {
        try {
          atsData = await calculateATSScore(
            {
              title: job.title,
              description: job.description,
              requirements: job.requirements,
              skills: job.skills,
              experience: job.experience
            },
            {
              experience: profile.experience,
              skills: profile.skills,
              education: profile.education,
              summary: profile.summary
            }
          );
        } catch (error) {
          console.error('Error calculating ATS score:', error);
        }
      }
    }

    res.json({
      job,
      atsScore: atsData?.overallScore || null,
      matchDetails: atsData
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Error fetching job' });
  }
});

// Create job (employer only)
router.post('/', authenticateToken, requireRole(['employer']), async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      employer: req.user._id,
      company: req.user.company
    };

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('employer', 'name company');

    res.status(201).json({
      message: 'Job created successfully',
      job: populatedJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Error creating job' });
  }
});

// Update job (employer only)
router.put('/:id', authenticateToken, requireRole(['employer']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns this job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employer', 'name company');

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Error updating job' });
  }
});

// Delete job (employer only)
router.delete('/:id', authenticateToken, requireRole(['employer']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns this job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Error deleting job' });
  }
});

// Get employer's jobs
router.get('/employer/my-jobs', authenticateToken, requireRole(['employer']), async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

export default router;