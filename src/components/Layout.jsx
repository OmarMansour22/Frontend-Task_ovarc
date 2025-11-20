import { Outlet } from "react-router-dom";
import Sidelist from "./Sidelist/Sidelist";
import Topbar from "./Topbar";

export default function Layout() {
  return (
    <div className="h-screen flex">
      <Sidelist />
      <main className="h-screen overflow-auto flex-1 bg-background pt-8 px-6">
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
}
