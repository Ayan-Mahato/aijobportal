import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Plus, 
  Trash2,
  Save,
  Eye
} from 'lucide-react';
import { jobsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  type: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  experience: {
    min: number;
    max: number;
  };
  skills: Array<{
    name: string;
    required: boolean;
    weight: number;
  }>;
  benefits: string[];
  applicationDeadline: string;
}

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    type: 'Full-time',
    salary: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    experience: {
      min: 0,
      max: 0
    },
    skills: [],
    benefits: [],
    applicationDeadline: ''
  });

  const [newSkill, setNewSkill] = useState({ name: '', required: false, weight: 1 });
  const [newBenefit, setNewBenefit] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.requirements.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.skills.length === 0) {
      toast.error('Please add at least one skill requirement');
      return;
    }

    setLoading(true);
    try {
      const jobData = {
        ...formData,
        company: user?.company || '',
        // Remove empty salary values
        salary: formData.salary.min > 0 || formData.salary.max > 0 ? formData.salary : undefined,
        // Remove empty experience values
        experience: formData.experience.min > 0 || formData.experience.max > 0 ? formData.experience : undefined,
        // Convert deadline to Date if provided
        applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline) : undefined
      };

      await jobsAPI.createJob(jobData);
      toast.success('Job posted successfully!');
      navigate('/dashboard/employer');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to post job');
      console.error('Error posting job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof JobFormData] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addSkill = () => {
    if (!newSkill.name.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    if (formData.skills.some(skill => skill.name.toLowerCase() === newSkill.name.toLowerCase())) {
      toast.error('This skill is already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { ...newSkill, name: newSkill.name.trim() }]
    }));
    setNewSkill({ name: '', required: false, weight: 1 });
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) {
      toast.error('Please enter a benefit');
      return;
    }

    if (formData.benefits.includes(newBenefit.trim())) {
      toast.error('This benefit is already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, newBenefit.trim()]
    }));
    setNewBenefit('');
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  if (preview) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Job Preview</h1>
            <button
              onClick={() => setPreview(false)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Edit
            </button>
          </div>
        </motion.div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{formData.title}</h2>
            <div className="flex items-center space-x-4 text-gray-600 mb-4">
              <div className="flex items-center space-x-1">
                <Briefcase className="h-4 w-4" />
                <span>{user?.company}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{formData.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formData.type}</span>
              </div>
            </div>
            
            {(formData.salary.min > 0 || formData.salary.max > 0) && (
              <div className="flex items-center space-x-1 text-green-600 mb-4">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">
                  {formData.salary.min > 0 && formData.salary.max > 0
                    ? `$${formData.salary.min.toLocaleString()} - $${formData.salary.max.toLocaleString()}`
                    : formData.salary.min > 0
                    ? `$${formData.salary.min.toLocaleString()}+`
                    : `Up to $${formData.salary.max.toLocaleString()}`
                  }
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{formData.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
              <p className="text-gray-700 whitespace-pre-line">{formData.requirements}</p>
            </div>

            {formData.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        skill.required
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {skill.name}
                      {skill.required && <span className="ml-1">*</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {formData.benefits.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                <ul className="space-y-1">
                  {formData.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Posting Job...
                </div>
              ) : (
                'Post Job'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Post a New Job
        </h1>
        <p className="text-gray-600 text-lg">
          Create a detailed job posting to attract the best candidates
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. San Francisco, CA or Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Salary Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salary.min || ''}
                  onChange={(e) => handleInputChange('salary.min', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Salary
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salary.max || ''}
                  onChange={(e) => handleInputChange('salary.max', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="80000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.salary.currency}
                  onChange={(e) => handleInputChange('salary.currency', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Experience Requirements */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Experience Requirements</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Experience (years)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.experience.min || ''}
                  onChange={(e) => handleInputChange('experience.min', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Experience (years)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.experience.max || ''}
                  onChange={(e) => handleInputChange('experience.max', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements *
            </label>
            <textarea
              required
              rows={6}
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="List the qualifications, skills, and experience required for this position..."
            />
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Skills Requirements</h2>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                      skill.required
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    <span>{skill.name}</span>
                    {skill.required && <span className="text-blue-500">*</span>}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter skill name"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newSkill.required}
                      onChange={(e) => setNewSkill({ ...newSkill, required: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Benefits</h2>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg border border-green-200"
                  >
                    <span>{benefit}</span>
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter benefit (e.g., Health insurance, Remote work)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <button
                  type="button"
                  onClick={addBenefit}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Eye className="h-5 w-5" />
              <span>Preview</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Post Job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}