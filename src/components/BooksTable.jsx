// src/components/BooksTable.jsx
import React, { useMemo } from "react";
import Table from "./Table/Table";
import TableActions from "./ActionButton/TableActions";

const BooksTable = ({
  books,
  authors,
  onEdit, // function(book)
  onDelete, // function(book)
  columnsConfig = [
    "id",
    "name",
    "isbn",
    "language",
    "pages",
    "format",
    "author",
    "actions",
  ],
}) => {
  // Map author_id -> "First Last"
  const authorMap = useMemo(() => {
    return authors.reduce((map, author) => {
      map[author.id] = `${author.first_name} ${author.last_name}`;
      return map;
    }, {});
  }, [authors]);

  // Enrich books with author_name
  const enrichedBooks = useMemo(
    () =>
      books.map((book) => ({
        ...book,
        author_name: authorMap[book.author_id] || "Unknown Author",
      })),
    [books, authorMap]
  );

  // All possible columns
  const allColumns = useMemo(
    () => ({
      id: { header: "Book Id", accessorKey: "id" },
      name: { header: "Name", accessorKey: "name" },
      isbn: { header: "ISBN", accessorKey: "isbn" },
      language: { header: "Language", accessorKey: "language" },
      pages: { header: "Pages", accessorKey: "page_count" },
      format: { header: "Format", accessorKey: "format" },
      author: { header: "Author", accessorKey: "author_name" },
      actions: {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => (
          <TableActions
            row={row}
            onEdit={() => onEdit(row.original)}
            onDelete={() => onDelete(row.original)}
          />
        ),
      },
    }),
    [onEdit, onDelete]
  );

  // Pick only requested columns
  const columns = useMemo(
    () => columnsConfig.map((key) => allColumns[key]).filter(Boolean),
    [columnsConfig, allColumns]
  );

  return <Table data={enrichedBooks} columns={columns} />;
};

export default BooksTable;
