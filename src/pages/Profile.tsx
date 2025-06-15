import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { profileAPI, resumeAPI } from '../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Link as LinkIcon, 
  Upload,
  FileText,
  Plus,
  Trash2,
  Save,
  Brain,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Profile {
  _id: string;
  personalInfo: {
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    github: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa: string;
    description: string;
  }>;
  skills: Array<{
    name: string;
    level: string;
    category: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url: string;
    github: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    credentialId: string;
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
  resume?: {
    filename: string;
    originalName: string;
    uploadDate: string;
  };
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.getProfile();
      setProfile(response.data.profile);
    } catch (error: any) {
      toast.error('Failed to fetch profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      await profileAPI.updateProfile(profile);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await resumeAPI.uploadResume(formData);
      
      // Update profile with parsed data
      if (response.data.parsedData) {
        setProfile(prev => ({
          ...prev!,
          ...response.data.parsedData,
          personalInfo: {
            ...prev!.personalInfo,
            ...response.data.parsedData.personalInfo
          }
        }));
      }

      toast.success('Resume uploaded and parsed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload resume');
      console.error('Error uploading resume:', error);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const updateProfile = (section: string, data: any) => {
    setProfile(prev => ({
      ...prev!,
      [section]: data
    }));
  };

  const addItem = (section: string, item: any) => {
    setProfile(prev => ({
      ...prev!,
      [section]: [...(prev![section as keyof Profile] as any[]), item]
    }));
  };

  const removeItem = (section: string, index: number) => {
    setProfile(prev => ({
      ...prev!,
      [section]: (prev![section as keyof Profile] as any[]).filter((_, i) => i !== index)
    }));
  };

  const updateItem = (section: string, index: number, data: any) => {
    setProfile(prev => ({
      ...prev!,
      [section]: (prev![section as keyof Profile] as any[]).map((item, i) => 
        i === index ? { ...item, ...data } : item
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile not found</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'experience', label: 'Experience', icon: FileText },
    { id: 'education', label: 'Education', icon: FileText },
    { id: 'skills', label: 'Skills', icon: CheckCircle },
    { id: 'projects', label: 'Projects', icon: FileText },
    { id: 'resume', label: 'Resume', icon: Upload }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          My Profile
        </h1>
        <p className="text-gray-600 text-lg">
          Build your professional profile to attract the right opportunities
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="lg:w-1/4"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
            <nav className="space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Save className="h-5 w-5" />
                    <span>Save Profile</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:w-3/4"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={profile.personalInfo?.phone || ''}
                        onChange={(e) => updateProfile('personalInfo', {
                          ...profile.personalInfo,
                          phone: e.target.value
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={profile.personalInfo?.location || ''}
                        onChange={(e) => updateProfile('personalInfo', {
                          ...profile.personalInfo,
                          location: e.target.value
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="City, State/Country"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={profile.personalInfo?.website || ''}
                        onChange={(e) => updateProfile('personalInfo', {
                          ...profile.personalInfo,
                          website: e.target.value
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={profile.personalInfo?.linkedin || ''}
                        onChange={(e) => updateProfile('personalInfo', {
                          ...profile.personalInfo,
                          linkedin: e.target.value
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={profile.personalInfo?.github || ''}
                        onChange={(e) => updateProfile('personalInfo', {
                          ...profile.personalInfo,
                          github: e.target.value
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://github.com/yourusername"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Summary
                  </label>
                  <textarea
                    value={profile.summary || ''}
                    onChange={(e) => updateProfile('summary', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write a brief summary about your professional background and career objectives..."
                  />
                </div>
              </div>
            )}

            {/* Resume Upload Tab */}
            {activeTab === 'resume' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume Upload</h2>
                
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-lg font-semibold text-blue-600">
                        Uploading and parsing your resume...
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Our AI is extracting your information
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Upload Your Resume
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Drag and drop your resume here, or click to browse
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Brain className="h-4 w-4" />
                        <span>AI-powered parsing with Google Gemini</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Supports PDF, DOC, and DOCX files (max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {profile.resume && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">Resume Uploaded Successfully</p>
                        <p className="text-sm text-green-600">
                          {profile.resume.originalName} • Uploaded on {new Date(profile.resume.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add other tabs (experience, education, skills, projects) here */}
            {/* // Add these tabs after the skills tab and before the closing div */}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
                  <button
                    onClick={() => addItem('experience', {
                      title: '',
                      company: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      current: false,
                      description: ''
                    })}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Experience</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {profile.experience?.map((exp, index) => (
                    <div key={index} className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => updateItem('experience', index, { title: e.target.value })}
                          placeholder="Job Title"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateItem('experience', index, { company: e.target.value })}
                          placeholder="Company Name"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => updateItem('experience', index, { location: e.target.value })}
                          placeholder="Location"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`current-${index}`}
                            checked={exp.current}
                            onChange={(e) => updateItem('experience', index, { current: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`current-${index}`} className="text-sm font-medium text-gray-700">
                            Current Position
                          </label>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="month"
                            value={exp.startDate}
                            onChange={(e) => updateItem('experience', index, { startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          />
                        </div>
                        {!exp.current && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => updateItem('experience', index, { endDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateItem('experience', index, { description: e.target.value })}
                          rows={4}
                          placeholder="Describe your responsibilities, achievements, and key contributions..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => removeItem('experience', index)}
                          className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Education</h2>
                  <button
                    onClick={() => addItem('education', {
                      degree: '',
                      school: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      gpa: '',
                      description: ''
                    })}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Education</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {profile.education?.map((edu, index) => (
                    <div key={index} className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateItem('education', index, { degree: e.target.value })}
                          placeholder="Degree (e.g., Bachelor of Science in Computer Science)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => updateItem('education', index, { school: e.target.value })}
                          placeholder="School/University Name"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) => updateItem('education', index, { location: e.target.value })}
                          placeholder="Location"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        <input
                          type="text"
                          value={edu.gpa}
                          onChange={(e) => updateItem('education', index, { gpa: e.target.value })}
                          placeholder="GPA (optional)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="month"
                            value={edu.startDate}
                            onChange={(e) => updateItem('education', index, { startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="month"
                            value={edu.endDate}
                            onChange={(e) => updateItem('education', index, { endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                        <textarea
                          value={edu.description}
                          onChange={(e) => updateItem('education', index, { description: e.target.value })}
                          rows={3}
                          placeholder="Relevant coursework, honors, activities, or achievements..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => removeItem('education', index)}
                          className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
                  <button
                    onClick={() => addItem('projects', {
                      name: '',
                      description: '',
                      technologies: [],
                      url: '',
                      github: ''
                    })}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Project</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {profile.projects?.map((project, index) => (
                    <div key={index} className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          value={project.name}
                          onChange={(e) => updateItem('projects', index, { name: e.target.value })}
                          placeholder="Project Name"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        <input
                          type="text"
                          value={project.technologies.join(', ')}
                          onChange={(e) => updateItem('projects', index, { 
                            technologies: e.target.value.split(',').map(tech => tech.trim()).filter(tech => tech) 
                          })}
                          placeholder="Technologies (comma-separated)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                        <textarea
                          value={project.description}
                          onChange={(e) => updateItem('projects', index, { description: e.target.value })}
                          rows={4}
                          placeholder="Describe the project, your role, key features, and impact..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Live Demo URL</label>
                          <input
                            type="url"
                            value={project.url}
                            onChange={(e) => updateItem('projects', index, { url: e.target.value })}
                            placeholder="https://yourproject.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Repository</label>
                          <input
                            type="url"
                            value={project.github}
                            onChange={(e) => updateItem('projects', index, { github: e.target.value })}
                            placeholder="https://github.com/username/repo"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          />
                        </div>
                      </div>

                      {project.technologies.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech, techIndex) => (
                              <span
                                key={techIndex}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => removeItem('projects', index)}
                          className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* For brevity, I'll show the structure for one more tab */}
            
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
                  <button
                    onClick={() => addItem('skills', { name: '', level: 'Intermediate', category: 'Technical' })}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Skill</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {profile.skills?.map((skill, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateItem('skills', index, { name: e.target.value })}
                        placeholder="Skill name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={skill.level}
                        onChange={(e) => updateItem('skills', index, { level: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                      <input
                        type="text"
                        value={skill.category}
                        onChange={(e) => updateItem('skills', index, { category: e.target.value })}
                        placeholder="Category"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeItem('skills', index)}
                        className="flex items-center justify-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}