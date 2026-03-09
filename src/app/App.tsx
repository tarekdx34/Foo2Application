import { RouterProvider } from "react-router";
import { GameProvider } from "./context/GameContext";
import { router } from "./routes";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <GameProvider>
      <RouterProvider router={router} />
      <Analytics />
    </GameProvider>
  );
}

export default App;
