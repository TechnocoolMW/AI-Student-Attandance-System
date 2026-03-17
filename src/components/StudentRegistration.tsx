import React, { useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, UserPlus, Check, Loader2, X } from 'lucide-react';

export default function StudentRegistration() {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCapture = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setIsCapturing(false);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg'));
      stopCamera();
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !studentId || !photo) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'students'), {
        name,
        studentId,
        photoUrl: photo, // In a real app, upload to Storage. For this demo, we store base64.
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setName('');
      setStudentId('');
      setPhoto(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Registration error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="border-b border-stone-900 pb-6">
        <h2 className="font-serif italic text-3xl text-stone-900">Student Enrollment</h2>
        <p className="text-stone-500 font-mono text-xs uppercase tracking-widest mt-1">Register new identity in the database</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-stone-900 p-4 font-sans focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Student ID</label>
            <input 
              type="text" 
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full bg-white border border-stone-900 p-4 font-sans focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
              placeholder="e.g. STU-2024-001"
              required
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isSaving || !photo}
              className={`w-full flex items-center justify-center gap-3 p-4 font-mono text-sm transition-all ${
                isSaving || !photo 
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                  : 'bg-stone-900 text-white hover:bg-stone-800 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
              }`}
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : success ? <Check size={18} /> : <UserPlus size={18} />}
              {isSaving ? 'ENROLLING...' : success ? 'ENROLLED SUCCESSFULLY' : 'COMPLETE ENROLLMENT'}
            </button>
          </div>
        </form>

        {/* Photo Capture Section */}
        <div className="space-y-4">
          <label className="font-mono text-[10px] uppercase tracking-widest text-stone-400 block">Reference Identity Photo</label>
          
          <div className="aspect-square bg-stone-100 border border-stone-900 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden flex items-center justify-center">
            {photo ? (
              <>
                <img src={photo} alt="Preview" className="w-full h-full object-cover grayscale" />
                <button 
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 bg-stone-900 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </>
            ) : isCapturing ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover grayscale"
              />
            ) : (
              <div className="text-center p-8">
                <Camera size={48} className="mx-auto mb-4 text-stone-300" />
                <p className="font-mono text-[10px] text-stone-400 uppercase">Camera Standby</p>
              </div>
            )}
            
            {isCapturing && (
              <div className="absolute bottom-4 left-0 w-full flex justify-center">
                <button 
                  onClick={takePhoto}
                  className="bg-white border border-stone-900 px-6 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
                >
                  Capture Reference
                </button>
              </div>
            )}
          </div>

          {!photo && !isCapturing && (
            <button 
              onClick={startCapture}
              className="w-full border border-stone-900 p-4 font-mono text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={14} />
              Initialize Camera for Capture
            </button>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
          
          <p className="text-[10px] font-mono text-stone-400 uppercase leading-relaxed mt-4 italic">
            Note: The reference photo is used by Gemini AI to match faces during scanning. Ensure the face is clear and well-lit.
          </p>
        </div>
      </div>
    </div>
  );
}
