import { Toaster } from 'sonner';
import HomePage from '@/pages/HomePage';
import { useTheme } from '@/hooks/useTheme';

export default function App() {
  const { theme } = useTheme();

  return (
    <>
      <HomePage />
      <Toaster theme={theme} position="top-right" richColors closeButton />
    </>
  );
}
