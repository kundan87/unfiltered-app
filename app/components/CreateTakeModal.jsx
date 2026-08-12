// components/CreateTakeModal.jsx
import { useState, useRef } from 'react';

export default function CreateTakeModal() {
  const [mediaFile, setMediaFile] = useState(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  return (
    <div className="bg-slate-900 text-white p-4 rounded-xl">
      {/* Choice Buttons */}
      <div className="flex gap-3 my-3">
        {/* Gallery Option */}
        <button 
          onClick={() => galleryInputRef.current.click()}
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-2 text-sm"
        >
          📁 Choose from Gallery
        </button>

        {/* Live Camera Record Option */}
        <button 
          onClick={() => cameraInputRef.current.click()}
          className="bg-red-600/20 text-red-400 hover:bg-red-600/30 px-4 py-2 rounded-lg border border-red-500/30 flex items-center gap-2 text-sm"
        >
          📷 Record Live Camera
        </button>
      </div>

      {/* Hidden File Inputs */}
      {/* 1. Gallery Input */}
      <input 
        type="file" 
        ref={galleryInputRef} 
        accept="image/*,video/*" 
        className="hidden" 
        onChange={(e) => setMediaFile(e.target.files[0])}
      />

      {/* 2. Direct Camera Trigger */}
      <input 
        type="file" 
        ref={cameraInputRef} 
        accept="image/*,video/*" 
        capture="user" // Open directly native device camera
        className="hidden" 
        onChange={(e) => setMediaFile(e.target.files[0])}
      />
    </div>
  );
}