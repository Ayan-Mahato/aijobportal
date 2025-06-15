import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star,
  Building,
  MapPin,
  Calendar,
  Target,
  Eye
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
    status: string;
  };
  status: string;
  atsScore: number;
  createdAt: string;
  matchDetails?: {
    skillsMatch: Array<{ skill: string; matched: boolean; score: number }>;
    experienceMatch: { score: number; details: string };
    educationMatch: { score: number; details: string };
    overallMatch: string;
  };
}

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getMyApplications();
      setApplications(response.data.applications);
    } catch (error: any) {
      toast.error('Failed to fetch applications');
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
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
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

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
          My Applications
        </h1>
        <p className="text-gray-600 text-lg">
          Track the status of your job applications and ATS scores
        </p>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
      >
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Applications', count: statusCounts.all },
            { key: 'pending', label: 'Pending', count: statusCounts.pending },
            { key: 'reviewed', label: 'Reviewed', count: statusCounts.reviewed },
            { key: 'shortlisted', label: 'Shortlisted', count: statusCounts.shortlisted },
            { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
            { key: 'hired', label: 'Hired', count: statusCounts.hired }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === key
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </motion.div>

      {/* Applications List */}
      <div className="space-y-6">
        {filteredApplications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? 'Start applying to jobs to see them here'
                : `You don't have any ${filter} applications at the moment`
              }
            </p>
            {filter === 'all' && (
              <Link
                to="/jobs"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                <span>Browse Jobs</span>
              </Link>
            )}
          </motion.div>
        ) : (
          filteredApplications.map((application, index) => (
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
                          <Link 
                            to={`/jobs/${application.job._id}`}
                            className="hover:text-blue-600 transition-colors duration-200"
                          >
                            {application.job.title}
                          </Link>
                        </h3>
                        <div className="flex items-center space-x-4 text-gray-600 mb-2">
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
                            <span>{application.job.company}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{application.job.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{application.job.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {application.atsScore && (
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getATSScoreColor(application.atsScore)}`}>
                              {application.atsScore}%
                            </div>
                            <div className="text-xs text-gray-500 flex items-center space-x-1">
                              <Target className="h-3 w-3" />
                              <span>ATS Match</span>
                            </div>
                          </div>
                        )}
                        
                        <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* ATS Match Details */}
                    {application.matchDetails && application.atsScore && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-1">
                          <Target className="h-4 w-4" />
                          <span>Match Analysis</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-600">Skills</span>
                              <span className="text-xs font-bold text-blue-600">
                                {application.matchDetails.skillsMatch?.reduce((acc, skill) => acc + skill.score, 0) / application.matchDetails.skillsMatch?.length || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${application.matchDetails.skillsMatch?.reduce((acc, skill) => acc + skill.score, 0) / application.matchDetails.skillsMatch?.length || 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-600">Experience</span>
                              <span className="text-xs font-bold text-blue-600">
                                {application.matchDetails.experienceMatch?.score || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${application.matchDetails.experienceMatch?.score || 0}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-600">Education</span>
                              <span className="text-xs font-bold text-blue-600">
                                {application.matchDetails.educationMatch?.score || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${application.matchDetails.educationMatch?.score || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {application.matchDetails.overallMatch && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                            <strong>Summary:</strong> {application.matchDetails.overallMatch}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      application.job.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      Job {application.job.status}
                    </span>
                  </div>
                  
                  <Link
                    to={`/jobs/${application.job._id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
                  >
                    View Job Details →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}