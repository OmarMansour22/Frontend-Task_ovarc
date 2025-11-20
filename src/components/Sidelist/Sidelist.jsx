import React from "react";
import logo from "../../assets/logo.svg";
import { NavLink, useLocation } from "react-router-dom";
import ListItem from "./ListItem";
import shopIcon from "../../assets/shop.jpg";
import storeIcon from "../../assets/Bookstore.svg";
import authorIcon from "../../assets/Featherpen.svg";
import bookIcon from "../../assets/Book.svg";

const Sidelist = () => {
  const location = useLocation();
  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-white border-r border-gray-100 w-16 md:w-[248px]">
      {/* Logo: hide on very small screens, show from md and up */}
      <div className="hidden md:flex items-center h-36">
        <img src={logo} alt="logo" className="ml-[29px] mt-[51px]" />
      </div>

      <ul className="flex-1 flex flex-col items-center md:items-start gap-2 md:gap-4 mt-4 md:mt-0">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "w-full" : "w-full")}
        >
          <ListItem active={isActivePath("/")} title="Shop" icon={shopIcon} />
        </NavLink>

        <NavLink
          to="/stores"
          className={({ isActive }) => (isActive ? "w-full" : "w-full")}
        >
          <ListItem
            active={isActivePath("/stores")}
            title="Stores"
            icon={storeIcon}
          />
        </NavLink>

        <NavLink
          to="/author"
          className={({ isActive }) => (isActive ? "w-full" : "w-full")}
        >
          <ListItem
            active={isActivePath("/author")}
            title="Author"
            icon={authorIcon}
          />
        </NavLink>

        <NavLink
          to="/books"
          className={({ isActive }) => (isActive ? "w-full" : "w-full")}
        >
          <ListItem
            active={isActivePath("/books")}
            title="Books"
            icon={bookIcon}
          />
        </NavLink>
      </ul>
    </div>
  );
};

export default Sidelist;
