import { RouterProvider } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { GameProvider } from './context/GameContext';
import { router } from './routes';

function App() {
  return (
    <GameProvider>
      <RouterProvider router={router} />
      <Analytics />
      <SpeedInsights />
    </GameProvider>
  );
}

export default App;
