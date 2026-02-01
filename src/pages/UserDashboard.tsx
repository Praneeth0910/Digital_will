import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, FileText, Upload, Trash2, History, FolderOpen, BookHeart, Calendar } from 'lucide-react';
import { userApi } from '../api/client';
import {
  getCurrentUser,
  setCurrentUser,
  getAssetsByOwnerId,
  getNominees,
  saveNominee,
  updateNominee,
  getSwitch,
  checkInSwitch,
  triggerSwitch,
  saveSwitch
} from '../utils/storage';
import { DigitalAsset, Nominee, DeadManSwitch, VaultFile } from '../types';
import '../styles/Dashboard.css';

function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [deadManSwitch, setDeadManSwitch] = useState<DeadManSwitch | null>(null);
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState({
    title: '',
    description: '',
    category: 'Other' as VaultFile['category'],
    fileName: ''
  });
  const [legacyNote, setLegacyNote] = useState({
    title: '',
    content: '',
    writtenOn: new Date().toISOString().split('T')[0]
  });
  const [savedNotes, setSavedNotes] = useState<Array<{ id: string; title: string; content: string; writtenOn: string; savedAt: string }>>([]);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'save' | 'view'>('save');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [previewFile, setPreviewFile] = useState<{ file: File; version: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('expandedSections');
    return saved ? JSON.parse(saved) : { switch: true, assets: true, nominees: true, notes: true };
  });
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [assetFilter, setAssetFilter] = useState<string>('All');
  const [assetSort, setAssetSort] = useState<'lastUpdated' | 'name'>('lastUpdated');
  const [showAddNomineeModal, setShowAddNomineeModal] = useState(false);
  const [newNominee, setNewNominee] = useState({
    name: '',
    relationship: 'Family' as 'Family' | 'Legal Representative' | 'Friend' | 'Other',
    email: '',
    referenceId: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login-user');
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  useEffect(() => {
    localStorage.setItem('expandedSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadDashboardData = async () => {
    if (!user) return;

    const userAssets = getAssetsByOwnerId(user.id);
    let userSwitch = getSwitch(user.id);

    // Initialize dead man's switch if it doesn't exist
    if (!userSwitch) {
      const now = new Date();
      const nextCheckIn = new Date(now);
      nextCheckIn.setDate(nextCheckIn.getDate() + 30);
      
      const newSwitch: DeadManSwitch = {
        ownerId: user.id,
        checkInFrequencyDays: 30,
        lastCheckIn: now.toISOString(),
        nextCheckInDue: nextCheckIn.toISOString(),
        isTriggered: user.continuityTriggered || false
      };
      
      saveSwitch(newSwitch);
      userSwitch = newSwitch;
      console.log('✅ Initialized Dead Man\'s Switch for user:', user.email);
    }

    setAssets(userAssets);
    setDeadManSwitch(userSwitch);

    // Load nominees from backend
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await userApi.getNominees(token);
        if (response.success && response.data) {
          const backendNominees = response.data.map((n: any) => ({
            id: n.nomineeId,
            ownerId: user.id,
            ownerReferenceId: n.beneficiary_reference_id,
            email: n.nominee_email,
            name: n.nominee_name,
            relationship: n.relation,
            status: n.status,
            accessPhrase: '',
            createdAt: n.created_at
          }));
          setNominees(backendNominees);
        }
      }
    } catch (err) {
      console.error('Failed to load nominees from backend:', err);
      // Fallback to localStorage
      const userNominees = getNominees().filter(n => n.ownerId === user.id);
      setNominees(userNominees);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  const handleCheckIn = async () => {
    if (user && deadManSwitch && !deadManSwitch.isTriggered) {
      setLoadingStates(prev => ({ ...prev, checkIn: true }));
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      checkInSwitch(user.id);
      loadDashboardData();
      setLoadingStates(prev => ({ ...prev, checkIn: false }));
      showToast('Check-in successful! Your Continuity Access timer has been reset.', 'success');
    }
  };

  const handleSimulateTrigger = async () => {
    if (user && deadManSwitch && !deadManSwitch.isTriggered) {
      const confirm = window.confirm(
        'This will simulate Continuity Access activation and notify all nominees. Continue?'
      );
      if (confirm) {
        setLoadingStates(prev => ({ ...prev, triggerContinuity: true }));
        
        try {
          const token = localStorage.getItem('auth_token');
          if (!token) {
            showToast('Please log in again', 'error');
            navigate('/login-user');
            return;
          }

          const response = await userApi.triggerContinuity(token);
          
          if (!response.success) {
            showToast(response.message || 'Failed to trigger continuity', 'error');
            setLoadingStates(prev => ({ ...prev, triggerContinuity: false }));
            return;
          }

          console.log('=== CONTINUITY TRIGGERED ===');
          console.log('Backend Response:', response.data);
          console.log('Nominees will be notified');
          console.log('===========================');

          // Update local user state
          if (user) {
            const updatedUser = { ...user, continuityTriggered: true };
            setUser(updatedUser);
            setCurrentUser(updatedUser);
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
          }

          // Update local dead man switch state
          triggerSwitch(user.id);
          
          // Reload dashboard data to reflect changes
          await loadDashboardData();
          
          setLoadingStates(prev => ({ ...prev, triggerContinuity: false }));
          showToast(`Continuity Access activated! ${nominees.length} nominee(s) have been notified.`, 'success');
        } catch (err) {
          console.error('Trigger continuity error:', err);
          showToast('Failed to connect to server. Please try again.', 'error');
          setLoadingStates(prev => ({ ...prev, triggerContinuity: false }));
        }
      }
    }
  };

  const generateReferenceId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `BEN-${part1}-${part2}`;
  };

  const handleOpenAddNomineeModal = () => {
    if (nominees.length >= 2) {
      showToast('Maximum of 2 nominees allowed', 'error');
      return;
    }
    setNewNominee({
      name: '',
      relationship: 'Family',
      email: '',
      referenceId: generateReferenceId()
    });
    setShowAddNomineeModal(true);
  };

  const handleAddNominee = async () => {
    if (!user || !newNominee.name.trim() || !newNominee.email.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newNominee.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Check nominee limit (max 2 nominees)
    if (nominees.length >= 2) {
      showToast('Maximum 2 nominees allowed', 'error');
      return;
    }

    // Check if email already exists in current nominees list
    const emailExists = nominees.some(n => n.email.toLowerCase() === newNominee.email.toLowerCase());
    if (emailExists) {
      showToast('This email is already added as a nominee', 'error');
      return;
    }

    setLoadingStates(prev => ({ ...prev, addNominee: true }));

    try {
      // Get user token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Please log in again', 'error');
        navigate('/login-user');
        return;
      }

      // Call backend API to add nominee
      const response = await userApi.addNominee(token, {
        nominee_email: newNominee.email,
        nominee_name: newNominee.name,
        relation: newNominee.relationship
      });

      if (!response.success) {
        showToast(response.message || 'Failed to add nominee', 'error');
        setLoadingStates(prev => ({ ...prev, addNominee: false }));
        
        // Close modal and reload to show existing nominees
        setShowAddNomineeModal(false);
        await loadDashboardData();
        return;
      }

      const backendNominee = response.data.nominee;
      
      console.log('=== Nominee Created via Backend ===');
      console.log('Name:', backendNominee.nominee_name);
      console.log('Relationship:', backendNominee.relation);
      console.log('Email:', backendNominee.nominee_email);
      console.log('Reference ID (BEN-ID):', backendNominee.beneficiary_reference_id);
      console.log('Status:', backendNominee.status);
      console.log('Saved to MongoDB: ✓');

      // Convert backend nominee format to frontend format for display
      const nominee: Nominee = {
        id: backendNominee.nomineeId || backendNominee._id,
        ownerId: user.id,
        ownerReferenceId: backendNominee.beneficiary_reference_id,
        email: backendNominee.nominee_email,
        name: backendNominee.nominee_name,
        relationship: backendNominee.relation,
        status: backendNominee.status,
        accessPhrase: '',
        createdAt: backendNominee.created_at || new Date().toISOString()
      };

      setNominees(prev => [...prev, nominee]);
      setShowAddNomineeModal(false);
      setNewNominee({ name: '', relationship: 'Family', email: '', referenceId: '' });
      setLoadingStates(prev => ({ ...prev, addNominee: false }));
      showToast(`Nominee added successfully! BEN-ID: ${backendNominee.beneficiary_reference_id}`, 'success');

    } catch (err) {
      console.error('Add nominee error:', err);
      showToast('Failed to connect to server. Please try again.', 'error');
      setLoadingStates(prev => ({ ...prev, addNominee: false }));
    }
  };

  const getDaysUntilCheckIn = (): number => {
    if (!deadManSwitch || !deadManSwitch.nextCheckInDue) return 30;
    const now = new Date();
    const nextCheckIn = new Date(deadManSwitch.nextCheckInDue);
    const diffTime = nextCheckIn.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getAssetTypeIcon = (type: string): string => {
    switch (type) {
      case 'document': return '📄';
      case 'password': return '🔑';
      case 'media': return '🎬';
      case 'crypto': return '₿';
      default: return '📦';
    }
  };

  const handleAddFile = async () => {
    if (!user || !newFile.title || !selectedFile) {
      showToast('Please fill in all required fields and select a file', 'error');
      return;
    }

    setLoadingStates(prev => ({ ...prev, addFile: true }));

    try {
      // ✅ CORRECT WAY: Create FormData object
      const formData = new FormData();
      formData.append('file', selectedFile);           // Must match backend: upload.single('file')
      formData.append('title', newFile.title);         // Add other text fields
      formData.append('description', newFile.description);
      formData.append('category', newFile.category);

      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Authentication token not found', 'error');
        setLoadingStates(prev => ({ ...prev, addFile: false }));
        return;
      }

      console.log('=== Uploading File to Backend ===');
      console.log('File:', selectedFile.name, '-', selectedFile.size, 'bytes');
      console.log('Title:', newFile.title);
      console.log('Category:', newFile.category);

      // ✅ Send as Multipart Form via API
      const response = await userApi.uploadAsset(token, formData);

      console.log('Backend Response:', response);

      if (response.success) {
        showToast('✅ File Encrypted & Secured!', 'success');
        setShowAddFileModal(false);
        setNewFile({ title: '', description: '', category: 'Other', fileName: '' });
        setSelectedFile(null);
        
        // Add the new asset to the list immediately from the backend response
        if (response.data) {
          console.log('Adding new asset to dashboard:', response.data);
          const newAsset: DigitalAsset = {
            id: response.data._id,
            ownerId: user.id,
            assetName: response.data.asset_name,
            assetType: response.data.asset_type,
            description: response.data.description,
            filePath: response.data.file_path,
            status: response.data.status,
            encrypted: response.data.encrypted,
            version: 1,
            createdAt: new Date(response.data.createdAt || Date.now()).toISOString(),
            updatedAt: new Date(response.data.updatedAt || Date.now()).toISOString()
          };
          
          // Add new asset to the beginning of the list
          setAssets(prevAssets => [newAsset, ...prevAssets]);
        } else {
          // Fallback: refresh from localStorage
          if (user) {
            const userAssets = getAssetsByOwnerId(user.id);
            setAssets(userAssets);
          }
        }
      } else {
        // Show detailed error message
        const errorDetail = response.debug ? ` [${response.debug}]` : '';
        const errorMsg = response.message || 'Unknown error';
        console.error('Upload Error Response:', response);
        showToast('❌ Upload Failed: ' + errorMsg + errorDetail, 'error');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showToast('❌ Network Error: ' + errorMsg, 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, addFile: false }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewFile({ ...newFile, fileName: file.name });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSaveNote = async () => {
    if (!legacyNote.content.trim()) {
      showToast('Please write a message before saving', 'error');
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, saveNote: true }));
    await new Promise(resolve => setTimeout(resolve, 600));

    const newNote = {
      id: `note-${Date.now()}`,
      title: legacyNote.title || 'Untitled Note',
      content: legacyNote.content,
      writtenOn: legacyNote.writtenOn,
      savedAt: new Date().toISOString()
    };

    setSavedNotes(prev => [...prev, newNote]);
    setLegacyNote({ title: '', content: '', writtenOn: new Date().toISOString().split('T')[0] });
    setIsEditingNote(false);
    setLoadingStates(prev => ({ ...prev, saveNote: false }));
    showToast('Legacy note saved and secured!', 'success');

    console.log('=== Legacy Note Saved ===');
    console.log('Title:', newNote.title);
    console.log('Content:', newNote.content);
    console.log('Written On:', newNote.writtenOn);
    console.log('Timestamp:', newNote.savedAt);
  };

  const handleViewNote = (noteId: string) => {
    setViewingNoteId(noteId);
  };

  const handlePasswordConfirm = async () => {
    if (!passwordInput.trim()) {
      setPasswordError('Please enter your password');
      return;
    }

    // Simulate password verification (demo password: password123)
    if (passwordInput !== 'password123') {
      setPasswordError('Incorrect password. Please try again.');
      return;
    }

    setLoadingStates(prev => ({ ...prev, passwordVerify: true }));
    await new Promise(resolve => setTimeout(resolve, 600));

    // Save the note
    const newNote = {
      id: `note-${Date.now()}`,
      title: legacyNote.title || 'Untitled Note',
      content: legacyNote.content,
      writtenOn: legacyNote.writtenOn,
      savedAt: new Date().toISOString()
    };

    setSavedNotes(prev => [...prev, newNote]);
    setLegacyNote({ title: '', content: '', writtenOn: new Date().toISOString().split('T')[0] });
    setIsEditingNote(false);
    showToast('Legacy note saved and secured!', 'success');

    console.log('=== Legacy Note Saved ===');
    console.log('Title:', newNote.title);
    console.log('Content:', newNote.content);
    console.log('Written On:', newNote.writtenOn);
    console.log('Timestamp:', newNote.savedAt);

    // Clear password immediately after use
    setPasswordInput('');
    setShowPasswordModal(false);
    setPasswordError('');
    setLoadingStates(prev => ({ ...prev, passwordVerify: false }));
  };

  const handleCancelPassword = () => {
    setPasswordInput('');
    setShowPasswordModal(false);
    setPasswordError('');
    setViewingNoteId(null);
  };

  const handleAddNewNote = () => {
    setIsEditingNote(true);
    setViewingNoteId(null);
    setLegacyNote({ title: '', content: '', writtenOn: new Date().toISOString().split('T')[0] });
  };

  const handleCloseViewing = () => {
    setViewingNoteId(null);
  };

  const handleViewFile = (file: File, versionNumber: number) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewFile({ file, version: versionNumber });
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewFile(null);
  };

  const handleDownloadFile = () => {
    if (!previewFile) return;
    
    const url = URL.createObjectURL(previewFile.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = previewFile.file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilePreviewType = (file: File): 'image' | 'pdf' | 'other' => {
    const type = file.type.toLowerCase();
    if (type.includes('image/jpeg') || type.includes('image/jpg') || type.includes('image/png')) {
      return 'image';
    }
    if (type.includes('pdf')) {
      return 'pdf';
    }
    return 'other';
  };

  const handleUploadNewVersion = (fileId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.doc,.jpg,.jpeg,.png,.zip';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setVaultFiles(vaultFiles.map(vaultFile => {
        if (vaultFile.id === fileId) {
          const newVersion = {
            versionNumber: vaultFile.versions.length + 1,
            uploadedAt: new Date().toISOString(),
            fileSize: formatFileSize(file.size),
            fileName: file.name,
            file: file
          };
          return {
            ...vaultFile,
            versions: [...vaultFile.versions, newVersion],
            lastUpdated: new Date().toISOString()
          };
        }
        return vaultFile;
      }));
    };
    input.click();
  };

  const handleDeleteFile = (fileId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this file? This action cannot be undone.');
    if (confirmed) {
      setVaultFiles(vaultFiles.filter(file => file.id !== fileId));
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Legal': return '#7c3aed';
      case 'Financial': return '#059669';
      case 'Personal': return '#0284c7';
      case 'Credentials': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getFilteredAndSortedFiles = () => {
    let filtered = vaultFiles;
    
    // Apply filter
    if (assetFilter !== 'All') {
      filtered = vaultFiles.filter(file => file.category === assetFilter);
    }
    
    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      if (assetSort === 'lastUpdated') {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });
    
    return sorted;
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <header className="dashboard-header">
        <div className="header-content">
          <h1>Digital Inheritance Dashboard</h1>
          <div className="user-info">
            <span className="user-name">{user.fullName}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Continuity Access Status */}
        <section className={`dashboard-section switch-section section-animated ${expandedSections.switch ? 'expanded' : 'collapsed'}`}>
          <div className="section-header-collapsible" onClick={() => toggleSection('switch')}>
            <h2>⏱️ Continuity Access Status</h2>
            <button className="collapse-btn">{expandedSections.switch ? '−' : '+'}</button>
          </div>
          {expandedSections.switch && (
          <div className={`switch-card ${deadManSwitch?.isTriggered ? 'triggered' : 'active'}`}>
            {deadManSwitch?.isTriggered ? (
              <div className="switch-triggered">
                <div className="status-badge status-triggered">TRIGGERED</div>
                <p>Your Continuity Access has been activated.</p>
                <p>All assets have been released to your nominees.</p>
                <small>Triggered on: {new Date(deadManSwitch.triggeredAt!).toLocaleString()}</small>
              </div>
            ) : (
              <div className="switch-active">
                <div className="status-badge status-active">ACTIVE</div>
                <p>
                  Next check-in required in: <strong>{getDaysUntilCheckIn()} days</strong>
                </p>
                <p>
                  <small>Last check-in: {new Date(deadManSwitch?.lastCheckIn || '').toLocaleDateString()}</small>
                </p>
                <div className="switch-actions">
                  <button 
                    onClick={handleCheckIn} 
                    className="btn btn-primary"
                    disabled={loadingStates.checkIn}
                  >
                    {loadingStates.checkIn ? (
                      <>
                        <span className="spinner"></span>
                        Checking In...
                      </>
                    ) : (
                      'Check In Now'
                    )}
                  </button>
                  <button 
                    onClick={handleSimulateTrigger} 
                    className="btn btn-danger"
                    disabled={loadingStates.triggerContinuity}
                  >
                    {loadingStates.triggerContinuity ? (
                      <>
                        <span className="spinner"></span>
                        Triggering...
                      </>
                    ) : (
                      'Simulate Inactivity Trigger'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </section>

        {/* Digital Asset Index */}
        <section className={`dashboard-section section-animated ${expandedSections.assets ? 'expanded' : 'collapsed'}`}>
          <div className="section-header-collapsible" onClick={() => toggleSection('assets')}>
            <h2><FolderOpen size={24} style={{ display: 'inline', marginRight: '8px' }} />Digital Asset Index</h2>
            <button className="collapse-btn">{expandedSections.assets ? '−' : '+'}</button>
          </div>

          {expandedSections.assets && (
          <>
            <div className="asset-toolbar">
              <div className="asset-count">
                Total Assets: <strong>{vaultFiles.length}</strong>
              </div>
              <div className="asset-filters">
                {['All', 'Legal', 'Financial', 'Personal', 'Credentials', 'Other'].map(filter => (
                  <button
                    key={filter}
                    className={`filter-pill ${assetFilter === filter ? 'active' : ''}`}
                    onClick={() => setAssetFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="asset-sort">
                <label htmlFor="asset-sort">Sort by:</label>
                <select
                  id="asset-sort"
                  value={assetSort}
                  onChange={(e) => setAssetSort(e.target.value as 'lastUpdated' | 'name')}
                  className="sort-dropdown"
                >
                  <option value="lastUpdated">Last Updated</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            <div className="vault-files-grid">
              {/* Add New Asset Card */}
              <div className="add-asset-card" onClick={() => setShowAddFileModal(true)}>
                <div className="add-asset-icon">
                  <Upload size={48} strokeWidth={1.5} />
                </div>
                <h3>Add New Digital Asset</h3>
                <p className="add-asset-description">
                  Upload legal documents, financial records, credentials, or personal files
                </p>
                <div className="add-asset-hint">
                  <Lock size={14} /> End-to-end encrypted
                </div>
              </div>

              {/* Existing Asset Cards */}
              {getFilteredAndSortedFiles().map(file => (
                <div key={file.id} className="vault-file-card">
                  <div className="file-header">
                    <div className="file-icon">
                      <FileText size={32} color="#667eea" />
                    </div>
                    <div className="file-meta">
                      <h3>{file.title}</h3>
                      <div className="file-category" style={{ backgroundColor: getCategoryColor(file.category) + '20', color: getCategoryColor(file.category) }}>
                        {file.category}
                      </div>
                    </div>
                  </div>
                  
                  <p className="file-description">{file.description}</p>
                  
                  <div className="file-info">
                    <div className="info-row">
                      <span className="info-label">Latest Version:</span>
                      <span className="info-value">v{file.versions.length}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Last Updated:</span>
                      <span className="info-value">{new Date(file.lastUpdated).toLocaleDateString()}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Status:</span>
                      <span className={`status-badge status-${file.status.toLowerCase()}`}>{file.status}</span>
                    </div>
                  </div>

                  <div className="file-actions">
                    <button 
                      onClick={() => setShowVersionHistory(file.id)} 
                      className="btn-icon"
                      title="View Version History"
                    >
                      <History size={18} />
                    </button>
                    <button 
                      onClick={() => handleUploadNewVersion(file.id)} 
                      className="btn-icon"
                      title="Upload New Version"
                    >
                      <Upload size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteFile(file.id)} 
                      className="btn-icon btn-danger"
                      title="Delete File"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
          )}
        </section>

        {/* Add File Modal */}
        {showAddFileModal && (
          <div className="modal-overlay" onClick={() => { setShowAddFileModal(false); setSelectedFile(null); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add Digital Asset</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleAddFile(); }}>
                <div className="form-group">
                  <label>File Title *</label>
                  <input
                    type="text"
                    value={newFile.title}
                    onChange={(e) => setNewFile({ ...newFile, title: e.target.value })}
                    placeholder="e.g., Last Will & Testament"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Select File *</label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.zip"
                    required
                    style={{
                      padding: '12px',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  />
                  <small style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                    <Lock size={14} color="#667eea" />
                    File will be encrypted before storage
                  </small>
                  
                  {selectedFile && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                        Selected File:
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        <div>📄 {selectedFile.name}</div>
                        <div>📊 {formatFileSize(selectedFile.size)}</div>
                        <div>📝 {selectedFile.type || 'Unknown type'}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Description / Notes</label>
                  <textarea
                    value={newFile.description}
                    onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
                    placeholder="Add any relevant notes or context..."
                    rows={3}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAddFileModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!selectedFile || !newFile.title || loadingStates.addFile}
                    style={{
                      opacity: (!selectedFile || !newFile.title || loadingStates.addFile) ? 0.5 : 1,
                      cursor: (!selectedFile || !newFile.title || loadingStates.addFile) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loadingStates.addFile ? (
                      <>
                        <span className="spinner"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Lock size={18} style={{ marginRight: '8px' }} />
                        Add File Securely
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Version History Modal */}
        {showVersionHistory && (
          <div className="modal-overlay" onClick={() => setShowVersionHistory(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Version History</h2>
              {vaultFiles.find(f => f.id === showVersionHistory)?.versions.slice().reverse().map((version, idx) => (
                <div key={idx} className="version-item">
                  <div className="version-badge">v{version.versionNumber}</div>
                  <div className="version-details">
                    <div className="version-filename">{version.fileName}</div>
                    <div className="version-meta">
                      {new Date(version.uploadedAt).toLocaleString()} • {version.fileSize}
                    </div>
                  </div>
                  <div className="version-actions">
                    <button 
                      className="btn-small"
                      onClick={() => handleViewFile(version.file, version.versionNumber)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button onClick={() => setShowVersionHistory(null)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Preview Modal */}
        {previewFile && previewUrl && (
          <div className="modal-overlay" onClick={handleClosePreview}>
            <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
              <h2>File Preview - v{previewFile.version}</h2>
              <div className="preview-filename">{previewFile.file.name}</div>
              
              <div className="preview-container">
                {getFilePreviewType(previewFile.file) === 'image' && (
                  <img 
                    src={previewUrl} 
                    alt={previewFile.file.name}
                    className="preview-image"
                  />
                )}
                
                {getFilePreviewType(previewFile.file) === 'pdf' && (
                  <iframe 
                    src={previewUrl}
                    className="preview-iframe"
                    title="PDF Preview"
                  />
                )}
                
                {getFilePreviewType(previewFile.file) === 'other' && (
                  <div className="preview-fallback">
                    <FileText size={64} color="#94a3b8" />
                    <p>Preview not available for this file type.</p>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      Use the download button below to view the file.
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button onClick={handleDownloadFile} className="btn btn-primary">
                  <Upload size={18} style={{ marginRight: '8px', transform: 'rotate(180deg)' }} />
                  Download
                </button>
                <button onClick={handleClosePreview} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nominees */}
        <section className={`dashboard-section section-animated ${expandedSections.nominees ? 'expanded' : 'collapsed'}`}>
          <div className="section-header-collapsible" onClick={() => toggleSection('nominees')}>
            <h2>👥 Nominated Beneficiaries</h2>
            <button className="collapse-btn">{expandedSections.nominees ? '−' : '+'}</button>
          </div>
          {expandedSections.nominees && (
          <div className="nominees-container">
            <div className="nominees-header">
              <p className="nominees-description">
                Trusted individuals who will gain access to your digital assets only after Continuity Access is activated.
                {nominees.length >= 2 && <span style={{ display: 'block', marginTop: '8px', color: '#f59e0b', fontWeight: 600 }}>Maximum limit reached (2/2)</span>}
              </p>
              <button 
                onClick={handleOpenAddNomineeModal} 
                className="btn btn-primary"
                disabled={nominees.length >= 2}
                style={{
                  opacity: nominees.length >= 2 ? 0.5 : 1,
                  cursor: nominees.length >= 2 ? 'not-allowed' : 'pointer'
                }}
              >
                Add Nominee {nominees.length > 0 && `(${nominees.length}/2)`}
              </button>
            </div>

            <div className="nominees-list">
            {nominees.length === 0 ? (
              <div className="empty-state enhanced">
                <div className="empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3>No Nominees Added</h3>
                <p className="empty-description">
                  Add trusted individuals who will receive access to your digital assets when Continuity Access is activated.
                </p>
                <div className="empty-suggestions">
                  <div className="suggestion-item">
                    <span className="suggestion-icon">👨‍👩‍👧‍👦</span>
                    <span>Family members</span>
                  </div>
                  <div className="suggestion-item">
                    <span className="suggestion-icon">⚖️</span>
                    <span>Legal representatives</span>
                  </div>
                  <div className="suggestion-item">
                    <span className="suggestion-icon">🤝</span>
                    <span>Trusted friends</span>
                  </div>
                </div>
                <button 
                  onClick={handleOpenAddNomineeModal} 
                  className="btn btn-primary empty-cta"
                  disabled={nominees.length >= 2}
                >
                  Add Your First Nominee
                </button>
              </div>
            ) : (
              nominees.map(nominee => (
                <div key={nominee.id} className="nominee-card-enhanced">
                  <div className="nominee-card-header">
                    <div className="nominee-avatar">
                      {nominee.name?.charAt(0).toUpperCase() || nominee.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="nominee-info">
                      <h3>{nominee.name || 'Unnamed Nominee'}</h3>
                      <p className="nominee-email">{nominee.email}</p>
                    </div>
                    <div className={`nominee-status-badge status-${nominee.status}`}>
                      {nominee.status === 'INACTIVE' ? 'Inactive' : nominee.status === 'ACTIVE' ? 'Active' : nominee.status}
                    </div>
                  </div>
                  <div className="nominee-card-details">
                    <div className="detail-row">
                      <span className="detail-label">Relationship:</span>
                      <span className="detail-value">{nominee.relationship || 'Not specified'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Reference ID:</span>
                      <span className="detail-value reference-id">
                        {nominee.status === 'INACTIVE' 
                          ? `•••• •••• ${nominee.ownerReferenceId.slice(-4)}`
                          : nominee.ownerReferenceId
                        }
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Added:</span>
                      <span className="detail-value">{new Date(nominee.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {nominee.status === 'INACTIVE' && (
                    <div className="nominee-card-footer">
                      <Lock size={14} style={{ marginRight: '6px', color: '#94a3b8' }} />
                      <span className="footer-text">No access before Continuity Access activation</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          </div>
          )}
        </section>

        {/* Add Nominee Modal */}
        {showAddNomineeModal && (
          <div className="modal-overlay" onClick={() => setShowAddNomineeModal(false)}>
            <div className="modal-content nominee-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Add Nominee</h2>
              <p className="modal-subtitle">
                Add a trusted individual who will receive access to your digital assets when Continuity Access is activated.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleAddNominee(); }}>
                <div className="form-group">
                  <label htmlFor="nominee-name">Full Name *</label>
                  <input
                    id="nominee-name"
                    type="text"
                    value={newNominee.name}
                    onChange={(e) => setNewNominee({ ...newNominee, name: e.target.value })}
                    placeholder="Enter nominee's full name"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="nominee-relationship">Relationship *</label>
                  <select
                    id="nominee-relationship"
                    value={newNominee.relationship}
                    onChange={(e) => setNewNominee({ ...newNominee, relationship: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="Family">Family</option>
                    <option value="Legal Representative">Legal Representative</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="nominee-email">Email Address *</label>
                  <input
                    id="nominee-email"
                    type="email"
                    value={newNominee.email}
                    onChange={(e) => setNewNominee({ ...newNominee, email: e.target.value })}
                    placeholder="nominee@example.com"
                    className="form-input"
                  />
                  <small style={{ color: '#64748b', fontSize: '13px', marginTop: '6px', display: 'block' }}>
                    Will be used to notify nominee when Continuity Access is activated
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="nominee-reference">Beneficiary Reference ID</label>
                  <input
                    id="nominee-reference"
                    type="text"
                    value={newNominee.referenceId}
                    readOnly
                    className="form-input reference-id-input"
                    style={{ 
                      fontFamily: 'monospace', 
                      letterSpacing: '1px',
                      backgroundColor: '#f1f5f9',
                      cursor: 'not-allowed'
                    }}
                  />
                  <div className="info-box" style={{ marginTop: '12px' }}>
                    <Lock size={14} style={{ color: '#3b82f6', marginRight: '8px', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#1e40af' }}>
                      This ID will be activated only after Continuity Access is triggered. No access is granted before activation.
                    </span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowAddNomineeModal(false)} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!newNominee.name.trim() || !newNominee.email.trim() || loadingStates.addNominee}
                  >
                    {loadingStates.addNominee ? (
                      <>
                        <span className="spinner"></span>
                        Adding...
                      </>
                    ) : (
                      'Add Nominee'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Confirmation Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={handleCancelPassword}>
            <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
              <div className="password-modal-header">
                <Lock size={48} color="#667eea" strokeWidth={1.5} />
                <h2>Master Password Required</h2>
                <p className="modal-subtitle">
                  Confirm your identity to save and secure this legacy note
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="master-password">Enter Your Master Account Password</label>
                <input
                  id="master-password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter your password"
                  className={`password-input ${passwordError ? 'error' : ''}`}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordConfirm()}
                  autoFocus
                />
                {passwordError && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {passwordError}
                  </div>
                )}
                <small style={{ color: '#64748b', fontSize: '13px', marginTop: '8px', display: 'block' }}>
                  Demo password: <code>password123</code>
                </small>
              </div>

              <div className="security-info">
                <div className="info-box">
                  <Lock size={16} style={{ color: '#10b981', marginRight: '8px' }} />
                  <span>Your password is never stored and is only used for verification</span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  onClick={handleCancelPassword}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordConfirm}
                  className="btn btn-primary"
                  disabled={!passwordInput.trim() || loadingStates.passwordVerify}
                >
                  {loadingStates.passwordVerify ? (
                    <>
                      <span className="spinner"></span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock size={18} style={{ marginRight: '8px' }} />
                      Confirm Identity
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Personal Legacy Notes (Diary Section) */}
        <section className={`dashboard-section legacy-notes-section section-animated ${expandedSections.notes ? 'expanded' : 'collapsed'}`}>
          <div className="section-header-collapsible" onClick={() => toggleSection('notes')}>
            <div className="legacy-header">
              <div className="legacy-title-wrapper">
                <BookHeart size={28} strokeWidth={1.5} className="legacy-icon" />
                <h2>Personal Legacy Notes</h2>
              </div>
              <div className="legacy-subtitle">
                Write messages to your loved ones that will be delivered when it matters most
              </div>
            </div>
            <button className="collapse-btn">{expandedSections.notes ? '−' : '+'}</button>
          </div>

          {expandedSections.notes && (
          <div className="legacy-notes-container">
            {/* Note Editor or Viewer */}
            {viewingNoteId === null && (
              <div className="legacy-card">
                <div className="note-editor">
                  <div className="editor-header">
                    <BookHeart size={24} color="#667eea" strokeWidth={2} />
                    <div>
                      <h3>{isEditingNote || savedNotes.length === 0 ? 'Write Your Legacy Message' : 'Legacy Notes'}</h3>
                      <p className="editor-subtitle">Heartfelt messages for your loved ones</p>
                    </div>
                  </div>
                  
                  {(isEditingNote || savedNotes.length === 0) ? (
                    <>
                      <div className="legacy-form-header">
                        <div className="form-group">
                          <label htmlFor="note-title">Note Title (Optional)</label>
                          <input
                            id="note-title"
                            type="text"
                            value={legacyNote.title}
                            onChange={(e) => setLegacyNote(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., To My Children, Final Wishes, Life Advice..."
                            className="legacy-title-input"
                          />
                        </div>

                        <div className="form-group legacy-date-group">
                          <label htmlFor="written-on">
                            <Calendar size={16} style={{ marginRight: '6px' }} />
                            Written On
                          </label>
                          <input
                            id="written-on"
                            type="date"
                            value={legacyNote.writtenOn}
                            onChange={(e) => setLegacyNote(prev => ({ ...prev, writtenOn: e.target.value }))}
                            className="legacy-date-input"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="note-content">Your Message *</label>
                        <textarea
                          id="note-content"
                          value={legacyNote.content}
                          onChange={(e) => setLegacyNote(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Write your heartfelt message here. Share your wisdom, express your love, or leave instructions for your loved ones..."
                          rows={12}
                          className="note-textarea"
                        />
                        <div className="char-counter">
                          {legacyNote.content.length} characters
                        </div>
                      </div>

                      <div className="note-actions">
                        <button
                          onClick={handleSaveNote}
                          className="btn btn-primary save-note-btn"
                          disabled={!legacyNote.content.trim() || loadingStates.saveNote}
                        >
                          {loadingStates.saveNote ? (
                            <>
                              <span className="spinner"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Lock size={18} style={{ marginRight: '8px' }} />
                              Save & Secure Note
                            </>
                          )}
                        </button>
                      </div>

                      <div className="security-notice">
                        <Lock size={16} style={{ marginRight: '8px', color: '#10b981' }} />
                        <span>Your note will be encrypted and secured after saving.</span>
                      </div>
                    </>
                  ) : (
                    <div className="empty-editor-state">
                      <button onClick={handleAddNewNote} className="btn btn-primary">
                        <BookHeart size={18} style={{ marginRight: '8px' }} />
                        Write New Legacy Note
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Note Viewer - Read Only */}
            {viewingNoteId !== null && (
              <div className="legacy-card">
                <div className="note-viewer">
                  {(() => {
                    const note = savedNotes.find(n => n.id === viewingNoteId);
                    if (!note) return null;
                    
                    return (
                      <>
                        <div className="viewer-header">
                          <div className="viewer-title-section">
                            <h3>{note.title}</h3>
                            <div className="viewer-metadata">
                              <span className="metadata-item">
                                <Calendar size={14} />
                                Written: {new Date(note.writtenOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="metadata-item">
                                Saved: {new Date(note.savedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button onClick={handleCloseViewing} className="btn btn-secondary btn-small">
                            Close
                          </button>
                        </div>
                        
                        <div className="note-content-display">
                          {note.content}
                        </div>

                        <div className="viewer-footer">
                          <Lock size={14} style={{ marginRight: '6px', color: '#10b981' }} />
                          <span style={{ fontSize: '13px', color: '#64748b' }}>This note is encrypted and secure</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Saved Notes List */}
            {savedNotes.length > 0 && viewingNoteId === null && (
              <div className="saved-notes-section">
                <div className="saved-notes-header">
                  <h3>
                    <Lock size={20} style={{ marginRight: '8px' }} />
                    Saved Legacy Notes ({savedNotes.length})
                  </h3>
                </div>
                
                <div className="notes-grid">
                  {savedNotes.map(note => (
                    <div key={note.id} className="note-card" onClick={() => handleViewNote(note.id)}>
                      <div className="note-card-header">
                        <h4>{note.title}</h4>
                        <Lock size={16} className="lock-badge" />
                      </div>
                      <div className="note-card-meta">
                        <div className="meta-row">
                          <Calendar size={14} />
                          <span>{new Date(note.writtenOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="meta-row">
                          <span className="note-preview">{note.content.substring(0, 80)}...</span>
                        </div>
                      </div>
                      <div className="note-card-footer">
                        <span className="saved-time">
                          Saved {new Date(note.savedAt).toLocaleDateString()}
                        </span>
                        <span className="char-count">{note.content.length} chars</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;
