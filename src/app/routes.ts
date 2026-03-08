import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Settings } from "./pages/Settings";
import { Game } from "./pages/Game";
import { Results } from "./pages/Results";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/settings",
    Component: Settings,
  },
  {
    path: "/game",
    Component: Game,
  },
  {
    path: "/results",
    Component: Results,
  },
]);
