
export enum UserRole {
  ADMIN = 'ADMIN',
  DISPATCHER = 'DISPATCHER',
  DRIVER = 'DRIVER',
  FINANCE = 'FINANCE'
}

export interface Customer {
  id: string;
  displayId?: string;
  name: string;
  phone: string;
  whatsapp?: string;
  nic?: string;
  dob?: string;
  address: string;
  lat: number;
  lng: number;
  routeId: string;
  waterType: 'Drinking' | 'RO' | 'Well' | 'Industrial';
  pricePerUnit: number;
  creditAllowed: boolean;
  creditLimit: number;
  balance: number;
  status: 'Active' | 'Inactive';
}

export interface Vehicle {
  id: string;
  number: string;
  capacityValue: number;
  capacityUnit: 'Liters' | 'Bottles';
  waterTypeAllowed: string[];
  assignedDriverId: string;
  status: 'Active' | 'Repair';
  fuelType: 'Diesel' | 'Petrol' | 'Electric';
  avgMileage: number;
  width?: number;
  height?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  nic: string;
  licenseNo: string;
  licenseExpiry: string;
  email?: string;
  dailySalary: number;
  commissionPct: number;
  status: 'Available' | 'On Route' | 'Leave';
}

export interface Route {
  id: string;
  name: string;
  vehicleId: string;
  driverId: string;
  customerIds: string[];
}

export interface Transaction {
  id: string;
  customerId: string;
  driverId: string;
  quantity: number;
  total: number;
  paymentMethod: 'Cash' | 'Credit' | 'QR';
  timestamp: string;
  status: 'Completed' | 'Skipped' | 'Partial';
  gpsProof?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'Operating Cost' | 'Maintenance' | 'Salary/Comm' | 'Other' | 'Fuel';
  description?: string;
  date: string;
}
