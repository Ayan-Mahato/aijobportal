import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Users, 
  Eye, 
  TrendingUp,
  Plus,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { jobsAPI, applicationsAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingReviews: number;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  status: string;
  applicationsCount: number;
  createdAt: string;
}

interface Application {
  _id: string;
  job: {
    title: string;
    company: string;
  };
  jobseeker: {
    name: string;
    email: string;
  };
  status: string;
  atsScore: number;
  createdAt: string;
}

export default function EmployerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingReviews: 0
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch employer's jobs
      const jobsResponse = await jobsAPI.getEmployerJobs();
      const jobs = jobsResponse.data.jobs;
      
      // Fetch applications for employer's jobs
      const applicationsResponse = await applicationsAPI.getEmployerApplications();
      const applications = applicationsResponse.data.applications;

      // Calculate stats
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter((job: Job) => job.status === 'active').length;
      const totalApplications = applications.length;
      const pendingReviews = applications.filter((app: Application) => app.status === 'pending').length;

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
        pendingReviews
      });

      setRecentJobs(jobs.slice(0, 5));
      setRecentApplications(applications.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'reviewed': return 'text-blue-600 bg-blue-100';
      case 'shortlisted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'hired': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getATSScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const jobApplicationsData = recentJobs.map(job => ({
    name: job.title.substring(0, 15) + '...',
    applications: job.applicationsCount
  }));

  const applicationStatusData = [
    { name: 'Pending', value: stats.pendingReviews, color: '#F59E0B' },
    { name: 'Reviewed', value: recentApplications.filter(app => app.status === 'reviewed').length, color: '#3B82F6' },
    { name: 'Shortlisted', value: recentApplications.filter(app => app.status === 'shortlisted').length, color: '#10B981' },
    { name: 'Rejected', value: recentApplications.filter(app => app.status === 'rejected').length, color: '#EF4444' }
  ];

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Employer Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your job postings and track applications
            </p>
          </div>
          <Link
            to="/post-job"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Post New Job</span>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: 'Total Jobs Posted',
            value: stats.totalJobs,
            icon: Briefcase,
            color: 'from-blue-600 to-blue-700',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-700'
          },
          {
            title: 'Active Jobs',
            value: stats.activeJobs,
            icon: Eye,
            color: 'from-green-600 to-green-700',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700'
          },
          {
            title: 'Total Applications',
            value: stats.totalApplications,
            icon: Users,
            color: 'from-purple-600 to-purple-700',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-700'
          },
          {
            title: 'Pending Reviews',
            value: stats.pendingReviews,
            icon: Clock,
            color: 'from-yellow-600 to-yellow-700',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-700'
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pending Reviews Alert */}
      {stats.pendingReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                {stats.pendingReviews} Applications Awaiting Review
              </h3>
              <p className="text-yellow-700 mb-4">
                You have new applications that need your attention. Review them to find the best candidates.
              </p>
              <Link
                to="/employer/applications"
                className="inline-flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200"
              >
                <span>Review Applications</span>
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Job Applications Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Applications per Job</h3>
          {jobApplicationsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobApplicationsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No jobs posted yet</p>
                <Link
                  to="/post-job"
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                >
                  Post your first job
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Application Status Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Application Status Distribution</h3>
          {stats.totalApplications > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={applicationStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {applicationStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No applications received yet</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Job Postings</h3>
            <Link
              to="/jobs"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentJobs.length > 0 ? (
              recentJobs.map((job, index) => (
                <div key={job._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.location} • {job.type}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {job.applicationsCount} applications
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No jobs posted yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Applications</h3>
            <Link
              to="/employer/applications"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentApplications.length > 0 ? (
              recentApplications.map((application, index) => (
                <div key={application._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{application.jobseeker.name}</h4>
                    <p className="text-sm text-gray-600">{application.job.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Applied {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                    {application.atsScore && (
                      <div className={`text-sm font-semibold mt-1 ${getATSScoreColor(application.atsScore)}`}>
                        {application.atsScore}% Match
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No applications received yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}