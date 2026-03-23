"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";

interface CsvViewProps {
  rawCsv: string;
}

function parseCsv(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = raw.trim().split("\n");
  if (!lines.length) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });

  return { headers, rows };
}

export default function CsvView({ rawCsv }: CsvViewProps) {
  const { headers, rows } = useMemo(() => parseCsv(rawCsv), [rawCsv]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<Record<string, string>>[]>(
    () =>
      headers.map((h) => ({
        accessorKey: h,
        header: h,
        cell: (info) => info.getValue() as string,
      })),
    [headers]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="search"
          placeholder="Filter rows…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            border: "1px solid var(--color-grey-300)",
            borderRadius: "4px",
            fontSize: "0.9375rem",
            width: "260px",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-yellow)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-grey-300)")}
        />
        <span
          style={{
            marginLeft: "1rem",
            fontSize: "0.875rem",
            color: "var(--color-grey-500)",
          }}
        >
          {table.getRowModel().rows.length} of {rows.length} rows
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9375rem",
          }}
        >
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      textAlign: "left",
                      fontWeight: 600,
                      padding: "0.5rem 0.75rem",
                      borderBottom: "2px solid var(--color-grey-300)",
                      background: "var(--color-grey-100)",
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" && " ↑"}
                    {header.column.getIsSorted() === "desc" && " ↓"}
                    {!header.column.getIsSorted() && (
                      <span style={{ opacity: 0.3 }}> ↕</span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                style={{ borderBottom: "1px solid var(--color-grey-300)" }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ padding: "0.5rem 0.75rem" }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
