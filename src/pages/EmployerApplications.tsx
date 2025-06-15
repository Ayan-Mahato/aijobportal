import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Star,
  Target,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Filter,
  Download,
  MessageSquare
} from 'lucide-react';
import { applicationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Application {
  _id: string;
  job: {
    _id: string;
    title: string;
    company: string;
    location: string;
    type: string;
  };
  jobseeker: {
    _id: string;
    name: string;
    email: string;
  };
  profile: {
    _id: string;
    personalInfo: {
      phone?: string;
      location?: string;
      linkedin?: string;
      github?: string;
    };
    summary?: string;
    skills: Array<{
      name: string;
      level: string;
      category: string;
    }>;
    experience: Array<{
      title: string;
      company: string;
      startDate: string;
      endDate: string;
      current: boolean;
      description: string;
    }>;
    education: Array<{
      degree: string;
      school: string;
      startDate: string;
      endDate: string;
      gpa?: string;
    }>;
  };
  status: string;
  atsScore: number;
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
    overallMatch: string;
  };
  coverLetter?: string;
  notes?: string;
  createdAt: string;
}

export default function EmployerApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    jobId: '',
    minScore: ''
  });
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      const response = await applicationsAPI.getEmployerApplications(params);
      setApplications(response.data.applications);
    } catch (error: any) {
      toast.error('Failed to fetch applications');
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedApplication || !statusUpdate.status) {
      toast.error('Please select a status');
      return;
    }

    setUpdating(true);
    try {
      await applicationsAPI.updateApplicationStatus(
        selectedApplication._id,
        statusUpdate.status,
        statusUpdate.notes
      );

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app._id === selectedApplication._id
            ? { ...app, status: statusUpdate.status, notes: statusUpdate.notes }
            : app
        )
      );

      toast.success('Application status updated successfully');
      setShowModal(false);
      setStatusUpdate({ status: '', notes: '' });
      setSelectedApplication(null);
    } catch (error: any) {
      toast.error('Failed to update application status');
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const openApplicationModal = (application: Application) => {
    setSelectedApplication(application);
    setStatusUpdate({
      status: application.status,
      notes: application.notes || ''
    });
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'reviewed': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'shortlisted': return 'text-green-600 bg-green-100 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-100 border-red-200';
      case 'hired': return 'text-purple-600 bg-purple-100 border-purple-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'shortlisted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'hired': return <Star className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getATSScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    reviewed: applications.filter(app => app.status === 'reviewed').length,
    shortlisted: applications.filter(app => app.status === 'shortlisted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    hired: applications.filter(app => app.status === 'hired').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Job Applications
        </h1>
        <p className="text-gray-600 text-lg">
          Review and manage applications for your job postings
        </p>
      </motion.div>

      {/* Status Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: '', label: 'All Applications', count: statusCounts.all },
            { key: 'pending', label: 'Pending', count: statusCounts.pending },
            { key: 'reviewed', label: 'Reviewed', count: statusCounts.reviewed },
            { key: 'shortlisted', label: 'Shortlisted', count: statusCounts.shortlisted },
            { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
            { key: 'hired', label: 'Hired', count: statusCounts.hired }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilters({ ...filters, status: key })}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filters.status === key
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Additional Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum ATS Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 70"
            />
          </div>
        </div>
      </motion.div>

      {/* Applications List */}
      <div className="space-y-6">
        {applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No applications found
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.status 
                ? `No ${filters.status} applications at the moment`
                : 'No applications have been received yet'
              }
            </p>
            <Link
              to="/post-job"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              <span>Post a Job</span>
            </Link>
          </motion.div>
        ) : (
          applications.map((application, index) => (
            <motion.div
              key={application._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {application.jobseeker.name}
                        </h3>
                        <p className="text-lg font-semibold text-blue-600 mb-2">
                          Applied for: {application.job.title}
                        </p>
                        <div className="flex items-center space-x-4 text-gray-600 mb-2">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{application.jobseeker.email}</span>
                          </div>
                          {application.profile.personalInfo?.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{application.profile.personalInfo.phone}</span>
                            </div>
                          )}
                          {application.profile.personalInfo?.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{application.profile.personalInfo.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {application.atsScore && (
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getATSScoreColor(application.atsScore)}`}>
                            <div className="flex items-center space-x-1">
                              <Target className="h-4 w-4" />
                              <span>{application.atsScore}% Match</span>
                            </div>
                          </div>
                        )}
                        
                        <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Summary */}
                    {application.profile.summary && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Professional Summary</h4>
                        <p className="text-sm text-gray-700 line-clamp-2">{application.profile.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {application.profile.skills && application.profile.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.profile.skills.slice(0, 8).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"
                            >
                              {skill.name}
                            </span>
                          ))}
                          {application.profile.skills.length > 8 && (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                              +{application.profile.skills.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {application.profile.experience && application.profile.experience.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Recent Experience</h4>
                        <div className="space-y-2">
                          {application.profile.experience.slice(0, 2).map((exp, index) => (
                            <div key={index} className="text-sm">
                              <p className="font-medium text-gray-900">
                                {exp.title} at {exp.company}
                              </p>
                              <p className="text-gray-600">
                                {new Date(exp.startDate).getFullYear()} - {exp.current ? 'Present' : new Date(exp.endDate).getFullYear()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cover Letter */}
                    {application.coverLetter && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Cover Letter</h4>
                        <p className="text-sm text-blue-700 line-clamp-3">{application.coverLetter}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {application.notes && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Notes</h4>
                        <p className="text-sm text-yellow-700">{application.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    {application.profile.personalInfo?.linkedin && (
                      <a
                        href={application.profile.personalInfo.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        LinkedIn Profile
                      </a>
                    )}
                    {application.profile.personalInfo?.github && (
                      <a
                        href={application.profile.personalInfo.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                      >
                        GitHub Profile
                      </a>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => openApplicationModal(application)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Review & Update</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Application Review Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Review Application: {selectedApplication.jobseeker.name}
              </h3>
              
              <div className="space-y-6">
                {/* ATS Match Details */}
                {selectedApplication.matchDetails && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span>ATS Match Analysis</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-600">Skills</span>
                          <span className="text-sm font-bold text-blue-600">
                            {selectedApplication.matchDetails.skillsMatch?.score || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedApplication.matchDetails.skillsMatch?.score || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-600">Experience</span>
                          <span className="text-sm font-bold text-blue-600">
                            {selectedApplication.matchDetails.experienceMatch?.score || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedApplication.matchDetails.experienceMatch?.score || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-600">Education</span>
                          <span className="text-sm font-bold text-blue-600">
                            {selectedApplication.matchDetails.educationMatch?.score || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedApplication.matchDetails.educationMatch?.score || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {selectedApplication.matchDetails.overallMatch && (
                      <div className="p-3 bg-blue-50 rounded text-sm text-blue-700">
                        <strong>AI Summary:</strong> {selectedApplication.matchDetails.overallMatch}
                      </div>
                    )}
                  </div>
                )}

                {/* Status Update */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select
                    value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </select>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={statusUpdate.notes}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any notes about this candidate..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    'Update Status'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}