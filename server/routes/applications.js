import express from 'express';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Profile from '../models/Profile.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { calculateATSScore } from '../services/geminiService.js';

const router = express.Router();

// Apply to job (jobseeker only)
router.post('/', authenticateToken, requireRole(['jobseeker']), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') {
      return res.status(404).json({ message: 'Job not found or no longer active' });
    }

    // Check if user has a profile
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(400).json({ message: 'Please complete your profile before applying' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      jobseeker: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Calculate ATS score
    let atsScore = 0;
    let matchDetails = null;

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

      atsScore = atsData.overallScore;
      matchDetails = {
        skillsMatch: atsData.skillsMatch || [],
        experienceMatch: atsData.experienceMatch || {},
        educationMatch: atsData.educationMatch || {},
        overallMatch: atsData.matchSummary || ''
      };
    } catch (error) {
      console.error('Error calculating ATS score during application:', error);
    }

    // Create application
    const application = new Application({
      job: jobId,
      jobseeker: req.user._id,
      profile: profile._id,
      atsScore,
      matchDetails,
      coverLetter
    });

    await application.save();

    // Update job applications count
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 }
    });

    // Populate the application for response
    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company')
      .populate('jobseeker', 'name email');

    res.status(201).json({
      message: 'Application submitted successfully',
      application: populatedApplication
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Error submitting application' });
  }
});

// Get jobseeker's applications
router.get('/my-applications', authenticateToken, requireRole(['jobseeker']), async (req, res) => {
  try {
    const applications = await Application.find({ jobseeker: req.user._id })
      .populate('job', 'title company location type salary status')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

// Get applications for employer's jobs
router.get('/employer-applications', authenticateToken, requireRole(['employer']), async (req, res) => {
  try {
    const { jobId, status } = req.query;

    // Build query
    let matchQuery = {};
    
    if (jobId) {
      // Check if employer owns this job
      const job = await Job.findById(jobId);
      if (!job || job.employer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      matchQuery.job = jobId;
    } else {
      // Get all jobs by this employer
      const employerJobs = await Job.find({ employer: req.user._id }).select('_id');
      const jobIds = employerJobs.map(job => job._id);
      matchQuery.job = { $in: jobIds };
    }

    if (status) {
      matchQuery.status = status;
    }

    const applications = await Application.find(matchQuery)
      .populate('job', 'title company location type')
      .populate('jobseeker', 'name email')
      .populate('profile', 'personalInfo skills experience education summary')
      .sort({ atsScore: -1, createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Error fetching employer applications:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

// Update application status (employer only)
router.put('/:id/status', authenticateToken, requireRole(['employer']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const application = await Application.findById(req.params.id)
      .populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if employer owns the job
    if (application.job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.status = status;
    if (notes) application.notes = notes;

    await application.save();

    const updatedApplication = await Application.findById(application._id)
      .populate('job', 'title company')
      .populate('jobseeker', 'name email')
      .populate('profile', 'personalInfo skills experience education');

    res.json({
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Error updating application status' });
  }
});

// Get single application details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('jobseeker', 'name email')
      .populate('profile');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check access permissions
    const isJobseeker = req.user.role === 'jobseeker' && application.jobseeker._id.toString() === req.user._id.toString();
    const isEmployer = req.user.role === 'employer' && application.job.employer.toString() === req.user._id.toString();

    if (!isJobseeker && !isEmployer) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ application });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Error fetching application' });
  }
});

export default router;