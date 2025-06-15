import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Send,
  Star
} from 'lucide-react';
import { jobsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  skills: Array<{ name: string; required: boolean }>;
  benefits: string[];
  createdAt: string;
  employer: {
    name: string;
    company: string;
    email: string;
  };
  atsScore?: number;
  matchDetails?: {
    skillsMatch: {
      score: number;
      matchedSkills: string[];
      missingSkills: string[];
      details: string;
    };
    experienceMatch: {
      score: number;
      details: string;
    };
    educationMatch: {
      score: number;
      details: string;
    };
    recommendedActions: string[];
    matchSummary: string;
  };
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJob();
      checkApplicationStatus();
    }
  }, [id, user]);

  const fetchJob = async () => {
    try {
      const response = await jobsAPI.getJob(id!);
      setJob(response.data.job);
      
      // If user is a jobseeker and we have match details, set the ATS score
      if (response.data.atsScore) {
        setJob(prev => ({
          ...prev!,
          atsScore: response.data.atsScore,
          matchDetails: response.data.matchDetails
        }));
      }
    } catch (error: any) {
      toast.error('Failed to fetch job details');
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user || user.role !== 'jobseeker') return;
    
    try {
      const response = await applicationsAPI.getMyApplications();
      const applications = response.data.applications;
      const hasAppliedToJob = applications.some((app: any) => app.job._id === id);
      setHasApplied(hasAppliedToJob);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleApply = async () => {
    if (!user || user.role !== 'jobseeker') {
      toast.error('Please login as a job seeker to apply');
      return;
    }

    setApplying(true);
    try {
      await applicationsAPI.applyToJob({
        jobId: id,
        coverLetter: coverLetter.trim() || undefined
      });
      
      toast.success('Application submitted successfully!');
      setHasApplied(true);
      setShowApplicationModal(false);
      setCoverLetter('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (min: number, max: number, currency: string = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    } else if (min) {
      return `${formatter.format(min)}+`;
    }
    return 'Competitive';
  };

  const getATSScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h2>
          <button
            onClick={() => navigate('/jobs')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors duration-200"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Jobs</span>
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
          >
            {/* Job Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex items-center space-x-4 text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Building className="h-5 w-5" />
                      <span className="font-medium">{job.company}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-5 w-5" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-5 w-5" />
                      <span>{job.type}</span>
                    </div>
                  </div>
                </div>
                
                {job.atsScore !== undefined && user?.role === 'jobseeker' && (
                  <div className={`px-4 py-2 rounded-xl border-2 ${getATSScoreColor(job.atsScore)}`}>
                    <div className="flex items-center space-x-2">
                      {getScoreIcon(job.atsScore)}
                      <div>
                        <div className="font-bold text-lg">{job.atsScore}%</div>
                        <div className="text-sm">ATS Match</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {job.salary && (
                <div className="flex items-center space-x-2 text-green-600 mb-4">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xl font-bold">
                    {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Job Description */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>
            </div>

            {/* Requirements */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {job.requirements}
                </p>
              </div>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-3">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        skill.required
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {skill.name}
                      {skill.required && <span className="ml-1 text-blue-500">*</span>}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">* Required skills</p>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Benefits</h2>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Apply Button */}
            {user?.role === 'jobseeker' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                {hasApplied ? (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Submitted</h3>
                    <p className="text-gray-600 text-sm">
                      Your application has been submitted successfully. The employer will review it soon.
                    </p>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => setShowApplicationModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      <Send className="h-5 w-5" />
                      <span>Apply Now</span>
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      One-click application with your profile
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ATS Match Details */}
            {job.matchDetails && user?.role === 'jobseeker' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>ATS Match Analysis</span>
                </h3>
                
                <div className="space-y-4">
                  {/* Skills Match */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Skills Match</span>
                      <span className="text-sm font-bold text-blue-600">
                        {job.matchDetails.skillsMatch?.score || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.matchDetails.skillsMatch?.score || 0}%` }}
                      ></div>
                    </div>
                    {job.matchDetails.skillsMatch?.matchedSkills?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-green-600 font-medium">
                          Matched: {job.matchDetails.skillsMatch.matchedSkills.join(', ')}
                        </p>
                      </div>
                    )}
                    {job.matchDetails.skillsMatch?.missingSkills?.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-red-600 font-medium">
                          Missing: {job.matchDetails.skillsMatch.missingSkills.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Experience Match */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Experience Match</span>
                      <span className="text-sm font-bold text-blue-600">
                        {job.matchDetails.experienceMatch?.score || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.matchDetails.experienceMatch?.score || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Education Match */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Education Match</span>
                      <span className="text-sm font-bold text-blue-600">
                        {job.matchDetails.educationMatch?.score || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.matchDetails.educationMatch?.score || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {job.matchDetails.recommendedActions?.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">Recommendations:</h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        {job.matchDetails.recommendedActions.map((action, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span>•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">About the Company</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Company</p>
                  <p className="text-gray-900">{job.company}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-gray-900">{job.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Job Type</p>
                  <p className="text-gray-900">{job.type}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Apply to {job.title}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter (Optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write a brief cover letter to introduce yourself..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowApplicationModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Applying...
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}