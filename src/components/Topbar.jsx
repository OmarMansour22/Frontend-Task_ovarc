// src/components/Topbar.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import usrImg from "../assets/usr.png";
import { useAuth } from "../context/AuthContext";

const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth(); // 👈 include logout too

  const path = location.pathname;

  const title = {
    "/": { title: "Shop", subtitle: "Shop > Books" },
    "/stores": { title: "Stores", subtitle: "Admin > Stores" },
    "/author": { title: "Authors", subtitle: "Admin > Authors" },
    "/books": { title: "Books", subtitle: "Admin > Books" },
    "/browsebooks": { title: "Browse Books", subtitle: "Shop > Books" },
    "/browseauthors": { title: "Browse Authors", subtitle: "Shop > Authors" },
    "/browsestores": { title: "Browse Stores", subtitle: "Shop > Stores" },
  };

  const current = title[path] || { title: "", subtitle: "" };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  };

  return (
    <div className="h-24 border-b border-b-secondary-text flex justify-between items-center px-2 sm:px-0">
      <div className="flex flex-col justify-start items-start">
        <p className="text-lg text-secondary-text">{current.title}</p>
        <p className="font-light text-secondary-text">{current.subtitle}</p>
      </div>

      <div className="flex-1 flex justify-end items-center">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <img
              src={usrImg}
              alt="profile"
              className="ml-4 rounded w-8 h-8 object-cover"
            />
            <p className="text-secondary-text font-light">
              {user?.name || user?.email || "User"}
            </p>
            <button
              onClick={logout}
              className="ml-2 px-3 py-1 text-xs rounded border border-main text-main hover:bg-main hover:text-white transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleProfileClick}
            className="ml-4 px-4 py-2 text-sm rounded bg-main text-white hover:bg-main/90 transition"
          >
            Sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default Topbar;
