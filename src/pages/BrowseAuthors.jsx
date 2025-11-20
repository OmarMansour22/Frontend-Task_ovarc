import React from "react";
import Loading from "../pages/Loading";
import AuthorCard from "../components/Cards/AuthorCard";
import useLibraryData from "../hooks/useLibraryData";

const BrowseAuthors = () => {
  const { authors, books, isLoading } = useLibraryData();

  // Calculate the number of books per author
  const authorsWithBookCount = React.useMemo(() => {
    return authors.map((author) => {
      const noOfBooks = books.filter(
        (book) => book.author_id === author.id
      ).length;
      return {
        name: `${author.first_name} ${author.last_name}`,
        noOfBooks,
      };
    });
  }, [authors, books]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="py-6 px-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Browse All Authors
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {authorsWithBookCount.map((author, index) => (
          <AuthorCard
            key={index}
            name={author.name}
            noOfBooks={author.noOfBooks}
          />
        ))}
      </div>
    </div>
  );
};

export default BrowseAuthors;
