import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { nomineeApi, type NomineeDashboardData, type DigitalAsset, type LegacyNote, type AuditLog } from '../api/client';
import { 
  Shield, 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Lock,
  Unlock,
  LogOut,
  User,
  Calendar,
  Activity,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

export default function NomineeDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<NomineeDashboardData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [sessionStartTime] = useState(Date.now());

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('nomineeToken');
      if (!token) {
        navigate('/login-nominee');
        return;
      }

      const response = await nomineeApi.getDashboard(token);
      
      if (response.success && response.data) {
        setDashboardData(response.data);
        setTimeRemaining(response.data.session.token_expires_in);
        setError('');
      } else {
        setError(response.message || 'Failed to load dashboard');
        if (response.message?.includes('token') || response.message?.includes('unauthorized')) {
          setTimeout(() => handleLogout(), 2000);
        }
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Session timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      const remaining = Math.max(0, 3600 - elapsed);
      setTimeRemaining(remaining);

      // Auto-logout when session expires
      if (remaining === 0) {
        handleLogout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime]);

  // Load dashboard on mount
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Log action
  const logAction = async (action: 'VIEWED_ASSET' | 'DOWNLOADED_ASSET' | 'VIEWED_NOTE' | 'DOWNLOADED_NOTE' | 'SESSION_END', assetId?: string, noteId?: string, details?: string) => {
    try {
      const token = localStorage.getItem('nomineeToken');
      if (token) {
        await nomineeApi.logAction(token, {
          action,
          asset_id: assetId,
          note_id: noteId,
          details
        });
      }
    } catch (err) {
      console.error('Failed to log action:', err);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logAction('SESSION_END');
    localStorage.removeItem('nomineeToken');
    localStorage.removeItem('nominee_data');
    navigate('/login-nominee');
  };

  // Handle asset view
  const handleViewAsset = (asset: DigitalAsset) => {
    logAction('VIEWED_ASSET', asset._id, undefined, `Viewed ${asset.asset_name}`);
    alert(`Viewing: ${asset.asset_name}\n\nIn production, this would open a secure viewer.`);
  };

  // Handle asset download
  const handleDownloadAsset = (asset: DigitalAsset) => {
    logAction('DOWNLOADED_ASSET', asset._id, undefined, `Downloaded ${asset.asset_name}`);
    alert(`Downloading: ${asset.asset_name}\n\nIn production, this would download a watermarked copy.`);
  };

  // Handle note view
  const handleViewNote = (note: LegacyNote) => {
    logAction('VIEWED_NOTE', undefined, note._id, `Viewed note: ${note.title}`);
  };

  // Handle note download
  const handleDownloadNote = (note: LegacyNote) => {
    logAction('DOWNLOADED_NOTE', undefined, note._id, `Downloaded note: ${note.title}`);
    alert(`Downloading: ${note.title}\n\nIn production, this would download as watermarked PDF.`);
  };

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Get device icon
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'Mobile': return <Smartphone className="w-4 h-4" />;
      case 'Tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  // Get asset type color
  const getAssetTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'Legal': 'bg-red-100 text-red-800 border-red-300',
      'Financial': 'bg-green-100 text-green-800 border-green-300',
      'Personal': 'bg-blue-100 text-blue-800 border-blue-300',
      'Media': 'bg-purple-100 text-purple-800 border-purple-300',
      'Other': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[type] || colors['Other'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading secure dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <XCircle className="w-8 h-8" />
            <h2 className="text-xl font-semibold">Access Error</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login-nominee')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { owner, nominee, assets, notes, verification, auditLogs, session, access_granted } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Legal Access Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="w-10 h-10 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Digital Inheritance Access Portal</h1>
                <p className="text-gray-300 text-sm mt-1">Secure Read-Only Access</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
            >
              <LogOut className="w-4 h-4" />
              End Session
            </button>
          </div>

          {/* Owner & Nominee Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-blue-300" />
                <h3 className="font-semibold">Account Owner</h3>
              </div>
              <p className="text-lg font-bold">{owner.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  owner.status === 'DECEASED' 
                    ? 'bg-red-500/20 text-red-200' 
                    : 'bg-green-500/20 text-green-200'
                }`}>
                  {owner.status === 'DECEASED' ? 'DECEASED (Verified)' : 'ACTIVE'}
                </span>
              </div>
              {owner.continuity_trigger_date && (
                <p className="text-sm text-gray-300 mt-2">
                  Access Triggered: {new Date(owner.continuity_trigger_date).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-300" />
                <h3 className="font-semibold">Nominee Details</h3>
              </div>
              <p className="text-lg font-bold">{nominee.name}</p>
              <p className="text-sm text-gray-300">Relationship: {nominee.relationship}</p>
              <p className="text-sm text-gray-300">BEN-ID: {nominee.ben_id}</p>
              <p className="text-sm text-gray-300 mt-2">Access Type: <strong>{nominee.access_type}</strong></p>
            </div>
          </div>

          {/* Legal Warning Banner */}
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mt-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-200">Legal Notice & Audit Compliance</p>
              <p className="text-yellow-100 mt-1">
                All actions are logged and legally auditable. Unauthorized distribution of accessed materials is prohibited. 
                Data access is governed by the account owner's continuity instructions and applicable laws.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!access_granted ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Not Granted</h2>
            <p className="text-gray-600">
              Continuity access has not been triggered yet, or your verification is pending.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Inherited Digital Assets */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Inherited Digital Assets</h2>
              </div>

              {assets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No digital assets have been released to you at this time.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map((asset) => (
                    <div key={asset._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{asset.asset_name}</h3>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getAssetTypeColor(asset.asset_type)}`}>
                            {asset.asset_type}
                          </span>
                        </div>
                        {asset.status === 'RELEASED' ? (
                          <Unlock className="w-5 h-5 text-green-500" />
                        ) : (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {asset.description && (
                        <p className="text-sm text-gray-600 mb-3">{asset.description}</p>
                      )}

                      <div className="text-xs text-gray-500 space-y-1 mb-3">
                        <p>Version: {asset.version_count}</p>
                        <p>Last Updated: {new Date(asset.last_modified).toLocaleDateString()}</p>
                        {asset.released_at && (
                          <p>Released: {new Date(asset.released_at).toLocaleDateString()}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewAsset(asset)}
                          disabled={asset.status !== 'RELEASED'}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition ${
                            asset.status === 'RELEASED'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadAsset(asset)}
                          disabled={asset.status !== 'RELEASED'}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition ${
                            asset.status === 'RELEASED'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Personal Legacy Notes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Personal Legacy Notes</h2>
              </div>

              {notes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No legacy notes have been shared with you.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{note.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">{note.category}</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{note.priority} Priority</span>
                            <Calendar className="w-3 h-3 ml-2" />
                            <span>Written: {new Date(note.written_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Release Condition: {note.release_condition}
                        </p>
                        <button
                          onClick={() => handleDownloadNote(note)}
                          className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verification Status Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">Verification Status</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Death Certificate</p>
                  <div className="flex items-center gap-2">
                    {verification.death_certificate_status === 'Verified' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : verification.death_certificate_status === 'Pending' ? (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-semibold">{verification.death_certificate_status}</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Access State</p>
                  <div className="flex items-center gap-2">
                    {verification.access_state === 'ACTIVE' ? (
                      <Unlock className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-semibold">{verification.access_state}</span>
                  </div>
                </div>

                {verification.verification_timestamp && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Verified On</p>
                    <p className="font-semibold">{new Date(verification.verification_timestamp).toLocaleString()}</p>
                  </div>
                )}

                {verification.verifying_authority && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Verifying Authority</p>
                    <p className="font-semibold">{verification.verifying_authority}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Access Audit Log */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-800">Access Audit Log</h2>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Details</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Device</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-700">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {log.action_details || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              {getDeviceIcon(log.device_type)}
                              <span>{log.device_type}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                            {log.ip_address}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Session & Legal Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-800">Session Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Session Expires In</p>
                  <p className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatTime(timeRemaining)}
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Current Device</p>
                  <div className="flex items-center gap-2 text-gray-800">
                    {getDeviceIcon(session.device_type)}
                    <span className="font-semibold">{session.device_type}</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">IP Address</p>
                  <p className="font-mono text-sm text-gray-800">{session.ip_address}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Legal Notice</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Unauthorized distribution of accessed materials is strictly prohibited</li>
                  <li>All access and actions are logged and legally auditable</li>
                  <li>Data access is governed by the account owner's continuity instructions</li>
                  <li>You may only view and download materials released to you</li>
                </ul>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded font-medium transition"
              >
                <LogOut className="w-5 h-5" />
                End Session & Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
