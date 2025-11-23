'use client';

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import { useRouter } from 'next/navigation';

// Define interfaces for type safety
interface Coupon {
  id: number;
  publicId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number;
  usedCount: number;
  startDate?: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface CouponInput {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number;
  startDate?: string;
  expiryDate?: string;
}

// SWR fetcher for GET
const fetcher = (url: string): Promise<Coupon[]> => 
  fetch(url, { credentials: 'include' }).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch coupons');
    return res.json();
  });

// SWR mutation fetcher for POST (create)
async function createCoupon(url: string, { arg }: { arg: CouponInput }): Promise<Coupon> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(arg),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// SWR mutation fetcher for PATCH (update, including isActive toggle)
async function updateCoupon(url: string, { arg }: { arg: { id: number; data: Partial<CouponInput> & { isActive?: boolean } } }): Promise<Coupon> {
  const res = await fetch(`${url}/${arg.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(arg.data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// SWR mutation fetcher for DELETE
async function deleteCoupon(url: string, { arg }: { arg: number }): Promise<boolean> {
  const res = await fetch(`${url}/${arg}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export default function AdminCouponPage() {
//   const router = useRouter();
  const { data: coupons, mutate } = useSWR<Coupon[]>('/api/coupon', fetcher);
  const { trigger: create } = useSWRMutation('/api/coupon', createCoupon);
  const { trigger: update } = useSWRMutation('/api/coupon', updateCoupon);
  const { trigger: remove } = useSWRMutation('/api/coupon', deleteCoupon);

  // Form state for creating a new coupon
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [minOrderValue, setMinOrderValue] = useState<number | undefined>(undefined);
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Edit state
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);

  const handleCreate = async () => {
    if (!code || !discountValue) {
      toast.error('Code and discount value are required');
      return;
    }

    try {
      const newCoupon = await create({
        code,
        discountType,
        discountValue,
        minOrderValue: minOrderValue || undefined,
        maxUses: maxUses || undefined,
        startDate: startDate || undefined,
        expiryDate: expiryDate || undefined,
      });
      await mutate((prevCoupons) => (prevCoupons ? [...prevCoupons, newCoupon] : [newCoupon]), false);
      toast.success('Coupon created');
      // Reset form
      setCode('');
      setDiscountType('percentage');
      setDiscountValue(0);
      setMinOrderValue(undefined);
      setMaxUses(undefined);
      setStartDate('');
      setExpiryDate('');
    } catch {
      toast.error( 'Failed to create coupon');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMinOrderValue(coupon.minOrderValue || undefined);
    setMaxUses(coupon.maxUses || undefined);
    setStartDate(coupon.startDate ? coupon.startDate.split('T')[0] : '');
    setExpiryDate(coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '');
  };

  const handleUpdate = async () => {
    if (!editCoupon || !code || !discountValue) {
      toast.error('Code and discount value are required');
      return;
    }

    try {
      const updatedCoupon = await update({
        id: editCoupon.id,
        data: {
          code,
          discountType,
          discountValue,
          minOrderValue: minOrderValue || undefined,
          maxUses: maxUses || undefined,
          startDate: startDate || undefined,
          expiryDate: expiryDate || undefined,
        },
      });
      await mutate((prevCoupons) =>
        prevCoupons ? prevCoupons.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c)) : [updatedCoupon],
        false
      );
      toast.success('Coupon updated');
      setEditCoupon(null);
      setCode('');
      setDiscountType('percentage');
      setDiscountValue(0);
      setMinOrderValue(undefined);
      setMaxUses(undefined);
      setStartDate('');
      setExpiryDate('');
    } catch {
      toast.error( 'Failed to update coupon');
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const updatedCoupon = await update({
        id,
        data: { isActive: !isActive },
      });
      await mutate((prevCoupons) =>
        prevCoupons ? prevCoupons.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c)) : [updatedCoupon],
        false
      );
      toast.success(`Coupon ${!isActive ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove(id);
      await mutate((prevCoupons) => prevCoupons?.filter((c) => c.id !== id) || [], false);
      toast.success('Coupon deleted');
    } catch  {
      toast.error('Failed to delete coupon');
    }
  };

  const handleCancelEdit = () => {
    setEditCoupon(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(0);
    setMinOrderValue(undefined);
    setMaxUses(undefined);
    setStartDate('');
    setExpiryDate('');
  };

  return (
    <div className="min-h-screen bg-amber-50">
    

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-extrabold text-amber-900 mb-8">Manage Coupons</h1>

        {/* Create/Edit Form */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-amber-800 mb-6">
            {editCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Coupon Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Discount Value</label>
              <input
                type="number"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                placeholder="Enter discount value"
                className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Min Order Value (optional)</label>
              <input
                type="number"
                value={minOrderValue || ''}
                onChange={(e) => setMinOrderValue(parseFloat(e.target.value) || undefined)}
                placeholder="Min order value"
                className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Max Uses (optional)</label>
              <input
                type="number"
                value={maxUses || ''}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || undefined)}
                placeholder="Max uses"
                className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Start Date (optional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Expiry Date (optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-6 flex space-x-4">
            <button
              onClick={editCoupon ? handleUpdate : handleCreate}
              className="px-6 py-3 bg-yellow-500 text-amber-900 font-semibold rounded-lg hover:bg-yellow-600 transition"
            >
              {editCoupon ? 'Update' : 'Create'}
            </button>
            {editCoupon && (
              <button
                onClick={handleCancelEdit}
                className="px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* List Coupons */}
        <div>
          <h2 className="text-2xl font-semibold text-amber-800 mb-6">Existing Coupons</h2>
          <div className="grid gap-6">
            {coupons?.map((coupon) => (
              <div key={coupon.id} className="bg-white p-6 rounded-lg shadow-lg flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium text-amber-900"><strong>Code:</strong> {coupon.code}</p>
                  <p className="text-md text-amber-600"><strong>Type:</strong> {coupon.discountType}</p>
                  <p className="text-md text-amber-600"><strong>Value:</strong> {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '$'}</p>
                  <p className="text-md text-amber-600"><strong>Min Order:</strong> {coupon.minOrderValue ? `$${coupon.minOrderValue}` : 'N/A'}</p>
                  <p className="text-md text-amber-600"><strong>Max Uses:</strong> {coupon.maxUses || 'Unlimited'} (Used: {coupon.usedCount})</p>
                  <p className="text-md text-amber-600"><strong>Valid:</strong>{' '}
                    {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString() : 'N/A'} -{' '}
                    {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-md text-amber-600"><strong>Status:</strong> {coupon.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="px-4 py-2 bg-yellow-500 text-amber-900 font-semibold rounded-lg hover:bg-yellow-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      coupon.isActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {coupon.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}