import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "./components/Layout";
import Loading from "./pages/Loading";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Lazy load components for route-based code splitting
const Home = lazy(() => import("./pages/Home"));
const Stores = lazy(() => import("./pages/Stores"));
const Books = lazy(() => import("./pages/Books"));
const Authors = lazy(() => import("./pages/Authors"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StoreInventory = lazy(() => import("./pages/StoreInventory"));
const BrowseBooks = lazy(() => import("./pages/BrowseBooks"));
const BrowseAuthors = lazy(() => import("./pages/BrowseAuthors"));
const BrowseStores = lazy(() => import("./pages/BrowseStores"));
function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/books" element={<Books />} />
            <Route path="/author" element={<Authors />} />
            <Route path="/store/:storeId" element={<StoreInventory />} />
            <Route path="/browsebooks" element={<BrowseBooks />} />
            <Route path="/browseauthors" element={<BrowseAuthors />} />
            <Route path="/browsestores" element={<BrowseStores />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
