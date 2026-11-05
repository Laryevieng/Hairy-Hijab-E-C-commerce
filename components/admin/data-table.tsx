import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/product/pagination'
import { cn } from '@/lib/utils/cn'

export interface ColumnDef<TData> {
  header: React.ReactNode
  accessorKey?: keyof TData | string
  cell?: (item: TData, index: number) => React.ReactNode
  className?: string
  headClassName?: string
}

export interface DataTablePaginationProps {
  page: number
  pageSize: number
  count: number
  pathname: string
  searchParams: string
  ariaLabel?: string
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
  emptyMessage?: string
  pagination?: DataTablePaginationProps
  className?: string
  keyExtractor?: (item: TData, index: number) => string | number
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Tidak ada data yang ditemukan.',
  pagination,
  className,
  keyExtractor,
}: DataTableProps<TData>) {
  const getKey = (item: TData, index: number): string | number => {
    if (keyExtractor) return keyExtractor(item, index)
    if (typeof item === 'object' && item !== null && 'id' in item) {
      return String((item as { id: unknown }).id)
    }
    return index
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-md border border-sand bg-ivory overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-sand/20">
            <TableRow className="border-b border-sand hover:bg-transparent">
              {columns.map((column, colIdx) => (
                <TableHead
                  key={colIdx}
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wider text-espresso/80 h-11 px-4',
                    column.headClassName || column.className
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <TableRow key={`skeleton-${rowIdx}`} className="border-b border-sand/40">
                  {columns.map((col, colIdx) => (
                    <TableCell key={`col-${colIdx}`} className={cn('p-4', col.className)}>
                      <Skeleton className="h-4 w-full max-w-[120px] bg-sand/40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((item, rowIdx) => (
                <TableRow
                  key={getKey(item, rowIdx)}
                  className="border-b border-sand/40 hover:bg-sand/15 transition-colors"
                >
                  {columns.map((column, colIdx) => {
                    const content = column.cell
                      ? column.cell(item, rowIdx)
                      : column.accessorKey && typeof item === 'object' && item !== null
                      ? String((item as Record<string, unknown>)[column.accessorKey as string] ?? '')
                      : null

                    return (
                      <TableCell
                        key={colIdx}
                        className={cn('p-4 text-sm text-espresso align-middle', column.className)}
                      >
                        {content}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              // Empty State
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-espresso/70 p-6"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Server-Side Pagination */}
      {pagination && pagination.count > 0 && (
        <div className="pt-2">
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            count={pagination.count}
            pathname={pagination.pathname}
            searchParams={pagination.searchParams}
            ariaLabel={pagination.ariaLabel || 'Navigasi halaman tabel'}
          />
        </div>
      )}
    </div>
  )
}
