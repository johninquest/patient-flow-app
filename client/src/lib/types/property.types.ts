import type { RecordModel } from 'pocketbase';

export interface Property {
    id: string;
    name: string;
    city: string;
    country: string; // ISO 3166-1 alpha-3 code
    address?: string;
    construction_year?: number;
    owner: string;
    created: string;
    updated: string;
}

export interface PropertyFormData {
    name: string;
    city: string;
    country: string;
    address?: string; // ✅ New field
    construction_year?: number;
}

export interface PropertyCreate {
    name: string;
    city: string;
    country: string;
    address?: string; // ✅ New field
    construction_year?: number;
}

export interface PropertyUpdate extends Partial<PropertyCreate> {}