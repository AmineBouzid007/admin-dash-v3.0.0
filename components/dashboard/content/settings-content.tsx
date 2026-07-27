"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";
import { Store, Truck, Palette, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

const cardShadow =
  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px";

// The database schema has no settings table, so store/shipping/admin
// preferences are kept locally in the browser rather than invented server-side.
const STORAGE_KEY = "stikky-admin-settings";

interface SettingsState {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  currency: string;
  productionDays: string;
  shippingFee: string;
  freeShippingOver100: boolean;
  newOrderNotifications: boolean;
  dailySummaryEmail: boolean;
  lowSatisfactionAlerts: boolean;
}

const defaults: SettingsState = {
  storeName: "Stikky",
  storeEmail: "admin@stikky.tn",
  storePhone: "+216 20 123 456",
  currency: "TND",
  productionDays: "3",
  shippingFee: "8",
  freeShippingOver100: true,
  newOrderNotifications: true,
  dailySummaryEmail: true,
  lowSatisfactionAlerts: false,
}

function SettingsCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: cardShadow }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function SettingsContent() {
  const [settings, setSettings] = useState<SettingsState>(defaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...defaults, ...JSON.parse(raw) });
    } catch (err) {
      console.error("Failed to load settings from local storage", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  const patch = (fields: Partial<SettingsState>) => setSettings((s) => ({ ...s, ...fields }));

  const save = (section: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success(`${section} saved.`);
    } catch (err) {
      toast.error("Failed to save settings.");
    }
  };

  if (!loaded) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <SettingsCard icon={Store} title="Store Information" subtitle="Basic details about Stikky">
        <div className="space-y-4">
          <div>
            <Label htmlFor="store-name" className="mb-1.5 block">Store name</Label>
            <Input id="store-name" value={settings.storeName} onChange={(e) => patch({ storeName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="store-email" className="mb-1.5 block">Contact email</Label>
            <Input id="store-email" value={settings.storeEmail} onChange={(e) => patch({ storeEmail: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="store-phone" className="mb-1.5 block">Phone</Label>
            <Input id="store-phone" value={settings.storePhone} onChange={(e) => patch({ storePhone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="store-currency" className="mb-1.5 block">Currency</Label>
            <Input id="store-currency" value={settings.currency} onChange={(e) => patch({ currency: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => save("Store information")}>Save changes</Button>
        </div>
      </SettingsCard>

      <SettingsCard icon={Truck} title="Shipping Settings" subtitle="Delivery zones & production times">
        <div className="space-y-4">
          <div>
            <Label htmlFor="production-time" className="mb-1.5 block">Standard production time (days)</Label>
            <Input id="production-time" type="number" value={settings.productionDays} onChange={(e) => patch({ productionDays: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="shipping-fee" className="mb-1.5 block">Standard shipping fee (TND)</Label>
            <Input id="shipping-fee" type="number" value={settings.shippingFee} onChange={(e) => patch({ shippingFee: e.target.value })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Free shipping over 100 TND</p>
              <p className="text-xs text-muted-foreground">Applies automatically at checkout</p>
            </div>
            <Switch checked={settings.freeShippingOver100} onCheckedChange={(v) => patch({ freeShippingOver100: v })} />
          </div>
          <Button size="sm" onClick={() => save("Shipping settings")}>Save changes</Button>
        </div>
      </SettingsCard>

      <SettingsCard icon={Palette} title="Theme Settings" subtitle="Appearance of the admin console">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Light / Dark mode</p>
            <p className="text-xs text-muted-foreground">Switch the dashboard theme</p>
          </div>
          <ThemeToggle />
        </div>
      </SettingsCard>

      <SettingsCard icon={UserCog} title="Admin Preferences" subtitle="Notifications & workflow defaults">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">New order notifications</p>
              <p className="text-xs text-muted-foreground">Get notified when a new order comes in</p>
            </div>
            <Switch checked={settings.newOrderNotifications} onCheckedChange={(v) => patch({ newOrderNotifications: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Daily summary email</p>
              <p className="text-xs text-muted-foreground">Revenue & orders recap every morning</p>
            </div>
            <Switch checked={settings.dailySummaryEmail} onCheckedChange={(v) => patch({ dailySummaryEmail: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Low satisfaction alerts</p>
              <p className="text-xs text-muted-foreground">Flag cancelled or delayed orders</p>
            </div>
            <Switch checked={settings.lowSatisfactionAlerts} onCheckedChange={(v) => patch({ lowSatisfactionAlerts: v })} />
          </div>
          <Button size="sm" onClick={() => save("Admin preferences")}>Save changes</Button>
        </div>
      </SettingsCard>
    </div>
  );
}
