import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Target, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ArrowRight
} from 'lucide-react';
import { jobsAPI, applicationsAPI, profileAPI } from '../../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  interviewsScheduled: number;
  profileCompleteness: number;
  averageATSScore: number;
}

interface RecentJob {
  _id: string;
  title: string;
  company: string;
  atsScore: number;
  location: string;
  type: string;
}

interface Application {
  _id: string;
  job: {
    title: string;
    company: string;
  };
  status: string;
  atsScore: number;
  createdAt: string;
}

export default function JobseekerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    interviewsScheduled: 0,
    profileCompleteness: 0,
    averageATSScore: 0
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch applications
      const applicationsResponse = await applicationsAPI.getMyApplications();
      const applications = applicationsResponse.data.applications;
      
      // Fetch job matches
      const jobsResponse = await jobsAPI.getJobMatches();
      const jobs = jobsResponse.data.jobs;
      
      // Fetch profile
      const profileResponse = await profileAPI.getProfile();
      const profile = profileResponse.data.profile;

      // Calculate stats
      const totalApplications = applications.length;
      const pendingApplications = applications.filter((app: Application) => app.status === 'pending').length;
      const interviewsScheduled = applications.filter((app: Application) => app.status === 'shortlisted').length;
      
      // Calculate profile completeness
      let completeness = 0;
      if (profile.personalInfo?.phone) completeness += 10;
      if (profile.personalInfo?.location) completeness += 10;
      if (profile.summary) completeness += 20;
      if (profile.experience?.length > 0) completeness += 25;
      if (profile.education?.length > 0) completeness += 15;
      if (profile.skills?.length > 0) completeness += 20;

      // Calculate average ATS score
      const atsScores = applications.filter((app: Application) => app.atsScore).map((app: Application) => app.atsScore);
      const averageATSScore = atsScores.length > 0 ? Math.round(atsScores.reduce((a, b) => a + b, 0) / atsScores.length) : 0;

      setStats({
        totalApplications,
        pendingApplications,
        interviewsScheduled,
        profileCompleteness: completeness,
        averageATSScore
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

  const applicationStatusData = [
    { name: 'Pending', value: stats.pendingApplications, color: '#F59E0B' },
    { name: 'Reviewed', value: recentApplications.filter(app => app.status === 'reviewed').length, color: '#3B82F6' },
    { name: 'Shortlisted', value: stats.interviewsScheduled, color: '#10B981' },
    { name: 'Rejected', value: recentApplications.filter(app => app.status === 'rejected').length, color: '#EF4444' }
  ];

  const atsScoreData = recentJobs.map(job => ({
    name: job.title.substring(0, 15) + '...',
    score: job.atsScore
  }));

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
          Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Track your job search progress and discover new opportunities
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: 'Total Applications',
            value: stats.totalApplications,
            icon: FileText,
            color: 'from-blue-600 to-blue-700',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-700'
          },
          {
            title: 'Pending Reviews',
            value: stats.pendingApplications,
            icon: Clock,
            color: 'from-yellow-600 to-yellow-700',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-700'
          },
          {
            title: 'Interviews Scheduled',
            value: stats.interviewsScheduled,
            icon: CheckCircle,
            color: 'from-green-600 to-green-700',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700'
          },
          {
            title: 'Avg ATS Score',
            value: `${stats.averageATSScore}%`,
            icon: Target,
            color: 'from-purple-600 to-purple-700',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-700'
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

      {/* Profile Completeness Alert */}
      {stats.profileCompleteness < 80 && (
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
                Complete Your Profile ({stats.profileCompleteness}%)
              </h3>
              <p className="text-yellow-700 mb-4">
                A complete profile increases your chances of getting noticed by employers and improves your ATS scores.
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200"
              >
                <span>Complete Profile</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Application Status Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Application Status</h3>
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
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No applications yet</p>
                <Link
                  to="/jobs"
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                >
                  Start applying to jobs
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* ATS Scores Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Top Job Matches (ATS Scores)</h3>
          {atsScoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={atsScoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No job matches available</p>
                <Link
                  to="/jobs"
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                >
                  Browse jobs
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Job Matches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Top Job Matches</h3>
            <Link
              to="/jobs?matches=true"
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
                    <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full mt-1">
                      {job.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getATSScoreColor(job.atsScore)}`}>
                      {job.atsScore}%
                    </div>
                    <div className="text-xs text-gray-500">Match</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No job matches found</p>
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
              to="/applications"
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
                    <h4 className="font-semibold text-gray-900">{application.job.title}</h4>
                    <p className="text-sm text-gray-600">{application.job.company}</p>
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
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No applications yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}