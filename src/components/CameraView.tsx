import React, { useRef, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Student } from '../types';
import { identifyStudent } from '../services/gemini';
import { Camera, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  students: Student[];
}

export default function CameraView({ students }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{ name: string; status: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameBase64 = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const { studentId, confidence } = await identifyStudent(frameBase64, students);

      if (studentId && confidence > 0.6) {
        const student = students.find(s => s.studentId === studentId);
        if (student) {
          await logAttendance(student);
          setLastResult({ name: student.name, status: 'Success' });
        } else {
          setLastResult({ name: 'Unknown Student', status: 'Failed' });
        }
      } else {
        setLastResult({ name: 'No Match Found', status: 'Failed' });
      }
    } catch (err) {
      console.error("Identification process error:", err);
    } finally {
      setIsProcessing(false);
      // Reset result after 3 seconds
      setTimeout(() => setLastResult(null), 3000);
    }
  };

  const logAttendance = async (student: Student) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Check if already logged today
    const q = query(
      collection(db, 'attendance'), 
      where('studentId', '==', student.studentId),
      where('date', '==', today)
    );
    const existing = await getDocs(q);
    
    if (existing.empty) {
      const now = new Date();
      const status = now.getHours() >= 9 ? 'Late' : 'Present'; // Example logic: late after 9 AM
      
      await addDoc(collection(db, 'attendance'), {
        studentId: student.studentId,
        name: student.name,
        date: today,
        timestamp: serverTimestamp(),
        status
      });
    }
  };

  // Auto-scan loop
  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(captureAndIdentify, 5000);
    }
    return () => clearInterval(interval);
  }, [isScanning, students]);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end border-b border-stone-900 pb-6">
        <div>
          <h2 className="font-serif italic text-3xl text-stone-900">AI Scanner</h2>
          <p className="text-stone-500 font-mono text-xs uppercase tracking-widest mt-1">Automated face recognition active</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsScanning(!isScanning)}
            className={`flex items-center gap-2 px-6 py-2 font-mono text-xs transition-all ${
              isScanning 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            {isScanning ? <RefreshCw className="animate-spin" size={14} /> : <Camera size={14} />}
            {isScanning ? 'STOP SCANNING' : 'START AUTO-SCAN'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Feed */}
        <div className="lg:col-span-2">
          <div className="relative bg-stone-900 border border-stone-900 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] aspect-video overflow-hidden">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-500 p-8 text-center">
                <XCircle size={48} className="mb-4 opacity-20" />
                <p className="font-mono text-xs uppercase tracking-widest">{error}</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover grayscale opacity-80"
                />
                <div className="absolute inset-0 border-[40px] border-stone-900/20 pointer-events-none" />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-stone-900/80 text-white px-3 py-1 rounded-sm">
                  <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-red-500 animate-pulse' : 'bg-stone-500'}`} />
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    {isScanning ? 'Live Feed • Scanning' : 'Standby'}
                  </span>
                </div>
                
                {/* Scanning Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30 animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                )}

                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="text-white animate-spin" size={32} />
                      <span className="text-white font-mono text-[10px] uppercase tracking-widest">Analyzing Frame...</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Status Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-900 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h3 className="font-serif italic text-xl mb-4">Recognition Status</h3>
            
            <div className="space-y-4">
              {lastResult ? (
                <div className={`p-4 border ${lastResult.status === 'Success' ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'} flex items-center gap-4`}>
                  {lastResult.status === 'Success' ? (
                    <CheckCircle2 className="text-emerald-500" size={24} />
                  ) : (
                    <XCircle className="text-red-500" size={24} />
                  )}
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tight">{lastResult.name}</p>
                    <p className="text-[10px] font-mono text-stone-500 uppercase">{lastResult.status}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-stone-200 text-center text-stone-400 font-mono text-[10px] uppercase">
                  {isScanning ? 'Waiting for face detection...' : 'System Idle'}
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-stone-100">
              <h4 className="font-mono text-[10px] uppercase text-stone-400 mb-4 tracking-widest">Instructions</h4>
              <ul className="space-y-3 text-[10px] font-mono text-stone-600 uppercase leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-stone-900 font-bold">01.</span>
                  Ensure student is facing the camera directly.
                </li>
                <li className="flex gap-2">
                  <span className="text-stone-900 font-bold">02.</span>
                  Maintain good lighting on the face.
                </li>
                <li className="flex gap-2">
                  <span className="text-stone-900 font-bold">03.</span>
                  System scans every 5 seconds when active.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}} />
    </div>
  );
}
