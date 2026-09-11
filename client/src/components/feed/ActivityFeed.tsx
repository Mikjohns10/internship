import { formatDistanceToNow } from 'date-fns';
import type { ActivityLog } from '../../types';
import './ActivityFeed.css';

interface Props {
  activities: ActivityLog[];
  title?: string;
}

const actionIcons: Record<string, string> = {
  STATUS_CHANGE: '🔄',
  TASK_CREATED: '✨',
  TASK_ASSIGNED: '👤',
  TASK_OVERDUE: '⚠️',
};

export default function ActivityFeed({ activities, title = 'Activity Feed' }: Props) {
  return (
    <div className="activity-feed">
      <h3 className="feed-title">{title}</h3>
      <div className="feed-list">
        {activities.length === 0 ? (
          <p className="feed-empty">No recent activity</p>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className="feed-item animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="feed-icon">
                {actionIcons[activity.action] || '📌'}
              </span>
              <div className="feed-content">
                <p className="feed-detail">{activity.details}</p>
                <div className="feed-meta">
                  <span className="feed-time">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                  {activity.project && (
                    <span className="feed-project">
                      {activity.project.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
