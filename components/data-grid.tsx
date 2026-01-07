"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface DataGridProps {
  data: any[];
  onChange?: (next: any[]) => void;
  editable?: boolean;
  pageSize?: number;
}

export function DataGrid({ data, onChange, editable = true, pageSize = 50 }: DataGridProps) {
  const [page, setPage] = React.useState(1);
  const total = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const visibleRows = (data ?? []).slice(start, end);
  if (!data || total === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>;
  }

  const columnSet = new Set<string>();
  for (const row of data) {
    Object.keys(row || {}).forEach((k) => columnSet.add(k));
  }
  const columns = Array.from(columnSet);

  const updateCell = (rowIndex: number, col: string, value: string) => {
    if (!onChange) return;
    const next = [...data];
    next[rowIndex] = { ...next[rowIndex], [col]: value };
    onChange(next);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b text-xs">
        <div className="text-muted-foreground">
          Showing {start + 1}-{end} of {total}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
          <span className="min-w-[80px] text-center">{page}/{totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-card border">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 bg-secondary">
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="min-w-[160px] p-2 text-sm border-b">
                {col}
              </TableHead>
            ))}
          </TableRow>
          </TableHeader>
          <TableBody className="divide-y">
            {visibleRows.map((row, i) => (
            <TableRow key={start + i}>
              {columns.map((col) => (
                <TableCell key={`${start + i}-${col}`} className="p-2 align-top whitespace-normal break-all border-r max-w-[260px]">
                  {editable ? (
                    <input
                      className="w-full px-2 py-1 text-sm leading-6 bg-transparent outline-none overflow-x-auto"
                      value={(row?.[col] ?? "").toString()}
                      onChange={(e) => updateCell(start + i, col, e.target.value)}
                    />
                  ) : (
                    (row?.[col] ?? "").toString()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
