"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getProducts, getOrders, getCategories } from "@/app/admin/actions";
import { TrendingUp, ShoppingBag, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cardShadow =
  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px";

type SortMode = "popularity" | "revenue" | "newest" | "alphabetical";

export function DesignsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("popularity");

  useEffect(() => {
    Promise.all([getProducts(), getOrders(), getCategories()])
      .then(([productsData, ordersResult, categoriesData]) => {
        setProducts(productsData || []);
        if (ordersResult.error) {
          toast.error(`Failed to load order stats: ${ordersResult.error}`);
        } else {
          setOrders(ordersResult.data || []);
        }
        setCategories(categoriesData || []);
      })
      .catch((err) => {
        console.error("Failed to load design stats", err);
        toast.error("Could not load designs from the database.");
      })
      .finally(() => setLoading(false));
  }, []);

  const designs = useMemo(() => {
    const statsMap = new Map<string, { timesOrdered: number; revenue: number }>();
    orders.forEach((order: any) => {
      if (order.status === "cancelled") return;
      order.order_items?.forEach((item: any) => {
        if (!item.product_id) return;
        const current = statsMap.get(item.product_id) || { timesOrdered: 0, revenue: 0 };
        statsMap.set(item.product_id, {
          timesOrdered: current.timesOrdered + (item.quantity || 1),
          revenue: current.revenue + Number(item.price || 0) * (item.quantity || 1),
        });
      });
    });

    return products.map((product: any) => {
      const stats = statsMap.get(product.id) || { timesOrdered: 0, revenue: 0 };
      return { ...product, timesOrdered: stats.timesOrdered, revenue: stats.revenue };
    });
  }, [products, orders]);

  const filtered = useMemo(() => {
    let list = designs;
    if (category !== "All") list = list.filter((d) => d.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q));
    }
    const sorted = [...list];
    switch (sort) {
      case "revenue":
        sorted.sort((a, b) => b.revenue - a.revenue);
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "alphabetical":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => b.timesOrdered - a.timesOrdered);
    }
    return sorted;
  }, [designs, category, search, sort]);

  const maxOrdered = designs.length ? Math.max(...designs.map((d) => d.timesOrdered), 1) : 1;
  const categoryNames = ["All", ...Array.from(new Set(categories.map((c: any) => c.name)))];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categoryNames.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search designs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={sort} onValueChange={(v: any) => setSort(v)}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Sort: Popularity</SelectItem>
            <SelectItem value="revenue">Sort: Revenue</SelectItem>
            <SelectItem value="newest">Sort: Newest</SelectItem>
            <SelectItem value="alphabetical">Sort: Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
          No designs found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((design) => {
            const popularity = Math.round((design.timesOrdered / maxOrdered) * 100);
            return (
              <div key={design.id} className="bg-card rounded-2xl border border-border overflow-hidden" style={{ boxShadow: cardShadow }}>
                <div className="aspect-[4/3] bg-muted relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={design.image_url || "/placeholder.jpg"} alt={design.name} className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
                    {design.price} TND
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-medium text-foreground">{design.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{design.category}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> {Number(design.rating).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{design.timesOrdered}</p>
                        <p className="text-xs text-muted-foreground">Orders count</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-success/10">
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{design.revenue.toLocaleString()} TND</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Popularity</span>
                      <span>{popularity}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${popularity}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
