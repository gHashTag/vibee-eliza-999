import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Zap, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export const DigitalBodyPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [modelName, setModelName] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'training' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [triggerWord, setTriggerWord] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      // Auto-generate model name suggestion if empty
      if (!modelName) {
        const timestamp = new Date().toISOString().split('T')[0];
        setModelName(`My Digital Body ${timestamp}`);
      }
    }
  };

  const generateTriggerWord = (name: string): string => {
    // Generate unique trigger word from model name
    const sanitized = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${sanitized}_${random}`;
  };

  const startTraining = async () => {
    if (files.length < 5 || !modelName.trim()) {
      setErrorMessage('Please provide at least 5 photos and a model name');
      return;
    }
    
    try {
      setIsTraining(true);
      setStatus('uploading');
      setErrorMessage('');

      // 1. Generate trigger word
      const generatedTrigger = generateTriggerWord(modelName);
      setTriggerWord(generatedTrigger);

      // 2. Upload photos to backend (REAL upload now!)
      setProgress(5);
      console.log(`[Frontend] Uploading ${files.length} photos...`);

      const formData = new FormData();
      files.forEach(file => formData.append('photos', file));
      // TODO: Get telegram_id from auth context or session
      const telegramId = localStorage.getItem('telegram_id') || '123456';
      formData.append('telegram_id', telegramId);

      const uploadRes = await fetch('http://localhost:3001/api/upload-photos', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Photo upload failed');
      }

      const uploadData = await uploadRes.json();
      const photoUrls = uploadData.photo_urls;
      
      console.log(`[Frontend] Uploaded ${photoUrls.length} photos successfully`);
      setProgress(30);
      setStatus('training');

      // 3. Start training via API (Replicate/Fal.ai)
      const response = await fetch('http://localhost:3001/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: localStorage.getItem('telegram_id') || '123456',
          model_name: modelName,
          trigger_word: generatedTrigger,
          photo_urls: photoUrls,
          gender: 'person', // TODO: Add gender selection UI
        }),
      });

      if (!response.ok) {
        throw new Error('Training failed');
      }

      const data = await response.json();
      
      // 4. Poll for training status
      const modelId = data.model_id;
      
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`http://localhost:3001/api/train/status/${modelId}`);
        const statusData = await statusRes.json();
        
        if (statusData.status === 'completed') {
          clearInterval(pollInterval);
          setProgress(100);
          setStatus('completed');
          setIsTraining(false);
        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          setStatus('error');
          setErrorMessage('Training failed. Please try again.');
          setIsTraining(false);
        } else {
          // Update progress based on training progress
          setProgress(30 + (statusData.progress || 0) * 0.7);
        }
      }, 5000);

    } catch (error: any) {
      console.error('Training error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to start training');
      setIsTraining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold mb-4"
        >
          DIGITAL <span className="text-quantum-yellow neon-text">BODY</span>
        </motion.h1>
        <p className="text-gray-400 text-lg">
          Upload your photos to train your personal neural model.
          <br />
          <span className="text-quantum-yellow/60">Minimum 10 photos required for best results.</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-8 flex flex-col min-h-[500px] border-2 border-dashed border-quantum-gray hover:border-quantum-yellow/50 transition-colors"
        >
          {/* Model Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-quantum-yellow mb-2">
              Model Name *
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., My Portrait 2025"
              className="w-full px-4 py-3 bg-black/50 border border-quantum-gray rounded-xl text-white placeholder-gray-600 focus:border-quantum-yellow focus:outline-none transition-colors"
              disabled={isTraining || status === 'completed'}
            />
          </div>

          {/* File Upload */}
          <input 
            type="file" 
            multiple 
            accept="image/*"
            onChange={handleFileChange}
            className="hidden" 
            id="file-upload"
            disabled={isTraining || status === 'completed'}
          />
          <label 
            htmlFor="file-upload" 
            className={`cursor-pointer flex flex-col items-center flex-1 justify-center border-2 border-dashed rounded-xl transition-all ${
              isTraining || status === 'completed' 
                ? 'border-gray-800 opacity-50 cursor-not-allowed' 
                : 'border-quantum-gray hover:border-quantum-yellow'
            }`}
          >
            <div className="w-20 h-20 rounded-full bg-quantum-yellow/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-10 h-10 text-quantum-yellow" />
            </div>
            <h3 className="text-xl font-bold mb-2">Upload Photos</h3>
            <p className="text-gray-500 text-center mb-4">
              Drag & drop or click to select
            </p>
            {files.length > 0 && (
              <div className="px-4 py-2 bg-quantum-yellow/20 rounded-full text-quantum-yellow text-sm font-mono">
                {files.length} photos selected
              </div>
            )}
          </label>

          {triggerWord && (
            <div className="mt-4 p-3 bg-quantum-yellow/10 border border-quantum-yellow/30 rounded-xl">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-quantum-yellow" />
                <span className="text-gray-400">Trigger Word:</span>
                <code className="text-quantum-yellow font-mono font-bold">{triggerWord}</code>
              </div>
            </div>
          )}
        </motion.div>

        {/* Status Section */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-8 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Zap className="text-quantum-yellow" />
              Training Status
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${files.length >= 5 ? 'bg-green-500/20 text-green-500' : 'bg-gray-800 text-gray-600'}`}>
                  1
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">Photos Uploaded</div>
                  <div className="text-xs text-gray-500">{files.length} / 10 recommended</div>
                </div>
                {files.length >= 5 && <Check className="w-5 h-5 text-green-500" />}
              </div>

              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'training' || status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-gray-800 text-gray-600'}`}>
                  2
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">Neural Processing</div>
                  <div className="text-xs text-gray-500">Training LoRA model</div>
                </div>
                {status === 'training' && <Loader2 className="w-5 h-5 text-quantum-yellow animate-spin" />}
                {status === 'completed' && <Check className="w-5 h-5 text-green-500" />}
              </div>

              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-gray-800 text-gray-600'}`}>
                  3
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">Ready to Generate</div>
                  <div className="text-xs text-gray-500">Available in NeuroPhoto</div>
                </div>
                {status === 'completed' && <Check className="w-5 h-5 text-green-500" />}
              </div>
            </div>
          </div>

          {status === 'training' && (
            <div className="mt-8">
              <div className="flex justify-between text-xs text-quantum-yellow mb-2">
                <span>PROCESSING...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-quantum-yellow shadow-[0_0_10px_#FFD700]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          <button
            onClick={startTraining}
            disabled={files.length < 5 || !modelName.trim() || isTraining || status === 'completed'}
            className={`w-full py-4 rounded-xl font-bold text-lg tracking-wider transition-all mt-8 ${
              files.length < 5 || !modelName.trim() || isTraining || status === 'completed'
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-quantum-yellow text-black hover:bg-quantum-accent hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]'
            }`}
          >
            {isTraining ? 'INITIALIZING...' : status === 'completed' ? 'TRAINING COMPLETE' : 'INITIATE SEQUENCE'}
          </button>

          {status === 'completed' && (
            <a
              href="/neurophoto"
              className="w-full py-4 rounded-xl font-bold text-lg tracking-wider transition-all mt-4 bg-quantum-gray/50 text-quantum-yellow border border-quantum-yellow/30 hover:bg-quantum-yellow/10 text-center block"
            >
              GO TO NEUROPHOTO →
            </a>
          )}
        </motion.div>
      </div>
    </div>
  );
};
