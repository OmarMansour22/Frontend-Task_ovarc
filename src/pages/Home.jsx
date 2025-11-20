// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import Loading from "../pages/Loading";
import StoreCard from "../components/Cards/StoreCard";
import BookCard from "../components/Cards/BookCard";
import AuthorCard from "../components/Cards/AuthorCard";
import useLibraryData from "../hooks/useLibraryData";

const Home = () => {
  const { stores, authors, books, inventory, isLoading } = useLibraryData();

  // Stores + metrics (first 5)
  const storesWithMetrics = React.useMemo(() => {
    if (!stores || !inventory) return [];

    return stores.slice(0, 5).map((store) => {
      const storeInventory = inventory.filter(
        (item) => String(item.store_id) === String(store.id)
      );

      const noOfBooks = storeInventory.length;
      const totalPrice = storeInventory.reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0
      );
      const averagePrice = noOfBooks > 0 ? totalPrice / noOfBooks : 0;

      return {
        id: store.id,
        name: store.name,
        noOfBooks,
        averagePrice,
      };
    });
  }, [stores, inventory]);

  // Books + author name + list of store names (first 5)
  const booksWithDetails = React.useMemo(() => {
    if (!books || !authors || !stores || !inventory) return [];

    return books.map((book) => {
      const author = authors.find(
        (a) => String(a.id) === String(book.author_id)
      );

      const bookInventory = inventory.filter(
        (item) => String(item.book_id) === String(book.id)
      );

      const uniqueStoreIds = [
        ...new Set(bookInventory.map((item) => item.store_id)),
      ];

      const bookStores = uniqueStoreIds
        .map((storeId) => {
          const store = stores.find((s) => String(s.id) === String(storeId));
          return store ? store.name : `Store ${storeId}`;
        })
        .filter(Boolean);

      return {
        id: book.id,
        title: book.name, // your updated field
        author: author
          ? `${author.first_name} ${author.last_name}`
          : "Unknown author",
        stores: bookStores,
      };
    });
  }, [books, authors, stores, inventory]);

  const limitedBooksWithStores = booksWithDetails.slice(0, 5);

  // Authors + number of books (first 5)
  const authorsWithBookCount = React.useMemo(() => {
    if (!authors || !books) return [];

    return authors.slice(0, 5).map((author) => {
      const noOfBooks = books.filter(
        (book) => String(book.author_id) === String(author.id)
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
      {/* Stores Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Stores</h2>
          <Link
            to="/browsestores"
            className="bg-main text-white px-4 py-2 rounded-md hover:bg-main/90 transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4">
          {storesWithMetrics.map((store) => (
            <div key={store.id} className="flex-shrink-0">
              <StoreCard
                id={store.id}
                name={store.name}
                noOfBooks={store.noOfBooks}
                averagePrice={store.averagePrice}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Books Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Books</h2>
          <Link
            to="/browsebooks"
            className="bg-main text-white px-4 py-2 rounded-md hover:bg-main/90 transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4">
          {limitedBooksWithStores.map((book) => (
            <div key={book.id} className="flex-shrink-0">
              <BookCard
                title={book.title}
                author={book.author}
                stores={book.stores}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Authors Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Authors</h2>
          <Link
            to="/browseauthors"
            className="bg-main text-white px-4 py-2 rounded-md hover:bg-main/90 transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4">
          {authorsWithBookCount.map((author, index) => (
            <div key={index} className="flex-shrink-0">
              <AuthorCard name={author.name} noOfBooks={author.noOfBooks} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
