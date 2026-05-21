import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { uploadDbcFile } from '../lib/api';
import { useStore } from '../store/useStore';

export const UploadDropzone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setProject = useStore((state) => state.setProject);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.dbc')) {
      alert('Please upload a valid .dbc file');
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await uploadDbcFile(file);
      setProject(data.projectId, data.fileName, data.graph);
    } catch (err) {
      console.error(err);
      alert('Failed to parse DBC file.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <div 
        className={`w-full max-w-2xl p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors duration-200 ease-in-out cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <UploadCloud className="w-16 h-16 text-slate-400 mb-6" />
        <h2 className="text-2xl font-semibold mb-2 text-slate-200">
          Drop your DBC file here
        </h2>
        <p className="text-slate-400 mb-6 text-center max-w-md">
          Upload a .dbc file to interactively explore its ECU communication network and signal structure.
        </p>
        
        <input 
          id="file-upload" 
          type="file" 
          accept=".dbc" 
          className="hidden" 
          onChange={handleFileInput}
        />
        
        <button 
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Browse Files'}
        </button>
      </div>
    </div>
  );
};
