import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jobsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Filter,
  Target,
  Star,
  Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  skills: Array<{ name: string; required: boolean }>;
  createdAt: string;
  atsScore?: number;
  matchDetails?: any;
}

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    minSalary: '',
    maxSalary: ''
  });
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [user, showMatches]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      let response;
      if (user?.role === 'jobseeker' && showMatches) {
        response = await jobsAPI.getJobMatches();
        setJobs(response.data.jobs);
      } else {
        const params = {
          search: searchTerm,
          ...filters
        };
        response = await jobsAPI.getJobs(params);
        setJobs(response.data.jobs);
      }
    } catch (error: any) {
      toast.error('Failed to fetch jobs');
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchJobs();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
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
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
          {showMatches ? 'Your Job Matches' : 'Find Your Dream Job'}
        </h1>
        <p className="text-gray-600 text-lg">
          {showMatches 
            ? 'Jobs ranked by AI compatibility score based on your profile'
            : 'Discover opportunities that match your skills and aspirations'
          }
        </p>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>
          
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          />
          
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          >
            <option value="">Job Type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Remote">Remote</option>
          </select>
          
          <button
            onClick={handleSearch}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Search
          </button>
        </div>

        {/* Toggle for job matches (jobseekers only) */}
        {user?.role === 'jobseeker' && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showMatches"
              checked={showMatches}
              onChange={(e) => setShowMatches(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showMatches" className="text-sm font-medium text-gray-700">
              Show AI-powered job matches with ATS scores
            </label>
          </div>
        )}
      </motion.div>

      {/* Jobs List */}
      <div className="space-y-6">
        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </motion.div>
        ) : (
          jobs.map((job, index) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors duration-200">
                          <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                        </h3>
                        <div className="flex items-center space-x-4 text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{job.type}</span>
                          </div>
                        </div>
                      </div>
                      
                      {job.atsScore !== undefined && (
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getATSScoreColor(job.atsScore)}`}>
                          <div className="flex items-center space-x-1">
                            <Target className="h-4 w-4" />
                            <span>{job.atsScore}% Match</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {job.salary && (
                      <div className="flex items-center space-x-1 text-green-600 mb-3">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">
                          {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
                        </span>
                      </div>
                    )}

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {job.description.substring(0, 150)}...
                    </p>

                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              skill.required
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {skill.name}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                            +{job.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/jobs/${job._id}`}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    View Details
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