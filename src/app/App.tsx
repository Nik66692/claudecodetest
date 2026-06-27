import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/ui';
import { AppShell } from './AppShell';
import { LibraryPage } from '@/features/library/LibraryPage';
import { EditorPage } from '@/features/editor/EditorPage';
import { AnalysisPage } from '@/features/editor/AnalysisPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { NotFoundPage } from './NotFoundPage';

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/decks/:deckId" element={<EditorPage />} />
            <Route path="/decks/:deckId/analysis" element={<AnalysisPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
