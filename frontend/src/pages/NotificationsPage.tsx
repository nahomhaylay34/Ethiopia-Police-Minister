import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead, createAnnouncement } from '../services/api';
import type { Notification } from '../types';
import { useAuth } from '../hooks/useAuth';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Admin announcement states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await getNotifications();
        setNotifications(data.data.notifications);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prevNotifications) => prevNotifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage('');
    try {
      await createAnnouncement({ title, content, target_role: targetRole });
      setMessage('Announcement sent successfully!');
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Failed to send announcement', error);
      setMessage('Failed to send announcement.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Notifications</h1>

      {user?.role === 'admin' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Post System Announcement</h2>
          {message && <p className={`mb-4 text-sm font-bold ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label font-bold text-gray-700">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="input input-bordered w-full" placeholder="e.g., System Maintenance" />
              </div>
              <div className="form-control">
                <label className="label font-bold text-gray-700">Target Audience</label>
                <select value={targetRole} onChange={e => setTargetRole(e.target.value)} className="select select-bordered w-full">
                  <option value="all">All Users (Citizens, Officers, Detectives)</option>
                  <option value="citizen">Citizens Only</option>
                  <option value="officer">Officers Only</option>
                  <option value="detective">Detectives Only</option>
                </select>
              </div>
            </div>
            <div className="form-control">
              <label className="label font-bold text-gray-700">Message Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} required className="textarea textarea-bordered w-full h-24" placeholder="Enter announcement details..."></textarea>
            </div>
            <button type="submit" disabled={sending} className="btn btn-primary">
              {sending ? 'Sending...' : 'Broadcast Announcement'}
            </button>
          </form>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4">Your Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-500">You have no notifications.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div key={notification.id} className={`p-4 rounded-lg shadow-md ${notification.is_read ? 'bg-white' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex justify-between items-start">
                  <p className="font-bold text-gray-900">{notification.title}</p>
                  {!notification.is_read && (
                    <button onClick={() => handleMarkAsRead(notification.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Mark as read</button>
                  )}
                </div>
                <p className="mt-1 text-gray-700">{notification.content}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(notification.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
