import { supabase } from '../utils/supabase';
import { Customer, Vehicle, Driver, Route, Transaction, Expense } from '../types';

export function useSupabaseMutations() {

    // --- Customers ---
    const addCustomer = async (customer: Omit<Customer, 'id' | 'status' | 'balance'>) => {
        const { data, error } = await supabase.from('customers').insert([{
            name: customer.name,
            phone: customer.phone,
            whatsapp: customer.whatsapp,
            nic: customer.nic,
            dob: customer.dob || null,
            address: customer.address,
            display_id: customer.displayId,
            lat: customer.lat,
            lng: customer.lng,
            route_id: customer.routeId,
            water_type: customer.waterType,
            price_per_unit: customer.pricePerUnit,
            credit_allowed: customer.creditAllowed,
            credit_limit: customer.creditLimit,
            balance: 0,
            status: 'Active'
        }]).select().single();

        if (error) throw error;
        // Map response to camelCase
        return {
            id: data.id,
            name: data.name,
            phone: data.phone,
            whatsapp: data.whatsapp,
            nic: data.nic,
            dob: data.dob,
            address: data.address,
            displayId: data.display_id,
            lat: data.lat,
            lng: data.lng,
            routeId: data.route_id,
            waterType: data.water_type,
            pricePerUnit: data.price_per_unit,
            creditAllowed: data.credit_allowed,
            creditLimit: data.credit_limit,
            balance: data.balance,
            status: data.status
        };
    };

    const updateCustomer = async (id: string, updates: Partial<Customer>) => {
        // Map camelCase to snake_case for DB
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.phone) dbUpdates.phone = updates.phone;
        if (updates.whatsapp) dbUpdates.whatsapp = updates.whatsapp;
        if (updates.nic) dbUpdates.nic = updates.nic;
        if (updates.dob) dbUpdates.dob = updates.dob;
        if (updates.address) dbUpdates.address = updates.address;
        if (updates.displayId) dbUpdates.display_id = updates.displayId;
        if (updates.lat) dbUpdates.lat = updates.lat;
        if (updates.lng) dbUpdates.lng = updates.lng;
        if (updates.routeId) dbUpdates.route_id = updates.routeId;
        if (updates.waterType) dbUpdates.water_type = updates.waterType;
        if (updates.pricePerUnit) dbUpdates.price_per_unit = updates.pricePerUnit;
        if (updates.creditAllowed !== undefined) dbUpdates.credit_allowed = updates.creditAllowed;
        if (updates.creditLimit) dbUpdates.credit_limit = updates.creditLimit;
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase.from('customers').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            phone: data.phone,
            whatsapp: data.whatsapp,
            nic: data.nic,
            dob: data.dob,
            address: data.address,
            displayId: data.display_id,
            lat: data.lat,
            lng: data.lng,
            routeId: data.route_id,
            waterType: data.water_type,
            pricePerUnit: data.price_per_unit,
            creditAllowed: data.credit_allowed,
            creditLimit: data.credit_limit,
            balance: data.balance,
            status: data.status
        };
    };

    const deleteCustomer = async (id: string) => {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) throw error;
    };

    // --- Vehicles ---
    const addVehicle = async (vehicle: Omit<Vehicle, 'id' | 'status'>) => {
        const { data, error } = await supabase.from('vehicles').insert([{
            number: vehicle.number,
            capacity_value: vehicle.capacityValue,
            capacity_unit: vehicle.capacityUnit,
            water_type_allowed: vehicle.waterTypeAllowed,
            assigned_driver_id: vehicle.assignedDriverId, // Make sure this is UUID or null
            fuel_type: vehicle.fuelType,
            avg_mileage: vehicle.avgMileage,
            width: vehicle.width,
            height: vehicle.height,
            status: 'Active'
        }]).select().single();
        if (error) throw error;
        return {
            id: data.id,
            number: data.number,
            capacityValue: data.capacity_value,
            capacityUnit: data.capacity_unit,
            waterTypeAllowed: data.water_type_allowed,
            assignedDriverId: data.assigned_driver_id,
            fuelType: data.fuel_type,
            avgMileage: data.avg_mileage,
            width: data.width,
            height: data.height,
            status: data.status
        };
    };

    const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
        const dbUpdates: any = {};
        if (updates.number) dbUpdates.number = updates.number;
        if (updates.capacityValue) dbUpdates.capacity_value = updates.capacityValue;
        if (updates.capacityUnit) dbUpdates.capacity_unit = updates.capacityUnit;
        if (updates.assignedDriverId) dbUpdates.assigned_driver_id = updates.assignedDriverId;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.fuelType) dbUpdates.fuel_type = updates.fuelType;
        if (updates.avgMileage) dbUpdates.avg_mileage = updates.avgMileage;
        if (updates.width) dbUpdates.width = updates.width;
        if (updates.height) dbUpdates.height = updates.height;

        const { data, error } = await supabase.from('vehicles').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return {
            id: data.id,
            number: data.number,
            capacityValue: data.capacity_value,
            capacityUnit: data.capacity_unit,
            waterTypeAllowed: data.water_type_allowed,
            assignedDriverId: data.assigned_driver_id,
            fuelType: data.fuel_type,
            avgMileage: data.avg_mileage,
            width: data.width,
            height: data.height,
            status: data.status
        };
    };

    const deleteVehicle = async (id: string) => {
        const { error } = await supabase.from('vehicles').delete().eq('id', id);
        if (error) throw error;
    };

    // --- Drivers ---
    const addDriver = async (driver: Omit<Driver, 'id' | 'status'>) => {
        const { data, error } = await supabase.from('drivers').insert([{
            name: driver.name,
            phone: driver.phone,
            nic: driver.nic,
            license_no: driver.licenseNo,
            license_expiry: driver.licenseExpiry,
            email: driver.email,
            daily_salary: driver.dailySalary,
            commission_pct: driver.commissionPct,
            status: 'Available'
        }]).select().single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            phone: data.phone,
            nic: data.nic,
            licenseNo: data.license_no,
            licenseExpiry: data.license_expiry,
            dailySalary: data.daily_salary,
            commissionPct: data.commission_pct,
            status: data.status
        };
    };

    const updateDriver = async (id: string, updates: Partial<Driver>) => {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.phone) dbUpdates.phone = updates.phone;
        if (updates.nic) dbUpdates.nic = updates.nic;
        if (updates.licenseNo) dbUpdates.license_no = updates.licenseNo;
        if (updates.licenseExpiry) dbUpdates.license_expiry = updates.licenseExpiry;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.dailySalary) dbUpdates.daily_salary = updates.dailySalary;
        if (updates.commissionPct) dbUpdates.commission_pct = updates.commissionPct;
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase.from('drivers').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            phone: data.phone,
            nic: data.nic,
            licenseNo: data.license_no,
            licenseExpiry: data.license_expiry,
            dailySalary: data.daily_salary,
            commissionPct: data.commission_pct,
            status: data.status
        };
    };

    const deleteDriver = async (id: string) => {
        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (error) throw error;
    };

    // --- Routes ---
    const addRoute = async (route: Omit<Route, 'id'>) => {
        const { data, error } = await supabase.from('routes').insert([{
            name: route.name,
            vehicle_id: route.vehicleId,
            driver_id: route.driverId
        }]).select().single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            vehicleId: data.vehicle_id,
            driverId: data.driver_id,
            customerIds: []
        };
    };

    // --- Transactions ---
    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        const { data, error } = await supabase.from('transactions').insert([{
            customer_id: transaction.customerId,
            driver_id: transaction.driverId,
            quantity: transaction.quantity,
            total: transaction.total,
            payment_method: transaction.paymentMethod,
            timestamp: transaction.timestamp,
            status: transaction.status,
            gps_proof: transaction.gpsProof
        }]).select().single();
        if (error) throw error;
        return {
            id: data.id,
            customerId: data.customer_id,
            driverId: data.driver_id,
            quantity: data.quantity,
            total: data.total,
            paymentMethod: data.payment_method,
            timestamp: data.timestamp,
            status: data.status,
            gpsProof: data.gps_proof
        };
    };

    // --- Expenses ---
    const addExpense = async (expense: Omit<Expense, 'id' | 'date'>) => {
        const { data, error } = await supabase.from('expenses').insert([{
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            description: expense.description
        }]).select().single();
        if (error) throw error;
        return data;
    };

    return {
        addCustomer, updateCustomer, deleteCustomer,
        addVehicle, updateVehicle, deleteVehicle,
        addDriver, updateDriver, deleteDriver,
        addRoute,
        addTransaction,
        addExpense
    };
}
