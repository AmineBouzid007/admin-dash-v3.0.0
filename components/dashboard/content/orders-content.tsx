"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { toast } from "sonner";
import {
  getOrders,
  updateOrderStatus,
  createManualOrder,
  getProducts,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Printer,
  MessageCircle,
  Phone,
  Mail,
  Plus,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

const emptyItem = () => ({
  product_id: "",
  quantity: 1,
  size: "",
  frame: "",
  price: 0,
});

export function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    governorate: "Tunis",
    notes: "",
    shipping: 7,
    items: [emptyItem()],
  });

  async function loadData() {
    setLoadError(null);
    try {
      const [ordersResult, productsData] = await Promise.all([getOrders(), getProducts()]);
      if (ordersResult.error) {
        setLoadError(ordersResult.error);
        toast.error(`Failed to load orders: ${ordersResult.error}`);
        setOrders([]);
      } else {
        setOrders(ordersResult.data || []);
      }
      setProducts(productsData || []);
    } catch (err: any) {
      console.error("Failed to load orders/products", err);
      const message = err?.message || "Unexpected error while loading orders.";
      setLoadError(message);
      toast.error(`Failed to load orders: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    const prev = orders;
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, newStatus);
        toast.success(`Order status updated to ${newStatus}.`);
      } catch (err: any) {
        setOrders(prev);
        toast.error(err.message || "Failed to update order status.");
      }
    });
  };

  const handlePrintOrder = (order: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print the order sheet.");
      return;
    }

    const itemsHtml = (order.order_items || [])
      .map(
        (item: any) => `
          <tr>
            <td>${item.products?.name || item.product_name}</td>
            <td>${item.size || "N/A"}</td>
            <td>${item.frame || "N/A"}</td>
            <td>${item.quantity}</td>
            <td>${item.price} TND</td>
          </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Sheet - #${order.id.slice(0, 8)}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #171717; }
            h1 { color: #FF4500; margin-bottom: 5px; }
            .section { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .total { font-weight: bold; font-size: 1.1em; text-align: right; margin-top: 10px; }
            .meta { color: #555; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>Stikky Fulfillment Sheet</h1>
          <p class="meta"><strong>Order ID:</strong> ${order.id}</p>
          <p class="meta"><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
          <p class="meta"><strong>Status:</strong> ${order.status} &nbsp;|&nbsp; <strong>Payment:</strong> Cash on Delivery (${order.payment_status})</p>

          <div class="section">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${order.customer_name}</p>
            <p><strong>Phone:</strong> ${order.phone}</p>
            <p><strong>Email:</strong> ${order.email}</p>
            <p><strong>Address:</strong> ${order.address}, ${order.city}, ${order.governorate} ${order.postal_code || ""}</p>
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ""}
          </div>

          <div class="section">
            <h3>Products</h3>
            <table>
              <thead>
                <tr><th>Product</th><th>Size</th><th>Frame</th><th>Qty</th><th>Price</th></tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="total">
              Subtotal: ${order.subtotal} TND | Shipping: ${order.shipping} TND | Total: ${order.total} TND
            </div>
          </div>

          <script>
            window.onload = function () { window.print(); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleWhatsApp = (phone: string, customerName: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(`Hello ${customerName}, this is Stikky regarding your order.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  const resetForm = () =>
    setForm({
      customer_name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      governorate: "Tunis",
      notes: "",
      shipping: 7,
      items: [emptyItem()],
    });

  const updateItem = (index: number, patch: Partial<ReturnType<typeof emptyItem>>) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (index: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const subtotal = form.items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity || 1), 0);
  const total = subtotal + Number(form.shipping || 0);

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = form.items.filter((it) => it.product_id);
    if (!validItems.length) {
      toast.error("Add at least one product to the order.");
      return;
    }

    startTransition(async () => {
      try {
        const items = validItems.map((it) => {
          const p = products.find((prod) => prod.id === it.product_id);
          return {
            product_id: it.product_id,
            product_name: p?.name || "Product",
            quantity: Number(it.quantity) || 1,
            size: it.size || undefined,
            frame: it.frame || undefined,
            price: Number(it.price) || p?.price || 0,
            image_url: p?.image_url,
          };
        });

        const result = await createManualOrder({
          customer_name: form.customer_name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          governorate: form.governorate,
          notes: form.notes,
          shipping: Number(form.shipping),
          items,
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("Order created successfully.");
        setIsCreateOpen(false);
        resetForm();
        await loadData();
      } catch (err: any) {
        console.error("Failed to create order", err);
        toast.error(err?.message || "Failed to create order: unexpected error.");
      }
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        order.customer_name?.toLowerCase().includes(q) ||
        order.phone?.includes(searchQuery) ||
        order.email?.toLowerCase().includes(q) ||
        order.id?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders Management</h2>
          <p className="text-muted-foreground">Manage store orders, update statuses, and print fulfillment sheets.</p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#FF4500] hover:bg-[#FF4500]/90 text-white">
              <Plus className="mr-2 h-4 w-4" /> Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Manual Order (Cash on Delivery)</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer Name</label>
                  <Input required placeholder="Full Name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input required placeholder="+216..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email (Optional)</label>
                <Input type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input required placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Governorate</label>
                  <Input required placeholder="Governorate" value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Shipping Fee (TND)</label>
                  <Input type="number" step="0.1" value={form.shipping} onChange={(e) => setForm({ ...form, shipping: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea placeholder="Delivery instructions, custom requests..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Products</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add item
                  </Button>
                </div>
                {form.items.map((item, index) => {
                  const selected = products.find((p) => p.id === item.product_id);
                  const sizes: any[] = selected?.sizes || [];
                  const frames: any[] = selected?.frames || [];
                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end border border-border rounded-lg p-3">
                      <div className="col-span-4">
                        <label className="text-xs font-medium">Product</label>
                        <Select
                          value={item.product_id}
                          onValueChange={(val) => {
                            const p = products.find((prod) => prod.id === val);
                            updateItem(index, { product_id: val, price: p ? p.price : 0 });
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Choose a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.price} TND)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium">Qty</label>
                        <Input type="number" min={1} className="h-9" value={item.quantity} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium">Size</label>
                        {sizes.length ? (
                          <Select value={item.size} onValueChange={(val) => updateItem(index, { size: val })}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Size" /></SelectTrigger>
                            <SelectContent>
                              {sizes.map((s: any, i: number) => (
                                <SelectItem key={i} value={s.name}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input className="h-9" placeholder="A4" value={item.size} onChange={(e) => updateItem(index, { size: e.target.value })} />
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium">Frame</label>
                        {frames.length ? (
                          <Select value={item.frame} onValueChange={(val) => updateItem(index, { frame: val })}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Frame" /></SelectTrigger>
                            <SelectContent>
                              {frames.map((fr: any, i: number) => (
                                <SelectItem key={i} value={fr.name}>{fr.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input className="h-9" placeholder="None" value={item.frame} onChange={(e) => updateItem(index, { frame: e.target.value })} />
                        )}
                      </div>
                      <div className="col-span-1">
                        <label className="text-xs font-medium">Price</label>
                        <Input type="number" step="0.1" className="h-9" value={item.price} onChange={(e) => updateItem(index, { price: Number(e.target.value) })} />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={form.items.length === 1}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end text-sm space-y-1 flex-col items-end border-t pt-3">
                <p className="text-muted-foreground">Subtotal: <span className="font-medium text-foreground">{subtotal.toFixed(2)} TND</span></p>
                <p className="text-muted-foreground">Shipping: <span className="font-medium text-foreground">{Number(form.shipping || 0).toFixed(2)} TND</span></p>
                <p className="font-semibold text-base">Total: {total.toFixed(2)} TND</p>
              </div>

              <Button type="submit" disabled={isPending} className="w-full bg-[#FF4500] hover:bg-[#FF4500]/90 text-white">
                {isPending ? "Creating..." : "Save Order"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders, name, phone, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loadError && (
            <div className="m-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to load orders: {loadError}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : pagedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders found.</TableCell>
                </TableRow>
              ) : (
                pagedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{order.phone}</TableCell>
                    <TableCell>{Number(order.total).toFixed(2)} TND</TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                        <SelectTrigger className="h-8 w-32 capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="outline" size="icon" onClick={() => setViewOrder(order)} title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handlePrintOrder(order)} title="Print Sheet">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleWhatsApp(order.phone, order.customer_name)} title="Contact on WhatsApp">
                        <MessageCircle className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="outline" size="icon" asChild title="Call customer">
                        <a href={`tel:${order.phone}`}><Phone className="h-4 w-4" /></a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!loading && filteredOrders.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {viewOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{viewOrder.id.slice(0, 8)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold mb-1">Customer</p>
                  <p>{viewOrder.customer_name}</p>
                  <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {viewOrder.phone}</p>
                  <p className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {viewOrder.email}</p>
                  <p className="text-muted-foreground">{viewOrder.address}, {viewOrder.city}, {viewOrder.governorate}</p>
                  {viewOrder.notes && <p className="text-muted-foreground italic mt-1">Note: {viewOrder.notes}</p>}
                </div>
                <div>
                  <p className="font-semibold mb-1">Items</p>
                  <div className="space-y-2">
                    {(viewOrder.order_items || []).map((item: any) => (
                      <div key={item.id} className="flex justify-between border-b border-border pb-1">
                        <span>{item.products?.name || item.product_name} {item.size ? `· ${item.size}` : ""} {item.frame ? `· ${item.frame}` : ""} × {item.quantity}</span>
                        <span className="font-medium">{(item.price * item.quantity).toFixed(2)} TND</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end flex-col items-end text-sm">
                  <p>Subtotal: {Number(viewOrder.subtotal).toFixed(2)} TND</p>
                  <p>Shipping: {Number(viewOrder.shipping).toFixed(2)} TND</p>
                  <p className="font-semibold text-base">Total: {Number(viewOrder.total).toFixed(2)} TND</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handlePrintOrder(viewOrder)}><Printer className="h-4 w-4 mr-1" /> Print</Button>
                  <Button variant="outline" size="sm" onClick={() => handleWhatsApp(viewOrder.phone, viewOrder.customer_name)}><MessageCircle className="h-4 w-4 mr-1 text-green-500" /> WhatsApp</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
