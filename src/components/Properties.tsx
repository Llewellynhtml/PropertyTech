import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  MoreHorizontal,
  Home,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Maximize,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { Property } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Properties({ onAddProperty, refreshTrigger }: any) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    title: '',
    price: '',
    city: '',
    area: '',
    beds: '',
    baths: '',
    parking: '',
    size: '',
    description: '',
    listing_type: 'sale',
    status: 'Active',
    province: 'Gauteng'
  });

  useEffect(() => {
    if (selectedProperty) {
      setEditForm({
        title: selectedProperty.title || '',
        price: selectedProperty.price?.toString() || '',
        city: selectedProperty.city || '',
        area: selectedProperty.area || '',
        beds: selectedProperty.beds?.toString() || '0',
        baths: selectedProperty.baths?.toString() || '0',
        parking: selectedProperty.parking?.toString() || '0',
        size: selectedProperty.size?.toString() || '',
        description: selectedProperty.description || '',
        listing_type: selectedProperty.listing_type || 'sale',
        status: selectedProperty.status || 'Active',
        province: (selectedProperty as any).province || 'Gauteng'
      });
    }
  }, [selectedProperty]);

  const handleSaveProperty = async () => {
    if (!selectedProperty) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          title: editForm.title,
          price: parseFloat(editForm.price) || 0,
          city: editForm.city,
          area: editForm.area,
          beds: parseInt(editForm.beds) || 0,
          baths: parseInt(editForm.baths) || 0,
          parking: parseInt(editForm.parking) || 0,
          size: parseFloat(editForm.size) || 0,
          description: editForm.description,
          listing_type: editForm.listing_type as 'sale' | 'rent',
          status: editForm.status,
          province: editForm.province
        })
        .eq('id', selectedProperty.id);

      if (error) throw error;
      
      // Refresh list
      await fetchProperties();
      setSelectedProperty(null);
    } catch (err) {
      console.error('Error saving property:', err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [refreshTrigger]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                         p.area.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Listings</h1>
          <p className="text-gray-500 font-medium mt-1">Manage and optimize your active property portfolio</p>
        </div>
        <button 
          onClick={onAddProperty}
          className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[3px]" />
          Add New Listing
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by title, area, or province..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'Active', 'Sold', 'Pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
                filter === f 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Property Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-[4/5] bg-gray-100 rounded-[2.5rem] animate-pulse" />
          ))}
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {filteredProperties.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={p.image_urls?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'} 
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                  {(() => {
                    const currentStatus = (selectedProperty && selectedProperty.id === p.id) ? editForm.status : p.status;
                    return (
                      <span className={cn(
                        "px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg transition-all duration-300",
                        currentStatus === 'Active' && "bg-emerald-500 text-white",
                        currentStatus === 'Pending' && "bg-amber-500 text-white",
                        currentStatus === 'Sold' && "bg-rose-500 text-white",
                        !['Active', 'Pending', 'Sold'].includes(currentStatus || '') && "bg-gray-900 text-white"
                      )}>
                        {currentStatus}
                      </span>
                    );
                  })()}
                </div>
                <div className="absolute top-4 right-4 group-hover:opacity-100 opacity-0 transition-opacity">
                  <button className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-gray-900 shadow-lg">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-1 text-gray-400 mb-1">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{p.area}, {p.city}</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-all line-clamp-2 leading-tight min-h-[2.75rem]" title={p.title}>
                    {(selectedProperty && selectedProperty.id === p.id) ? editForm.title : p.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      <span className="text-xs font-bold">{p.beds}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-4 h-4" />
                      <span className="text-xs font-bold">{p.baths}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-4 h-4" />
                      <span className="text-xs font-bold">{p.parking}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-gray-900">R {p.price?.toLocaleString()}</p>
                    {p.size && p.size > 0 ? (
                      <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                        R {Math.round(p.price / p.size).toLocaleString()}/m² ({p.size} m²)
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Ready</span>
                  </div>
                  <button 
                    onClick={() => setSelectedProperty(p)}
                    className="px-4 py-2 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] py-32 flex flex-col items-center justify-center text-center border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Home className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">Ready to grow your business? Start by adding your first property listing.</p>
          <button 
            onClick={onAddProperty}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Create Your First Listing
          </button>
        </div>
      )}

      <AnimatePresence>
        {selectedProperty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProperty(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-8 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Property Details</h2>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">View or Update Listing Information</p>
                </div>
                <button 
                  onClick={() => setSelectedProperty(null)}
                  className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-8 overflow-y-auto space-y-6 flex-1">
                {/* Visual Cover image */}
                <div className="relative h-48 rounded-[2rem] overflow-hidden">
                  <img 
                    src={selectedProperty.image_urls?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'} 
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400">{editForm.listing_type === 'sale' ? 'For Sale' : 'To Rent'}</span>
                    <h3 className="text-xl font-black truncate">{editForm.title}</h3>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Property Title
                      </label>
                      <input 
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Price (ZAR)
                      </label>
                      <input 
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Listing Type
                      </label>
                      <select
                        value={editForm.listing_type}
                        onChange={(e) => setEditForm({ ...editForm, listing_type: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="sale">For Sale</option>
                        <option value="rent">To Rent</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Sold">Sold</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Province
                      </label>
                      <select
                        value={editForm.province}
                        onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                      >
                        {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        City
                      </label>
                      <input 
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Area
                      </label>
                      <input 
                        type="text"
                        value={editForm.area}
                        onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Beds, Baths, Parking, Size as numeric inputs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {[
                      { label: 'Beds', icon: Bed, key: 'beds', placeholder: 'e.g. 3' },
                      { label: 'Baths', icon: Bath, key: 'baths', placeholder: 'e.g. 2' },
                      { label: 'Parking', icon: Car, key: 'parking', placeholder: 'e.g. 2' },
                      { label: 'Size (m²)', icon: Maximize, key: 'size', placeholder: 'e.g. 150' }
                    ].map(spec => (
                      <div key={spec.key} className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <spec.icon className="w-3.5 h-3.5 text-indigo-600" /> {spec.label}
                        </label>
                        <input 
                          type="number"
                          min="0"
                          placeholder={spec.placeholder}
                          value={(editForm as any)[spec.key]}
                          onChange={(e) => setEditForm({ ...editForm, [spec.key]: e.target.value })}
                          className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-center text-gray-700 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const priceVal = parseFloat(editForm.price) || 0;
                    const sizeVal = parseFloat(editForm.size) || 0;
                    if (priceVal && sizeVal) {
                      const rate = Math.round(priceVal / sizeVal);
                      return (
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-center justify-between text-indigo-950 mt-4 transition-all">
                          <div className="flex items-center gap-2">
                            <Maximize className="w-4 h-4 text-indigo-600 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Calculated Value (Price / m²)</span>
                          </div>
                          <span className="font-sans font-black text-sm text-indigo-900">R {rate.toLocaleString()} / m²</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Description
                    </label>
                    <textarea 
                      rows={4}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
                <button 
                  onClick={() => setSelectedProperty(null)}
                  className="px-6 py-4 text-gray-400 font-black text-sm uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProperty}
                  disabled={isSaving || !editForm.title || !editForm.price}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50 pointer-events-auto"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
