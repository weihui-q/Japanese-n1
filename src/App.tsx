import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { useAppStore } from './store/appStore';
import HomePage from './pages/HomePage';
import WordListPage from './pages/WordListPage';
import GrammarListPage from './pages/GrammarListPage';
import FlashcardPage from './pages/FlashcardPage';
import QuizPage from './pages/QuizPage';
import ProgressPage from './pages/ProgressPage';
import ImportPage from './pages/ImportPage';

function App() {
  const initialize = useAppStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/words" element={<WordListPage />} />
          <Route path="/grammar" element={<GrammarListPage />} />
          <Route path="/flashcard" element={<FlashcardPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/import" element={<ImportPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
