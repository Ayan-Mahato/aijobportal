import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables. Resume parsing will be disabled.');
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export const parseResumeWithGemini = async (resumeText) => {
  try {
    // Check if Gemini is available
    if (!genAI) {
      console.warn('Gemini API not available, using fallback parsing');
      return fallbackResumeParser(resumeText);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Please parse the following resume text and extract structured information in JSON format.
      Return ONLY a valid JSON object with the following structure:
      
      {
        "personalInfo": {
          "name": "Full Name",
          "email": "email@example.com",
          "phone": "phone number",
          "location": "city, state/country",
          "linkedin": "linkedin profile url",
          "github": "github profile url",
          "website": "personal website url"
        },
        "summary": "Professional summary or objective",
        "experience": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "location": "City, State",
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD or null if current",
            "current": boolean,
            "description": "Job description and achievements"
          }
        ],
        "education": [
          {
            "degree": "Degree Type",
            "school": "Institution Name",
            "location": "City, State",
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD",
            "gpa": "GPA if mentioned",
            "description": "Additional details"
          }
        ],
        "skills": [
          {
            "name": "Skill Name",
            "category": "Technical/Soft/Language/etc",
            "level": "Beginner/Intermediate/Advanced/Expert"
          }
        ],
        "projects": [
          {
            "name": "Project Name",
            "description": "Project description",
            "technologies": ["tech1", "tech2"],
            "url": "project url if available",
            "github": "github url if available"
          }
        ],
        "certifications": [
          {
            "name": "Certification Name",
            "issuer": "Issuing Organization",
            "issueDate": "YYYY-MM-DD",
            "credentialId": "ID if available"
          }
        ],
        "languages": [
          {
            "name": "Language Name",
            "proficiency": "Basic/Conversational/Fluent/Native"
          }
        ]
      }

      Resume Text:
      ${resumeText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response text
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Extract JSON from the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No valid JSON found in Gemini response, using fallback parser');
      return fallbackResumeParser(resumeText);
    }

    try {
      const parsedData = JSON.parse(jsonMatch[0]);
      return parsedData;
    } catch (parseError) {
      console.warn('Failed to parse JSON from Gemini response, using fallback parser');
      return fallbackResumeParser(resumeText);
    }
  } catch (error) {
    console.error('Error parsing resume with Gemini:', error);
    console.warn('Falling back to basic parsing');
    return fallbackResumeParser(resumeText);
  }
};

// Fallback parser for when Gemini is not available or fails
const fallbackResumeParser = (resumeText) => {
  const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Basic extraction logic
  const extractedData = {
    personalInfo: {},
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: []
  };

  // Extract email
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    extractedData.personalInfo.email = emailMatch[0];
  }

  // Extract phone
  const phoneMatch = resumeText.match(/[\+]?[1-9]?[\d\s\-\(\)]{10,}/);
  if (phoneMatch) {
    extractedData.personalInfo.phone = phoneMatch[0].trim();
  }

  // Extract name (usually the first line or near email)
  const nameMatch = resumeText.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);
  if (nameMatch) {
    extractedData.personalInfo.name = nameMatch[1];
  }

  // Extract skills (look for common skill keywords)
  const skillKeywords = ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'HTML', 'CSS', 'PHP', 'MySQL', 'React', 'Node.js', 'Angular', 'Vue.js', 'AWS', 'Docker', 'Git'];
  const foundSkills = [];
  
  skillKeywords.forEach(skill => {
    if (resumeText.toLowerCase().includes(skill.toLowerCase())) {
      foundSkills.push({
        name: skill,
        category: 'Technical',
        level: 'Intermediate'
      });
    }
  });
  
  extractedData.skills = foundSkills;

  // Extract education (look for degree keywords)
  const educationKeywords = ['Bachelor', 'Master', 'PhD', 'Diploma', 'Certificate'];
  const educationEntries = [];
  
  lines.forEach(line => {
    educationKeywords.forEach(keyword => {
      if (line.includes(keyword)) {
        educationEntries.push({
          degree: line,
          school: '',
          location: '',
          startDate: '',
          endDate: '',
          gpa: '',
          description: ''
        });
      }
    });
  });
  
  extractedData.education = educationEntries;

  return extractedData;
};

export const calculateATSScore = async (jobDescription, candidateProfile) => {
  try {
    // Check if Gemini is available
    if (!genAI) {
      console.warn('Gemini API not available, using fallback ATS scoring');
      return fallbackATSScoring(jobDescription, candidateProfile);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Calculate an ATS (Applicant Tracking System) score for a job candidate based on job requirements and candidate profile.
      
      Job Description:
      ${JSON.stringify(jobDescription)}
      
      Candidate Profile:
      ${JSON.stringify(candidateProfile)}
      
      Please analyze and return a JSON object with the following structure:
      {
        "overallScore": number between 0-100,
        "skillsMatch": {
          "score": number between 0-100,
          "matchedSkills": ["skill1", "skill2"],
          "missingSkills": ["skill3", "skill4"],
          "details": "explanation of skills matching"
        },
        "experienceMatch": {
          "score": number between 0-100,
          "requiredYears": number,
          "candidateYears": number,
          "details": "explanation of experience matching"
        },
        "educationMatch": {
          "score": number between 0-100,
          "details": "explanation of education matching"
        },
        "recommendedActions": ["action1", "action2"],
        "matchSummary": "Overall summary of the match"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response text
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Extract JSON from the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No valid JSON found in ATS response, using fallback scoring');
      return fallbackATSScoring(jobDescription, candidateProfile);
    }

    try {
      const atsData = JSON.parse(jsonMatch[0]);
      return atsData;
    } catch (parseError) {
      console.warn('Failed to parse JSON from ATS response, using fallback scoring');
      return fallbackATSScoring(jobDescription, candidateProfile);
    }
  } catch (error) {
    console.error('Error calculating ATS score:', error);
    console.warn('Falling back to basic ATS scoring');
    return fallbackATSScoring(jobDescription, candidateProfile);
  }
};

// Fallback ATS scoring when Gemini is not available
const fallbackATSScoring = (jobDescription, candidateProfile) => {
  // Basic scoring logic
  let overallScore = 0;
  const scores = {
    skills: 0,
    experience: 0,
    education: 0
  };

  // Skills matching
  if (jobDescription.skills && candidateProfile.skills) {
    const jobSkills = jobDescription.skills.map(s => s.name?.toLowerCase() || s.toLowerCase());
    const candidateSkills = candidateProfile.skills.map(s => s.name?.toLowerCase() || s.toLowerCase());
    
    const matchedSkills = jobSkills.filter(skill => 
      candidateSkills.some(cSkill => cSkill.includes(skill) || skill.includes(cSkill))
    );
    
    scores.skills = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0;
  }

  // Experience matching
  if (jobDescription.experience && candidateProfile.experience) {
    const requiredYears = jobDescription.experience.min || 0;
    const candidateYears = candidateProfile.experience.length || 0;
    
    if (candidateYears >= requiredYears) {
      scores.experience = 100;
    } else if (candidateYears > 0) {
      scores.experience = Math.round((candidateYears / requiredYears) * 100);
    }
  }

  // Education matching
  if (candidateProfile.education && candidateProfile.education.length > 0) {
    scores.education = 80; // Basic score for having education
  }

  // Calculate overall score
  overallScore = Math.round((scores.skills * 0.5) + (scores.experience * 0.3) + (scores.education * 0.2));

  return {
    overallScore,
    skillsMatch: {
      score: scores.skills,
      matchedSkills: [],
      missingSkills: [],
      details: "Basic skills matching performed"
    },
    experienceMatch: {
      score: scores.experience,
      requiredYears: jobDescription.experience?.min || 0,
      candidateYears: candidateProfile.experience?.length || 0,
      details: "Basic experience matching performed"
    },
    educationMatch: {
      score: scores.education,
      details: "Basic education matching performed"
    },
    recommendedActions: ["Complete your profile", "Add more relevant skills"],
    matchSummary: `Overall match score: ${overallScore}%. This is a basic calculation.`
  };
};