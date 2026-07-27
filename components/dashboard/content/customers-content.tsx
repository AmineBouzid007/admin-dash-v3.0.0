"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getCustomers } from "@/app/admin/actions";
import { Search, Users, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Customer } from "@/lib/types";

const cardShadow =
  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px";

export function CustomersContent() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    getCustomers()
      .then((result) => {
        if (result.error) {
          setLoadError(result.error);
          toast.error(`Failed to load customers: ${result.error}`);
          return;
        }
        setCustomers(result.data || []);
      })
      .catch((err: any) => {
        const message = err?.message || "Unexpected error while loading customers.";
        console.error("Failed to load customers", err);
        setLoadError(message);
        toast.error(`Failed to load customers: ${message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          search.trim() === "" ||
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.phone?.includes(search) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.city?.toLowerCase().includes(search.toLowerCase())
      ),
    [customers, search]
  );

  const repeatCustomers = customers.filter((c) => c.ordersCount > 1).length;
  const avgSpend = customers.length
    ? Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: cardShadow }}>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total customers</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">{customers.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: cardShadow }}>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Repeat customers</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">{repeatCustomers}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: cardShadow }}>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Avg. spend / customer</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">{avgSpend} TND</p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load customers: {loadError}
        </div>
      )}

      <div className="bg-card rounded-2xl p-4 border border-border" style={{ boxShadow: cardShadow }}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customer, phone, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden" style={{ boxShadow: cardShadow }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total spent</TableHead>
              <TableHead>Last order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.key} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(c)}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                <TableCell className="text-muted-foreground">{c.city}</TableCell>
                <TableCell className="text-right">{c.ordersCount}</TableCell>
                <TableCell className="text-right font-semibold">{c.totalSpent.toFixed(2)} TND</TableCell>
                <TableCell className="text-muted-foreground">{new Date(c.lastOrderDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-1 text-sm text-muted-foreground mb-3">
                <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {selected.phone}</p>
                <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {selected.email}</p>
                <p>{selected.city}, {selected.governorate}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold">{selected.ordersCount}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold">{selected.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Total (TND)</p>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold">{selected.avgOrderValue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Avg (TND)</p>
                </div>
              </div>
              <p className="text-sm font-semibold mb-2">Order history</p>
              <div className="space-y-2">
                {selected.orders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between text-sm border-b border-border pb-2">
                    <div>
                      <p className="font-medium">#{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted-foreground/10 capitalize">{o.status}</span>
                      <span className="font-semibold">{Number(o.total).toFixed(2)} TND</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
