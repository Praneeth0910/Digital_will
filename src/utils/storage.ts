import { User, Nominee, DigitalAsset, DeadManSwitch } from '../types';

// Simple hash function for demo purposes (DO NOT USE IN PRODUCTION)
export const hashPassword = (password: string): string => {
  return btoa(password); // Base64 encoding for demo only
};

export const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

// LocalStorage keys
const USERS_KEY = 'digital_inheritance_users';
const NOMINEES_KEY = 'digital_inheritance_nominees';
const ASSETS_KEY = 'digital_inheritance_assets';
const SWITCHES_KEY = 'digital_inheritance_switches';
const CURRENT_USER_KEY = 'digital_inheritance_current_user';
const CURRENT_NOMINEE_KEY = 'digital_inheritance_current_nominee';

// User operations
export const saveUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const findUserByEmail = (email: string): User | undefined => {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Nominee operations
export const saveNominee = (nominee: Nominee): void => {
  const nominees = getNominees();
  nominees.push(nominee);
  localStorage.setItem(NOMINEES_KEY, JSON.stringify(nominees));
};

export const getNominees = (): Nominee[] => {
  const data = localStorage.getItem(NOMINEES_KEY);
  return data ? JSON.parse(data) : [];
};

export const findNomineeByEmailAndReference = (email: string, ownerRefId: string): Nominee | undefined => {
  const nominees = getNominees();
  console.log('=== Nominee Login Attempt ===');
  console.log('Email:', email);
  console.log('Reference ID:', ownerRefId);
  console.log('Total nominees in storage:', nominees.length);
  nominees.forEach((n, i) => {
    console.log(`Nominee ${i + 1}:`, {
      email: n.email,
      referenceId: n.ownerReferenceId,
      status: n.status,
      name: n.name
    });
  });
  
  const found = nominees.find(
    n => n.email.toLowerCase() === email.toLowerCase() && 
         n.ownerReferenceId.toUpperCase() === ownerRefId.toUpperCase()
  );
  
  console.log('Match found:', found ? 'YES' : 'NO');
  if (found) {
    console.log('Matched nominee:', { email: found.email, referenceId: found.ownerReferenceId, status: found.status });
  }
  console.log('===========================');
  
  return found;
};

export const getCurrentNominee = (): Nominee | null => {
  const data = localStorage.getItem(CURRENT_NOMINEE_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentNominee = (nominee: Nominee | null): void => {
  if (nominee) {
    localStorage.setItem(CURRENT_NOMINEE_KEY, JSON.stringify(nominee));
  } else {
    localStorage.removeItem(CURRENT_NOMINEE_KEY);
  }
};

export const updateNominee = (nominee: Nominee): void => {
  const nominees = getNominees();
  const updatedNominees = nominees.map(n => 
    n.id === nominee.id ? nominee : n
  );
  localStorage.setItem(NOMINEES_KEY, JSON.stringify(updatedNominees));
};

export const updateUser = (user: User): void => {
  const users = getUsers();
  const updatedUsers = users.map(u =>
    u.id === user.id ? user : u
  );
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
};

// Asset operations
export const getAssets = (): DigitalAsset[] => {
  const data = localStorage.getItem(ASSETS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getAssetsByOwnerId = (ownerId: string): DigitalAsset[] => {
  return getAssets().filter(a => a.ownerId === ownerId);
};

export const saveAsset = (asset: DigitalAsset): void => {
  const assets = getAssets();
  assets.push(asset);
  localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
};

// Continuity Access operations
export const getSwitch = (ownerId: string): DeadManSwitch | null => {
  const switches = getAllSwitches();
  return switches.find(s => s.ownerId === ownerId) || null;
};

export const getAllSwitches = (): DeadManSwitch[] => {
  const data = localStorage.getItem(SWITCHES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSwitch = (dmsSwitch: DeadManSwitch): void => {
  const switches = getAllSwitches().filter(s => s.ownerId !== dmsSwitch.ownerId);
  switches.push(dmsSwitch);
  localStorage.setItem(SWITCHES_KEY, JSON.stringify(switches));
};

export const triggerSwitch = (ownerId: string): void => {
  const dmsSwitch = getSwitch(ownerId);
  if (dmsSwitch) {
    dmsSwitch.isTriggered = true;
    dmsSwitch.triggeredAt = new Date().toISOString();
    saveSwitch(dmsSwitch);
    
    // Release all assets
    const assets = getAssetsByOwnerId(ownerId);
    const allAssets = getAssets();
    const updatedAssets = allAssets.map(a => 
      a.ownerId === ownerId ? { ...a, isReleased: true } : a
    );
    localStorage.setItem(ASSETS_KEY, JSON.stringify(updatedAssets));
    
    // Activate all nominees
    const nominees = getNominees();
    const updatedNominees = nominees.map(n =>
      n.ownerId === ownerId ? { ...n, status: 'ACTIVE' as const } : n
    );
    localStorage.setItem(NOMINEES_KEY, JSON.stringify(updatedNominees));
  }
};

export const checkInSwitch = (ownerId: string): void => {
  const dmsSwitch = getSwitch(ownerId);
  if (dmsSwitch && !dmsSwitch.isTriggered) {
    const now = new Date();
    const nextCheckIn = new Date(now);
    nextCheckIn.setDate(nextCheckIn.getDate() + dmsSwitch.checkInFrequencyDays);
    
    dmsSwitch.lastCheckIn = now.toISOString();
    dmsSwitch.nextCheckInDue = nextCheckIn.toISOString();
    saveSwitch(dmsSwitch);
  }
};

// Initialize demo data
export const initializeDemoData = (): void => {
  if (!localStorage.getItem(USERS_KEY)) {
    // Create demo user
    const demoUser: User = {
      id: 'demo-user-1',
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: hashPassword('password123'),
      createdAt: new Date().toISOString()
    };
    saveUser(demoUser);
    
    // Create demo assets
    const demoAssets: DigitalAsset[] = [
      {
        id: 'asset-1',
        ownerId: demoUser.id,
        title: 'Bank Account Details',
        type: 'document',
        description: 'Primary savings account information',
        isReleased: false
      },
      {
        id: 'asset-2',
        ownerId: demoUser.id,
        title: 'Cryptocurrency Wallet',
        type: 'crypto',
        description: 'Bitcoin & Ethereum wallet keys',
        isReleased: false
      },
      {
        id: 'asset-3',
        ownerId: demoUser.id,
        title: 'Social Media Accounts',
        type: 'password',
        description: 'Login credentials for social platforms',
        isReleased: false
      }
    ];
    demoAssets.forEach(saveAsset);
    
    // Create demo nominee
    const demoNominee: Nominee = {
      id: 'nominee-1',
      email: 'jane@example.com',
      ownerId: demoUser.id,
      ownerReferenceId: 'REF-12345',
      accessPhrase: 'SecurePhrase2024',
      status: 'INACTIVE',
      createdAt: new Date().toISOString()
    };
    saveNominee(demoNominee);
    
    // Create demo switch
    const now = new Date();
    const nextCheckIn = new Date(now);
    nextCheckIn.setDate(nextCheckIn.getDate() + 30);
    
    const demoSwitch: DeadManSwitch = {
      ownerId: demoUser.id,
      checkInFrequencyDays: 30,
      lastCheckIn: now.toISOString(),
      nextCheckInDue: nextCheckIn.toISOString(),
      isTriggered: false
    };
    saveSwitch(demoSwitch);
  }
};
