"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { toast } from "sonner";
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/admin/actions";
import { Plus, Search, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const cardShadow =
  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px";

const emptyForm = () => ({
  name: "",
  category: "",
  product_type: "poster" as "poster" | "sticker",
  price: 25,
  rating: 5,
  image_url: "",
  description: "",
  material: "",
  is_featured: false,
  is_bestseller: false,
  sizes: JSON.stringify([{ name: "A4", price: 25 }, { name: "A3", price: 35 }]),
  frames: JSON.stringify([{ name: "None", price: 0 }, { name: "Black Wood", price: 20 }]),
  images: JSON.stringify([]),
});

export function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(emptyForm());

  async function loadData() {
    try {
      const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()]);
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error("Failed to load products", err);
      toast.error("Could not load products from the database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || p.product_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [products, search, typeFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      product_type: product.product_type,
      price: product.price,
      rating: product.rating ?? 5,
      image_url: product.image_url,
      description: product.description,
      material: product.material || "",
      is_featured: product.is_featured,
      is_bestseller: product.is_bestseller,
      sizes: JSON.stringify(product.sizes || []),
      frames: JSON.stringify(product.frames || []),
      images: JSON.stringify(product.images || []),
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteProduct(id);
        toast.success("Product deleted.");
        await loadData();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete product.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("category", form.category);
        formData.append("product_type", form.product_type);
        formData.append("price", String(form.price));
        formData.append("rating", String(form.rating));
        formData.append("image_url", form.image_url);
        formData.append("description", form.description);
        formData.append("material", form.material);
        formData.append("is_featured", String(form.is_featured));
        formData.append("is_bestseller", String(form.is_bestseller));
        formData.append("sizes", form.sizes);
        formData.append("frames", form.frames);
        formData.append("images", form.images);

        if (editingId) {
          await updateProduct(editingId, formData);
          toast.success("Product updated.");
        } else {
          await createProduct(formData);
          toast.success("Product created.");
        }

        setIsFormOpen(false);
        setForm(emptyForm());
        setEditingId(null);
        await loadData();
      } catch (err: any) {
        console.error("Failed to save product", err);
        toast.error(err.message || "Failed to save product.");
      }
    });
  };

  if (loading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="poster">Poster</SelectItem>
              <SelectItem value="sticker">Sticker</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) {
              setEditingId(null);
              setForm(emptyForm());
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#FF4500] hover:bg-[#FF4500]/90 text-white shrink-0" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Create Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Product" : "Create Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input required placeholder="e.g., Porsche 911 GT3 RS" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Price (TND)</label>
                  <Input required type="number" step="0.1" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Product Type</label>
                  <Select value={form.product_type} onValueChange={(val: any) => setForm({ ...form, product_type: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poster">Poster</SelectItem>
                      <SelectItem value="sticker">Sticker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                    <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c: any) => c.type === form.product_type)
                        .map((c: any) => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input required placeholder="https://images.unsplash.com/..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea placeholder="High quality matte print..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Material / Finish</label>
                  <Input placeholder="Glossy Paper 250g" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Rating (1-5)</label>
                  <Input type="number" min={1} max={5} step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={(val) => setForm({ ...form, is_featured: val })} />
                  <span className="text-sm">Featured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_bestseller} onCheckedChange={(val) => setForm({ ...form, is_bestseller: val })} />
                  <span className="text-sm">Best seller</span>
                </div>
              </div>

              <Button type="submit" disabled={isPending} className="w-full bg-[#FF4500] hover:bg-[#FF4500]/90 text-white">
                {isPending ? "Saving..." : editingId ? "Save Changes" : "Create Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden" style={{ boxShadow: cardShadow }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No products found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image_url || "/placeholder.jpg"} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.category}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{p.product_type}</TableCell>
                  <TableCell className="text-right">{Number(p.price).toFixed(2)} TND</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> {Number(p.rating).toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {p.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Featured</span>}
                      {p.is_bestseller && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">Best seller</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{p.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes the product from the catalog. Existing orders that reference it are not affected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(p.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
