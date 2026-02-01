import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Customer, Driver, Route, Vehicle, Transaction, Expense } from '../types';

export function useSupabaseData() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                const [custRes, drivRes, vehRes, routeRes, transRes, expRes] = await Promise.all([
                    supabase.from('customers').select('*'),
                    supabase.from('drivers').select('*'),
                    supabase.from('vehicles').select('*'),
                    supabase.from('routes').select('*'),
                    supabase.from('transactions').select('*').order('timestamp', { ascending: false }),
                    supabase.from('expenses').select('*').order('date', { ascending: false })
                ]);

                if (custRes.error) throw custRes.error;
                if (drivRes.error) throw drivRes.error;
                if (vehRes.error) throw vehRes.error;
                if (routeRes.error) throw routeRes.error;
                if (transRes.error) throw transRes.error;
                if (expRes.error) throw expRes.error;

                // Map Supabase responses (snake_case) to local types (camelCase)
                const mapCustomer = (c: any): Customer => ({
                    id: c.id,
                    displayId: c.display_id,
                    name: c.name,
                    phone: c.phone,
                    whatsapp: c.whatsapp,
                    nic: c.nic,
                    dob: c.dob,
                    address: c.address,
                    lat: c.lat,
                    lng: c.lng,
                    routeId: c.route_id,
                    waterType: c.water_type,
                    pricePerUnit: c.price_per_unit,
                    creditAllowed: c.credit_allowed,
                    creditLimit: c.credit_limit,
                    balance: c.balance,
                    status: c.status
                });

                const mapDriver = (d: any): Driver => ({
                    id: d.id,
                    name: d.name,
                    phone: d.phone,
                    email: d.email,
                    nic: d.nic,
                    licenseNo: d.license_no,
                    licenseExpiry: d.license_expiry,
                    dailySalary: d.daily_salary,
                    commissionPct: d.commission_pct,
                    status: d.status
                });

                const mapVehicle = (v: any): Vehicle => ({
                    id: v.id,
                    number: v.number,
                    capacityValue: v.capacity_value,
                    capacityUnit: v.capacity_unit,
                    waterTypeAllowed: v.water_type_allowed,
                    assignedDriverId: v.assigned_driver_id,
                    fuelType: v.fuel_type,
                    avgMileage: v.avg_mileage,
                    width: v.width,
                    height: v.height,
                    status: v.status
                });

                const mapRoute = (r: any): Route => ({
                    id: r.id,
                    name: r.name,
                    vehicleId: r.vehicle_id,
                    driverId: r.driver_id,
                    customerIds: [] // Will be computed if needed, or backend doesn't provide it directly
                });

                const mapTransaction = (t: any): Transaction => ({
                    id: t.id,
                    customerId: t.customer_id,
                    driverId: t.driver_id,
                    quantity: t.quantity,
                    total: t.total,
                    paymentMethod: t.payment_method,
                    timestamp: t.timestamp,
                    status: t.status,
                    gpsProof: t.gps_proof
                });

                setCustomers((custRes.data || []).map(mapCustomer));
                setDrivers((drivRes.data || []).map(mapDriver));
                setVehicles((vehRes.data || []).map(mapVehicle));
                setRoutes((routeRes.data || []).map(mapRoute));
                setTransactions((transRes.data || []).map(mapTransaction));
                setExpenses(expRes.data as unknown as Expense[]); // Expenses match 1:1 except maybe casing? checked schema: title,amount,category,description,date. Matches Types.

            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return { customers, drivers, vehicles, routes, transactions, expenses, loading, error };
}
