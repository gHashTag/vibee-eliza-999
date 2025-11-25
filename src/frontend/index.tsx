import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import './index.css';
import React, { useState } from 'react';
import type { UUID } from '@elizaos/core';
import FileUpload from './components/FileUpload';
import './components/FileUpload.css';

const queryClient = new QueryClient();

// Define the interface for the ELIZA_CONFIG
interface ElizaConfig {
  agentId: string;
  apiBase: string;
}

// Declare global window extension for TypeScript
declare global {
  interface Window {
    ELIZA_CONFIG?: ElizaConfig;
  }
}

/**
 * Main Example route component
 */
function ExampleRoute() {
  const config = window.ELIZA_CONFIG;
  const agentId = config?.agentId;

  // Apply dark mode to the root element
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  if (!agentId) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 font-medium">Error: Agent ID not found</div>
        <div className="text-sm text-gray-600 mt-2">
          The server should inject the agent ID configuration.
        </div>
      </div>
    );
  }

  return <ExampleProvider agentId={agentId as UUID} />;
}

/**
 * Example provider component
 */
function ExampleProvider({ agentId }: { agentId: UUID }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div>Hello {agentId}</div>
    </QueryClientProvider>
  );
}

// Initialize the application - no router needed for iframe
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<ExampleRoute />);
}

// Define types for integration with agent UI system
export interface AgentPanel {
  name: string;
  path: string;
  component: React.ComponentType<any>;
  icon?: string;
  public?: boolean;
  shortLabel?: string; // Optional short label for mobile
}

interface PanelProps {
  agentId: string;
}

/**
 * Example panel component for the plugin system
 */
const PanelComponent: React.FC<PanelProps> = ({ agentId }) => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileUpload = (fileUrl: string) => {
    setUploadedFiles(prev => [...prev, fileUrl]);
    console.log('📤 Файл загружен:', fileUrl);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', marginBottom: '20px' }}>
        📤 Загрузка файлов
      </h1>

      <div style={{
        background: '#1f2937',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
          Загружайте файлы в Supabase Storage для использования с Instagram плагином.
          Поддерживаются: изображения, видео, документы.
        </p>
      </div>

      <FileUpload agentId={agentId} onUploadComplete={handleFileUpload} />

      {uploadedFiles.length > 0 && (
        <div style={{
          background: '#1f2937',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '24px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '16px' }}>
            Загруженные файлы:
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {uploadedFiles.map((url, index) => (
              <div key={index} style={{
                background: '#374151',
                padding: '12px',
                borderRadius: '8px',
                color: '#10b981',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}>
                <a href={url} target="_blank" rel="noopener noreferrer"
                   style={{ color: '#10b981', textDecoration: 'none' }}>
                  {url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Export the panel configuration for integration with the agent UI
export const panels: AgentPanel[] = [
  {
    name: 'File Upload',
    path: 'file-upload',
    component: PanelComponent,
    icon: 'Upload',
    public: false,
    shortLabel: 'Upload',
  },
];

export * from './utils';
