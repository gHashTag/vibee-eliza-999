import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuantumLayout } from './components/QuantumLayout';
import { DigitalBodyPage } from './pages/DigitalBodyPage';
import { NeuroPhotoPage } from './pages/NeuroPhotoPage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <Router>
      <QuantumLayout>
        <Routes>
          <Route path="/" element={<DigitalBodyPage />} />
          <Route path="/neurophoto" element={<NeuroPhotoPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </QuantumLayout>
    </Router>
  );
}

export default App;
