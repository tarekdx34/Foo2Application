import { RouterProvider } from "react-router";
import { GameProvider } from "./context/GameContext";
import { router } from "./routes";

function App() {
  return (
    <GameProvider>
      <RouterProvider router={router} />
    </GameProvider>
  );
}

export default App;
