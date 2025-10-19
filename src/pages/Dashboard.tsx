import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { UserStats } from '../types/database';
import { useFlashcards } from '../hooks/useFlashcards';

export function Dashboard() {
  const user = useAuthStore(state => state.user);
  const { getDueCards } = useFlashcards();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadStats();
      loadDueCount();
    }
  }, [user]);

  const loadStats = async () => {
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (data) setStats(data);
  };

  const loadDueCount = async () => {
    const dueCards = await getDueCards();
    setDueCount(dueCards.length);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Track your progress toward DELF B2 success</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Cards Due Today"
          value={dueCount}
          subtitle="Ready to review"
          color="blue"
        />
        <StatCard
          title="Total Cards"
          value={stats?.total_cards || 0}
          subtitle="In your collection"
          color="green"
        />
        <StatCard
          title="Total Reviews"
          value={stats?.total_reviews || 0}
          subtitle="All time"
          color="purple"
        />
        <StatCard
          title="Current Streak"
          value={stats?.current_streak || 0}
          subtitle="Days in a row"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/study"
              className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              Start Study Session
            </Link>
            <Link
              to="/flashcards/new"
              className="block w-full bg-white text-blue-600 py-3 rounded-lg font-medium border-2 border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              Add New Card
            </Link>
            <Link
              to="/grammar"
              className="block w-full bg-white text-gray-700 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-center"
            >
              Grammar Practice
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Overview</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Retention Rate</span>
                <span className="font-medium text-gray-900">
                  {((stats?.retention_rate || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(stats?.retention_rate || 0) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Recent Activity</div>
              <div className="text-sm text-gray-500">
                {stats?.last_study_date
                  ? `Last studied: ${new Date(stats.last_study_date).toLocaleDateString()}`
                  : 'No study sessions yet'}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Longest Streak</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.longest_streak || 0} days
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
        {subtitle}
      </div>
    </div>
  );
}
