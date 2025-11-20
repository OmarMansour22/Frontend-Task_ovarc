import React from "react";

const ListItem = ({ active, title, icon }) => {
  const baseClasses =
    "flex items-center border-l-2 px-4 py-3 transition-colors duration-150";
  const activeClasses = active
    ? "border-l-main text-main bg-main/5"
    : "border-l-transparent text-inactive";

  return (
    <div className={`${baseClasses} ${activeClasses}`}>
      <img src={icon} alt="icon" className="w-5 h-5 md:ml-[29px]" />
      {/* Text hidden on small screens, visible from md and up */}
      <p className="ml-3 md:ml-[29px] hidden md:block text-sm">{title}</p>
    </div>
  );
};

export default ListItem;
