import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ReaderPage } from './pages/ReaderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/read/:id" element={<ReaderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
