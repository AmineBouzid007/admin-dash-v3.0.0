"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag,
  DollarSign,
  Receipt,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateFilter } from "@/components/dashboard/date-filter";
import { getDashboardStats } from "@/app/admin/actions";
import { resolveDateRange, formatDay } from "@/lib/admin/date-ranges";
import type { DateFilterPreset } from "@/lib/types";

const cardShadow =
  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px";

const statusColors: Record<string, string> = {
  pending: "oklch(0.78 0.18 85)",
  processing: "oklch(0.68 0.2 40)",
  shipped: "oklch(0.6 0.15 250)",
  delivered: "oklch(0.55 0.17 155)",
  cancelled: "oklch(0.6 0.2 25)",
};

export function OverviewContent() {
  const [preset, setPreset] = useState<DateFilterPreset>("30d");
  const [custom, setCustom] = useState<{ from?: string; to?: string }>({});
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = resolveDateRange(preset, custom);
      const data = await getDashboardStats(range);
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  }, [preset, custom]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDateChange = (p: DateFilterPreset, c?: { from?: string; to?: string }) => {
    setPreset(p);
    if (c) setCustom(c);
  };

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Orders",
      value: `${stats.totalOrders}`,
      icon: ShoppingBag,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Total Revenue",
      value: `${stats.totalRevenue.toLocaleString()} TND`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Average Order Value",
      value: `${stats.avgOrderValue.toFixed(2)} TND`,
      icon: Receipt,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "Total Customers",
      value: `${stats.totalCustomers}`,
      icon: Users,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      label: "Revenue Today",
      value: `${stats.revenueToday.toLocaleString()} TND`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Orders Today",
      value: `${stats.ordersToday}`,
      icon: ShoppingBag,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const statusCards = [
    { label: "Pending", value: stats.pendingOrders, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Processing", value: stats.processingOrders, icon: RefreshCw, color: "text-primary", bg: "bg-primary/10" },
    { label: "Shipped", value: stats.shippedOrders, icon: ShoppingBag, color: "text-chart-4", bg: "bg-chart-4/10" },
    { label: "Delivered", value: stats.deliveredOrders, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Cancelled", value: stats.cancelledOrders, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const statusDist = stats.statusDistribution.filter((s) => s.value > 0);
  const revenueData = stats.revenueOverTime.map((d) => ({ date: formatDay(d.date), revenue: d.revenue }));
  const ordersData = stats.ordersOverTime.map((d) => ({ date: formatDay(d.date), orders: d.orders }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <DateFilter
          value={preset}
          customFrom={custom.from}
          customTo={custom.to}
          onChange={handleDateChange}
        />
        <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={load}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: cardShadow }}>
              <div className={`p-2.5 rounded-xl w-fit mb-3 ${metric.bgColor}`}>
                <Icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <p className="text-xl font-semibold text-foreground mb-1">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Order status breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl p-4 border border-border" style={{ boxShadow: cardShadow }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${s.bg}`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue + Status Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="col-span-2 bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: cardShadow }}>
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Revenue Over Time</h3>
            <p className="text-sm text-muted-foreground">TND revenue for the selected period</p>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" />
                <XAxis dataKey="date" tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={{ stroke: "oklch(0.92 0.005 250)" }} />
                <YAxis tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={{ stroke: "oklch(0.92 0.005 250)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid oklch(0.92 0.005 250)", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="revenue" stroke="oklch(0.68 0.2 40)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: cardShadow }}>
          <h3 className="text-base font-semibold text-foreground mb-1">Order Status</h3>
          <p className="text-sm text-muted-foreground mb-4">Distribution across the pipeline</p>
          {statusDist.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No orders in this period.</p>
          ) : (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDist} dataKey="value" nameKey="label" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {statusDist.map((entry) => (
                        <Cell key={entry.status} fill={statusColors[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid oklch(0.92 0.005 250)", borderRadius: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {statusDist.map((entry) => (
                  <div key={entry.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[entry.status] }} />
                      <span className="text-muted-foreground">{entry.label}</span>
                    </div>
                    <span className="font-medium text-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Orders Growth + Best Selling + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="col-span-2 bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: cardShadow }}>
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Orders Over Time</h3>
            <p className="text-sm text-muted-foreground">Number of orders placed per day</p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersData}>
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.68 0.2 40)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="oklch(0.68 0.2 40)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" />
                <XAxis dataKey="date" tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={{ stroke: "oklch(0.92 0.005 250)" }} />
                <YAxis tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={{ stroke: "oklch(0.92 0.005 250)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid oklch(0.92 0.005 250)", borderRadius: "12px" }} />
                <Area type="monotone" dataKey="orders" stroke="oklch(0.68 0.2 40)" strokeWidth={2} fill="url(#ordersGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: cardShadow }}>
          <h3 className="text-base font-semibold text-foreground mb-4">Top Selling Designs</h3>
          <div className="space-y-3">
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet in this period.</p>
            ) : (
              stats.topProducts.slice(0, 6).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-semibold text-muted-foreground">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.timesOrdered} sales</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0">{p.revenue.toLocaleString()} TND</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: cardShadow }}>
        <h3 className="text-base font-semibold text-foreground mb-4">Recent Orders</h3>
        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders in this period.</p>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">{o.status}</span>
                  <span className="font-semibold text-foreground">{Number(o.total).toLocaleString()} TND</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
