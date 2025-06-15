import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { fileURLToPath } from 'url';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { parseResumeWithGemini } from '../services/geminiService.js';
import Profile from '../models/Profile.js';

const router = express.Router();

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(projectRoot, 'server/uploads/resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Extract text from uploaded file
const extractTextFromFile = async (filePath, fileExt) => {
  try {
    // Ensure we have an absolute path
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    if (fileExt === '.pdf') {
      const dataBuffer = fs.readFileSync(absolutePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } else if (fileExt === '.docx') {
      const result = await mammoth.extractRawText({ path: absolutePath });
      return result.value;
    } else if (fileExt === '.doc') {
      // For .doc files, we'll use a basic text extraction
      // In production, you might want to use a more robust solution
      const dataBuffer = fs.readFileSync(absolutePath);
      return dataBuffer.toString('utf8');
    }
    throw new Error('Unsupported file format');
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error('Failed to extract text from resume');
  }
};

// Upload and parse resume
router.post('/upload', authenticateToken, requireRole(['jobseeker']), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file uploaded' });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    // Extract text from the uploaded file
    const resumeText = await extractTextFromFile(req.file.path, fileExt);
    
    // Parse with Google Gemini
    const parsedData = await parseResumeWithGemini(resumeText);
    
    // Find or create profile
    let profile = await Profile.findOne({ user: req.user._id });
    
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    // Update profile with parsed data
    profile.personalInfo = { ...profile.personalInfo, ...parsedData.personalInfo };
    profile.summary = parsedData.summary || profile.summary;
    profile.experience = parsedData.experience || profile.experience;
    profile.education = parsedData.education || profile.education;
    profile.skills = parsedData.skills || profile.skills;
    profile.projects = parsedData.projects || profile.projects;
    profile.certifications = parsedData.certifications || profile.certifications;
    profile.languages = parsedData.languages || profile.languages;
    
    // Update resume information
    profile.resume = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      uploadDate: new Date(),
      parsedData: parsedData
    };

    await profile.save();

    res.json({
      message: 'Resume uploaded and parsed successfully',
      parsedData: parsedData,
      profile: profile
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: error.message || 'Error uploading and parsing resume' 
    });
  }
});

// Test endpoint to parse a test resume file
router.post('/test-parse', authenticateToken, async (req, res) => {
  try {
    const testFilePath = path.join(projectRoot, 'test/data/05-versions-space.pdf');
    
    if (!fs.existsSync(testFilePath)) {
      return res.status(404).json({ 
        message: 'Test resume file not found',
        expectedPath: testFilePath
      });
    }

    const fileExt = path.extname(testFilePath).toLowerCase();
    
    // Extract text from the test file
    const resumeText = await extractTextFromFile(testFilePath, fileExt);
    
    // Parse with Google Gemini
    const parsedData = await parseResumeWithGemini(resumeText);
    
    res.json({
      message: 'Test resume parsed successfully',
      filePath: testFilePath,
      parsedData: parsedData
    });
  } catch (error) {
    console.error('Test resume parsing error:', error);
    res.status(500).json({ 
      message: error.message || 'Error parsing test resume',
      filePath: path.join(projectRoot, 'test/data/05-versions-space.pdf')
    });
  }
});

// Get resume parsing status
router.get('/status/:profileId', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.profileId);
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check if user owns this profile or is an employer viewing an application
    if (profile.user.toString() !== req.user._id.toString() && req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      hasResume: !!profile.resume,
      resume: profile.resume,
      parsedData: profile.resume?.parsedData
    });
  } catch (error) {
    console.error('Error fetching resume status:', error);
    res.status(500).json({ message: 'Error fetching resume status' });
  }
});

export default router;