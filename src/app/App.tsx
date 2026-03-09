import { RouterProvider } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { GameProvider } from './context/GameContext';
import { router } from './routes';

function App() {
  return (
    <GameProvider>
      <RouterProvider router={router} />
      <Analytics />
    </GameProvider>
  );
}

export default App;
