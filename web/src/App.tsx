import React, { useState, useEffect } from 'react';
import type { Order } from '@ritsu/shared';
import { apiAdapter } from './data/ApiAdapter.js';
import { WelcomePage } from './features/customer/WelcomePage.js';
import { MenuPage } from './features/customer/MenuPage.js';
import { PaymentPage } from './features/customer/PaymentPage.js';
import { TrackingPage } from './features/customer/TrackingPage.js';
import { BillPage } from './features/customer/BillPage.js';

// Owner Components
import { OwnerAuthGuard } from './features/owner/OwnerAuthGuard.js';
import { OwnerLayout, OwnerTab } from './features/owner/OwnerLayout.js';
import { OrdersPage } from './features/owner/OrdersPage.js';
import { MenuManagerPage } from './features/owner/MenuManagerPage.js';
import { TablesPage } from './features/owner/TablesPage.js';
import { SalesPage } from './features/owner/SalesPage.js';
import { SettingsPage } from './features/owner/SettingsPage.js';

type CustomerScreen = 'welcome' | 'menu' | 'payment' | 'tracking' | 'bill';

export const App: React.FC = () => {
  const [isOwnerRoute, setIsOwnerRoute] = useState(false);
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('orders');
  const [sseStatus, setSseStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Customer states
  const [screen, setScreen] = useState<CustomerScreen>('welcome');
  const [tableLabel, setTableLabel] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Check if URL is /owner or has ?owner=true
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    if (pathname.startsWith('/owner') || searchParams.has('owner')) {
      setIsOwnerRoute(true);
      return;
    }

    // Check if URL has direct order token: ?order=public_token
    const orderToken = searchParams.get('order');
    if (orderToken) {
      apiAdapter
        .getOrderByToken(orderToken)
        .then((order) => {
          setActiveOrder(order);
          setTableLabel(order.table_label);
          setCustomerName(order.customer_name);
          setScreen('tracking');
        })
        .catch(() => {
          setScreen('welcome');
        });
      return;
    }

    // Check if session storage already has table & name
    const storedTable = sessionStorage.getItem('ritsu_table');
    const storedName = sessionStorage.getItem('ritsu_customer_name');
    if (storedTable && storedName) {
      setTableLabel(storedTable);
      setCustomerName(storedName);
      setScreen('menu');
    }
  }, []);

  const handleStartOrdering = (table: string, name: string) => {
    setTableLabel(table);
    setCustomerName(name);
    setScreen('menu');
  };

  const handleOrderPlaced = (order: Order) => {
    setActiveOrder(order);
    setScreen('payment');
  };

  // If on Owner route, wrap in AuthGuard and Layout
  if (isOwnerRoute) {
    return (
      <OwnerAuthGuard>
        <OwnerLayout
          currentTab={ownerTab}
          onTabChange={setOwnerTab}
          sseStatus={sseStatus}
          pendingOrdersCount={pendingOrdersCount}
        >
          {ownerTab === 'orders' && (
            <OrdersPage
              onOrdersCountChange={setPendingOrdersCount}
              onSseStatusChange={setSseStatus}
            />
          )}
          {ownerTab === 'menu' && <MenuManagerPage />}
          {ownerTab === 'tables' && <TablesPage />}
          {ownerTab === 'sales' && <SalesPage />}
          {ownerTab === 'settings' && <SettingsPage />}
        </OwnerLayout>
      </OwnerAuthGuard>
    );
  }

  // Customer Dine-in Flow
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {screen === 'welcome' && (
        <WelcomePage onStartOrdering={handleStartOrdering} />
      )}

      {screen === 'menu' && (
        <MenuPage
          tableLabel={tableLabel}
          customerName={customerName}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

      {screen === 'payment' && activeOrder && (
        <PaymentPage
          order={activeOrder}
          onContinueToTracking={() => setScreen('tracking')}
          onViewBill={() => setScreen('bill')}
        />
      )}

      {screen === 'tracking' && activeOrder && (
        <TrackingPage
          order={activeOrder}
          onAddMoreItems={() => setScreen('menu')}
          onViewBill={() => setScreen('bill')}
        />
      )}

      {screen === 'bill' && activeOrder && (
        <BillPage
          order={activeOrder}
          onBackToMenu={() => setScreen('menu')}
          onBackToTracking={() => setScreen('tracking')}
        />
      )}

      {/* Discreet link to Owner portal in footer */}
      <footer className="py-4 text-center text-[10px] text-[var(--text-muted)] print:hidden">
        <a
          href="/owner"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/owner');
            setIsOwnerRoute(true);
          }}
          className="hover:text-[var(--gold-ink)] underline tracking-wider uppercase transition-colors"
        >
          Staff & Owner Portal
        </a>
      </footer>
    </div>
  );
};

export default App;
