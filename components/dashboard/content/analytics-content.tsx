"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, ShoppingBag, Users, Receipt, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DateFilter } from "@/components/dashboard/date-filter";
import { getDashboardStats, getCategoryPerformance } from "@/app/admin/actions";
import { resolveDateRange, formatDay } from "@/lib/admin/date-ranges";
import type { DateFilterPreset } from "@/lib/types";

const cardShadow =
  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px";

export function AnalyticsContent() {
  const [preset, setPreset] = useState<DateFilterPreset>("30d");
  const [custom, setCustom] = useState<{ from?: string; to?: string }>({});
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [categoryPerf, setCategoryPerf] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = resolveDateRange(preset, custom);
      const [statsData, catData] = await Promise.all([
        getDashboardStats(range),
        getCategoryPerformance(range),
      ]);
      setStats(statsData);
      setCategoryPerf(catData);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  }, [preset, custom]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const conversionRate = stats.totalCustomers
    ? Math.min(100, (stats.totalOrders / Math.max(stats.totalCustomers, 1)) * 100)
    : 0;

  const statCards = [
    { label: "Revenue (period)", value: `${stats.totalRevenue.toLocaleString()} TND`, icon: DollarSign, color: "text-success", bg: "bg-success/10" },
    { label: "Orders (period)", value: stats.totalOrders, icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
    { label: "Customers (period)", value: stats.totalCustomers, icon: Users, color: "text-chart-4", bg: "bg-chart-4/10" },
    { label: "Orders per Customer", value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-chart-3", bg: "bg-chart-3/10" },
    { label: "Avg. Basket Value", value: `${stats.avgOrderValue.toFixed(2)} TND`, icon: Receipt, color: "text-warning", bg: "bg-warning/10" },
  ];

  const revenueData = stats.revenueOverTime.map((d) => ({ date: formatDay(d.date), revenue: d.revenue }));
  const ordersData = stats.ordersOverTime.map((d) => ({ date: formatDay(d.date), orders: d.orders }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DateFilter
          value={preset}
          customFrom={custom.from}
          customTo={custom.to}
          onChange={(p, c) => {
            setPreset(p);
            if (c) setCustom(c);
          }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: cardShadow }}>
              <div className={`p-2.5 rounded-xl ${s.bg} w-fit mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-xl font-semibold text-foreground mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: cardShadow }}>
          <h3 className="text-base font-semibold text-foreground mb-1">Revenue Over Time</h3>
          <p className="text-sm text-muted-foreground mb-6">TND revenue for the selected period</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" />
                <XAxis dataKey="date" tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={{ stroke: "oklch(0.92 0.005 250)" }} />
                <YAxis tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={{ stroke: "oklch(0.92 0.005 250)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid oklch(0.92 0.005 250)", borderRadius: "12px" }} />
                <Bar dataKey="revenue" fill="oklch(0.68 0.2 40)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: cardShadow }}>
          <h3 className="text-base font-semibold text-foreground mb-1">Orders Over Time</h3>
          <p className="text-sm text-muted-foreground mb-6">Number of orders per day</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" />
                <XAxis dataKey="date" tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={{ stroke: "oklch(0.92 0.005 250)" }} />
                <YAxis tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={{ stroke: "oklch(0.92 0.005 250)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid oklch(0.92 0.005 250)", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="orders" stroke="oklch(0.6 0.15 250)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: cardShadow }}>
        <h3 className="text-base font-semibold text-foreground mb-1">Category Performance</h3>
        <p className="text-sm text-muted-foreground mb-6">Revenue by product category, selected period</p>
        {categoryPerf.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerf} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" />
                <XAxis type="number" tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} />
                <YAxis type="category" dataKey="category" tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid oklch(0.92 0.005 250)", borderRadius: "12px" }} />
                <Bar dataKey="revenue" fill="oklch(0.6 0.15 250)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: cardShadow }}>
        <h3 className="text-base font-semibold text-foreground mb-4">Most Profitable Designs</h3>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <div className="space-y-3">
            {stats.topProducts.map((design, i) => (
              <div key={design.id} className="flex items-center gap-4">
                <span className="w-6 text-sm font-semibold text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{design.name}</p>
                  <p className="text-xs text-muted-foreground">{design.timesOrdered} sales</p>
                </div>
                <div className="flex items-center gap-1.5 text-success text-sm font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {design.revenue.toLocaleString()} TND
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
