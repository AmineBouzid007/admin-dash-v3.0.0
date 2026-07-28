"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { getCustomRequests, updateCustomRequestStatus, updateCustomRequestPrice } from "@/app/admin/actions";
import { Search, Phone, Mail, Palette } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const cardShadow =
  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px";

const STATUS_OPTIONS = ["new", "reviewing", "quoted", "approved", "in-production", "completed", "rejected"];

export function CustomRequestsContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  async function loadData() {
    try {
      const data = await getCustomRequests();
      setRequests(data || []);
    } catch (err) {
      console.error("Failed to load custom requests", err);
      toast.error("Could not load custom requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q || r.name?.toLowerCase().includes(q) || r.phone?.includes(search) || r.email?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const handleStatusChange = (id: string, status: string) => {
    const prev = requests;
    setRequests(requests.map((r) => (r.id === id ? { ...r, status } : r)));
    startTransition(async () => {
      try {
        await updateCustomRequestStatus(id, status);
        toast.success("Request status updated.");
      } catch (err: any) {
        setRequests(prev);
        toast.error(err.message || "Failed to update status.");
      }
    });
  };

  const handleSavePrice = (id: string) => {
    const price = Number(priceDraft);
    if (Number.isNaN(price)) {
      toast.error("Enter a valid price.");
      return;
    }
    startTransition(async () => {
      try {
        await updateCustomRequestPrice(id, price);
        setRequests(requests.map((r) => (r.id === id ? { ...r, estimated_price: price } : r)));
        toast.success("Estimated price saved.");
      } catch (err: any) {
        toast.error(err.message || "Failed to save price.");
      }
    });
  };

  if (loading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden" style={{ boxShadow: cardShadow }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Est. Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No custom requests found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.phone}</p>
                  </TableCell>
                  <TableCell className="capitalize">{r.product_type}</TableCell>
                  <TableCell>{r.size}</TableCell>
                  <TableCell>{r.estimated_price != null ? `${r.estimated_price} TND` : "—"}</TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(val) => handleStatusChange(r.id, val)}>
                      <SelectTrigger className="h-8 w-36 capitalize"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelected(r);
                        setPriceDraft(r.estimated_price != null ? String(r.estimated_price) : "");
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Palette className="h-4 w-4" /> Custom Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {selected.phone}</p>
                  <p className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {selected.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Product type</p><p className="capitalize font-medium">{selected.product_type}</p></div>
                  <div><p className="text-xs text-muted-foreground">Size</p><p className="font-medium">{selected.size}</p></div>
                  <div><p className="text-xs text-muted-foreground">Frame</p><p className="font-medium">{selected.frame_option || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Requested</p><p className="font-medium">{new Date(selected.created_at).toLocaleDateString()}</p></div>
                </div>
                {selected.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="bg-muted rounded-lg p-3">{selected.notes}</p>
                  </div>
                )}
                {selected.image_url ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Reference image
                    </p>
                
                    <img
                      src={selected.image_url}
                      alt="Customer reference"
                      className="rounded-lg max-h-72 w-full object-contain border"
                    />
                
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={selected.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View full image
                        </a>
                      </Button>
                
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(selected.image_url);
                
                            if (!response.ok) {
                              throw new Error("Failed to fetch image");
                            }
                
                            const blob = await response.blob();
                
                            const blobUrl = window.URL.createObjectURL(blob);
                
                            const link = document.createElement("a");
                            link.href = blobUrl;
                            link.download = `custom-request-${selected.name || "image"}.jpg`;
                
                            document.body.appendChild(link);
                            link.click();
                
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(blobUrl);
                
                          } catch (error) {
                            console.error("DOWNLOAD IMAGE ERROR:", error);
                            toast.error("Failed to download image");
                          }
                        }}
                      >
                        Download image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No reference image uploaded.
                  </div>
                )}
                <div className="flex items-end gap-2 pt-2 border-t border-border">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Estimated price (TND)</p>
                    <Input type="number" step="0.1" value={priceDraft} onChange={(e) => setPriceDraft(e.target.value)} />
                  </div>
                  <Button disabled={isPending} onClick={() => handleSavePrice(selected.id)}>Save</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
