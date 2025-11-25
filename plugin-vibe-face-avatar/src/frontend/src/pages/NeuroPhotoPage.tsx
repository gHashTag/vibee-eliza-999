import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Image as ImageIcon, Download, ChevronUp, X, Loader2 } from 'lucide-react';

interface UserModel {
  id: string;
  name: string;
  trigger_word: string;
  url: string;
  gender?: string;
  created_at: string;
}

export const NeuroPhotoPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [userModels, setUserModels] = useState<UserModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('flux-schnell');
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('9:16');

  // Load user models from API
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/models?telegram_id=123456');
        const data = await response.json();
        
        if (data.success && data.models) {
          setUserModels(data.models);
          if (data.models.length > 0) {
            setSelectedModel(data.models[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, []);

  const handleGenerate = () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    setIsMobileControlsOpen(false); // Close controls on mobile after submit
    
    setTimeout(() => {
      setGeneratedImages(prev => [
        `https://picsum.photos/seed/${Date.now()}/768/1365`,
        ...prev
      ]);
      setIsGenerating(false);
    }, 3000);
  };

  const aspectRatios = [
    { label: '9:16', value: '9:16', icon: '📱' },
    { label: '1:1', value: '1:1', icon: '⬛' },
    { label: '16:9', value: '16:9', icon: '📺' },
  ];

  const selectedModelData = userModels.find(m => m.id === selectedModel);

  return (
    <div className="min-h-screen pb-safe">
      {/* Header - Mobile Optimized */}
      <div className="text-center mb-6 md:mb-12 px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-6xl font-bold mb-2 md:mb-4"
        >
          NEURO <span className="text-quantum-yellow neon-text">PHOTO</span>
        </motion.h1>
        <p className="text-gray-400 text-sm md:text-lg">
          Generate reality-bending images using your Digital Body.
        </p>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {/* Controls - Desktop */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="glass-panel p-6 sticky top-4">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="text-quantum-yellow" />
              Prompt Engineering
            </h3>
            
            <div className="space-y-4">
              {/* Prompt Textarea */}
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Description</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="cyberpunk samurai in neon rain..."
                  className="w-full bg-black/50 border border-gray-800 rounded-lg p-4 text-white focus:border-quantum-yellow focus:ring-2 focus:ring-quantum-yellow/20 outline-none transition-all min-h-[120px] resize-none"
                  rows={5}
                />
              </div>

              {/* Model Select */}
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Model</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-white outline-none hover:border-gray-700 transition-colors"
                  disabled={isLoadingModels}
                >
                  {isLoadingModels ? (
                    <option>Loading models...</option>
                  ) : (
                    <>
                      {userModels.length > 0 && (
                        <optgroup label="🎭 My Digital Bodies">
                          {userModels.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name} ({model.trigger_word})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="⚡ Standard Models">
                        <option value="flux-schnell">Flux Schnell (Fast)</option>
                        <option value="sdxl">SDXL (Legacy)</option>
                      </optgroup>
                    </>
                  )}
                </select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {aspectRatios.map(ratio => (
                    <button
                      key={ratio.value}
                      onClick={() => setSelectedAspectRatio(ratio.value)}
                      className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                        selectedAspectRatio === ratio.value
                          ? 'border-quantum-yellow bg-quantum-yellow/10 text-quantum-yellow'
                          : 'border-gray-800 bg-black/30 text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-xl mb-1">{ratio.icon}</div>
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!prompt || isGenerating}
                className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  !prompt || isGenerating
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-quantum-yellow text-black hover:bg-quantum-accent hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] active:scale-95'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    GENERATE
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Gallery - Desktop */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="glass-panel p-6 min-h-[600px]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ImageIcon className="text-quantum-yellow" />
              Output Stream
            </h3>

            {generatedImages.length === 0 ? (
              <div className="h-[500px] flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-xl">
                <Sparkles className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">Quantum field empty. Initiate generation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((img, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group rounded-xl overflow-hidden aspect-[9/16] border border-gray-800"
                  >
                    <img src={img} alt={`Generated ${idx}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                      <button className="p-3 bg-white/10 rounded-full hover:bg-quantum-yellow hover:text-black transition-colors">
                        <Download className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden px-6 pb-32">
        {/* Gallery - Mobile (Full Width) */}
        <div className="space-y-6">
          {generatedImages.length === 0 ? (
            <div className="glass-panel p-8 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-2xl min-h-[400px] mx-2">
              <Sparkles className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-center font-medium">Quantum field empty.<br/>Initiate generation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {generatedImages.map((img, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-2xl overflow-hidden aspect-[9/16] border border-gray-800 shadow-lg"
                >
                  <img src={img} alt={`Generated ${idx}`} className="w-full h-full object-cover" />
                  <button className="absolute bottom-3 right-3 p-3 bg-black/60 rounded-full backdrop-blur-md active:scale-95 transition-transform border border-white/10">
                    <Download className="w-5 h-5 text-quantum-yellow" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Bottom Sheet Toggle */}
        <button
          onClick={() => setIsMobileControlsOpen(!isMobileControlsOpen)}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-quantum-yellow text-black px-6 py-4 rounded-full shadow-lg font-bold flex items-center gap-3 active:scale-95 transition-transform"
        >
          <Sparkles className="w-5 h-5" />
          {isMobileControlsOpen ? 'Close' : 'Generate Image'}
          <ChevronUp className={`w-5 h-5 transition-transform ${isMobileControlsOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Mobile Bottom Sheet */}
        <AnimatePresence>
          {isMobileControlsOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileControlsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />

              {/* Bottom Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-auto"
              >
                {/* Handle */}
                <div className="sticky top-0 bg-gray-900 pt-3 pb-2 flex justify-center">
                  <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
                </div>

                <div className="p-6 space-y-6">
                  {/* Title */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Sparkles className="text-quantum-yellow" />
                      Create Image
                    </h3>
                    <button
                      onClick={() => setIsMobileControlsOpen(false)}
                      className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">What do you want to create?</label>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="cyberpunk samurai in neon rain..."
                      className="w-full bg-black/50 border-2 border-gray-800 rounded-2xl p-4 text-white text-lg focus:border-quantum-yellow focus:ring-0 outline-none transition-all min-h-[120px] resize-none"
                      rows={4}
                      autoFocus
                    />
                  </div>

                  {/* Model Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Select Model</label>
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-black/50 border-2 border-gray-800 rounded-2xl p-4 text-white text-lg outline-none"
                      disabled={isLoadingModels}
                    >
                      {isLoadingModels ? (
                        <option>Loading models...</option>
                      ) : (
                        <>
                          {userModels.length > 0 && (
                            <optgroup label="🎭 My Digital Bodies">
                              {userModels.map(model => (
                                <option key={model.id} value={model.id}>
                                  {model.name} ({model.trigger_word})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="⚡ Standard Models">
                            <option value="flux-schnell">Flux Schnell (Fast)</option>
                            <option value="sdxl">SDXL (Legacy)</option>
                          </optgroup>
                        </>
                      )}
                    </select>
                    {selectedModelData && (
                      <p className="mt-2 text-xs text-gray-500">
                        Trigger: <span className="text-quantum-yellow font-mono">{selectedModelData.trigger_word}</span>
                      </p>
                    )}
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-3">
                      {aspectRatios.map(ratio => (
                        <button
                          key={ratio.value}
                          onClick={() => setSelectedAspectRatio(ratio.value)}
                          className={`p-4 border-2 rounded-2xl text-sm font-medium transition-all active:scale-95 ${
                            selectedAspectRatio === ratio.value
                              ? 'border-quantum-yellow bg-quantum-yellow/10 text-quantum-yellow'
                              : 'border-gray-800 bg-black/30 text-gray-400'
                          }`}
                        >
                          <div className="text-2xl mb-1">{ratio.icon}</div>
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt || isGenerating}
                    className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                      !prompt || isGenerating
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-quantum-yellow text-black active:scale-95 shadow-[0_0_30px_rgba(255,215,0,0.3)]'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="w-6 h-6" />
                        GENERATE IMAGE
                      </>
                    )}
                  </button>

                  {/* Safe area padding for iOS */}
                  <div className="h-safe" />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
