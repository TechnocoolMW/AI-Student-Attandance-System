import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, getDocFromServer, doc } from 'firebase/firestore';
import { Student, AttendanceRecord } from './types';
import { Camera, LayoutDashboard, UserPlus, LogOut, LogIn, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AttendanceDashboard from './components/AttendanceDashboard';
import CameraView from './components/CameraView';
import StudentRegistration from './components/StudentRegistration';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'camera' | 'registration'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (err: any) {
        if (err.message?.includes('offline')) {
          setError("Firestore is offline. Check your configuration.");
        }
      }
    };
    testConnection();

    // Listen to students
    const qStudents = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(data);
    }, (err) => console.error("Students snapshot error:", err));

    // Listen to attendance
    const qAttendance = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
    const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setAttendance(data);
    }, (err) => console.error("Attendance snapshot error:", err));

    return () => {
      unsubStudents();
      unsubAttendance();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400 font-mono">INITIALIZING SYSTEM...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white border border-stone-900 p-12 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]"
        >
          <div className="mb-8">
            <h1 className="font-serif italic text-4xl mb-2 text-stone-900">Attendance AI</h1>
            <p className="text-stone-500 font-mono text-xs uppercase tracking-widest">Secure Student Identification System</p>
          </div>
          
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-stone-900 text-white p-4 hover:bg-stone-800 transition-colors font-mono text-sm"
          >
            <LogIn size={18} />
            AUTHENTICATE WITH GOOGLE
          </button>
          
          <div className="mt-8 pt-8 border-t border-stone-100">
            <p className="text-[10px] text-stone-400 font-mono leading-relaxed uppercase">
              Notice: This system uses biometric data processing via Gemini AI. By authenticating, you agree to the processing of visual data for attendance purposes.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-stone-900 font-sans">
      {/* Sidebar / Navigation */}
      <div className="fixed left-0 top-0 h-full w-20 bg-stone-900 flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-10 h-10 bg-white flex items-center justify-center rounded-sm mb-4">
          <span className="font-serif italic font-bold text-xl">A</span>
        </div>
        
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<LayoutDashboard size={20} />} 
          label="DASHBOARD"
        />
        <NavButton 
          active={activeTab === 'camera'} 
          onClick={() => setActiveTab('camera')} 
          icon={<Camera size={20} />} 
          label="SCANNER"
        />
        <NavButton 
          active={activeTab === 'registration'} 
          onClick={() => setActiveTab('registration')} 
          icon={<UserPlus size={20} />} 
          label="ENROLL"
        />
        
        <div className="mt-auto">
          <button 
            onClick={handleLogout}
            className="p-3 text-stone-500 hover:text-white transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="pl-20 min-h-screen">
        {error && (
          <div className="bg-red-500 text-white p-4 flex items-center gap-3 font-mono text-xs">
            <ShieldAlert size={16} />
            {error}
          </div>
        )}

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <AttendanceDashboard students={students} attendance={attendance} />
              </motion.div>
            )}
            
            {activeTab === 'camera' && (
              <motion.div 
                key="camera"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <CameraView students={students} />
              </motion.div>
            )}

            {activeTab === 'registration' && (
              <motion.div 
                key="registration"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <StudentRegistration />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative p-3 transition-all ${active ? 'text-white' : 'text-stone-500 hover:text-stone-300'}`}
    >
      {icon}
      <span className="absolute left-full ml-4 px-2 py-1 bg-stone-800 text-white text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute left-0 top-0 w-1 h-full bg-white"
        />
      )}
    </button>
  );
}
