import { useState, useEffect } from 'react';
import { Order, OrdersData, SavedInvoice, OrderStatus, OrderPart } from '../types';

const ORDERS_KEY = 'orders_data';

export function useOrders() {
  const [ordersData, setOrdersData] = useState<OrdersData>(() => {
    return loadOrders();
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveOrders(ordersData);
  }, [ordersData]);

  const generateOrderNumber = (): string => {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Extract the numeric part from next_order_number (e.g., "ORD0001" -> "001")
    const numericPart = ordersData.next_order_number.replace('ORD', '').padStart(3, '0');
    
    // Format: ORD + YYMMDD + 3-digit serial
    return `ORD${year}${month}${day}${numericPart}`;
  };

  const createOrder = (invoice: SavedInvoice): string => {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // Generate order number
    const orderNumber = generateOrderNumber();

    // Convert invoice parts to order parts (remove pricing info)
    const orderParts: OrderPart[] = invoice.parts.map(part => ({
      id: part.id,
      serialNumber: part.serialNumber,
      fileName: part.fileName,
      fileType: part.fileType,
      volume: part.volume,
      boundingBox: part.boundingBox,
      technology: part.technology,
      material: part.material,
      quantity: part.quantity,
      comments: part.comments
    }));

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      parts: orderParts,
      status: 'New',
      createdAt: now,
      updatedAt: now,
      serviceCharges: invoice.serviceCharges || [],
      totalServiceCharges: invoice.totalServiceCharges || 0
    };

    // Generate next order number
    const currentNum = parseInt(ordersData.next_order_number.replace('ORD', ''));
    const nextOrderNumber = `ORD${String(currentNum + 1).padStart(4, '0')}`;

    setOrdersData(prev => ({
      ...prev,
      orders: {
        ...prev.orders,
        [orderId]: newOrder
      },
      last_updated: now,
      next_order_number: nextOrderNumber
    }));

    console.log(`Order ${orderNumber} created from invoice ${invoice.invoiceNumber}`);
    return orderId;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrdersData(prev => ({
      ...prev,
      orders: {
        ...prev.orders,
        [orderId]: {
          ...prev.orders[orderId],
          status,
          updatedAt: new Date().toISOString()
        }
      },
      last_updated: new Date().toISOString()
    }));
  };

  const deleteOrder = (orderId: string) => {
    setOrdersData(prev => {
      const updatedOrders = { ...prev.orders };
      delete updatedOrders[orderId];
      
      return {
        ...prev,
        orders: updatedOrders,
        last_updated: new Date().toISOString()
      };
    });
  };

  const getOrder = (orderId: string): Order | null => {
    return ordersData.orders[orderId] || null;
  };

  return {
    orders: ordersData.orders,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    getOrder
  };
}

function loadOrders(): OrdersData {
  try {
    const saved = localStorage.getItem(ORDERS_KEY);
    if (!saved) {
      return createEmptyOrdersData();
    }

    const parsed = JSON.parse(saved);
    console.log(`Loaded ${Object.keys(parsed.orders).length} orders`);
    
    return parsed;
  } catch (error) {
    console.error('Error loading orders:', error);
    return createEmptyOrdersData();
  }
}

function saveOrders(data: OrdersData): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving orders data:', error);
  }
}

function createEmptyOrdersData(): OrdersData {
  return {
    orders: {},
    last_updated: new Date().toISOString(),
    next_order_number: 'ORD0001'
  };
}