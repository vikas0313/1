import React, { useState, useEffect } from 'react';
import type { Order } from '@ritsu/shared';
import { apiAdapter } from './data/ApiAdapter.js';
import { WelcomePage } from './features/customer/WelcomePage.js';
import { MenuPage } from './features/customer/MenuPage.js';
import { PaymentPage } from './features/customer/PaymentPage.js';
import { TrackingPage } from './features/customer/TrackingPage.js';
import { BillPage } from './features/customer/BillPage.js';

type CustomerScreen = 'welcome' | 'menu' | 'payment' | 'tracking' | 'bill';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<CustomerScreen>('welcome');
  const [tableLabel, setTableLabel] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Check if URL has direct order token: ?order=public_token
    const params = new URLSearchParams(window.location.search);
    const orderToken = params.get('order');

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
    </div>
  );
};

export default App;

