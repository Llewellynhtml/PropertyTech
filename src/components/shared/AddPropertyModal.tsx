import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Camera, 
  MapPin, 
  Type, 
  CircleDollarSign,
  Bed,
  Bath,
  Car,
  Maximize,
  Plus,
  FileText,
  Loader2,
  CheckCircle2,
  Trash2,
  UploadCloud,
  Droplet,
  Dumbbell,
  Shield,
  Wifi,
  Trees,
  Heart,
  Wind,
  Sparkles,
  Link,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { SA_PROVINCES } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const amenityIconMap: Record<string, any> = {
  pool: Droplet,
  droplet: Droplet,
  gym: Dumbbell,
  dumbbell: Dumbbell,
  security: Shield,
  shield: Shield,
  wifi: Wifi,
  wifi_high: Wifi,
  leaf: Leaf,
  trees: Trees,
  garden: Trees,
  heart: Heart,
  pet: Heart,
  wind: Wind,
  ac: Wind,
  car: Car,
  parking: Car
};

export default function AddPropertyModal({ isOpen, onClose, onSuccess }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    area: '',
    city: '',
    province: 'Gauteng',
    beds: '1',
    baths: '1',
    parking: '1',
    size: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800',
    listing_type: 'sale' as 'sale' | 'rent',
    status: 'Active'
  });

  // Amenities & Drag-and-drop Image Upload State
  const [amenities, setAmenities] = useState<any[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false);
  
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: string;
    file?: File;
    previewUrl: string;
    url?: string;
    name: string;
    size: string;
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');

  // Fetch or Seed Amenities on Modal Open
  useEffect(() => {
    if (isOpen) {
      fetchOrCreateAmenities();
    }
  }, [isOpen]);

  const fetchOrCreateAmenities = async () => {
    setIsLoadingAmenities(true);
    try {
      const { data, error } = await supabase.from('amenities').select('*');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAmenities(data);
      } else {
        // Seed default amenities into the table if empty so that layout works perfectly
        const defaults = [
          { name: 'Swimming Pool', icon: 'pool' },
          { name: 'Home Gym', icon: 'gym' },
          { name: '24/7 Security Patrol', icon: 'security' },
          { name: 'High-Speed Fibre WiFi', icon: 'wifi' },
          { name: 'Private Landscaped Garden', icon: 'leaf' },
          { name: 'Pet Friendly Policy', icon: 'heart' },
          { name: 'Air Conditioning', icon: 'wind' },
          { name: 'Garage / Carport', icon: 'car' }
        ];
        
        const { data: inserted, error: insertErr } = await supabase
          .from('amenities')
          .insert(defaults)
          .select();
        
        if (insertErr) {
          // Local fallback in case of strict rule limitations
          setAmenities(defaults.map((d, i) => ({ id: `local-${i}`, ...d })));
        } else if (inserted) {
          setAmenities(inserted);
        }
      }
    } catch (err) {
      console.error('Error fetching/seeding amenities:', err);
      // Inline local fallback
      setAmenities([
        { id: 'local-1', name: 'Swimming Pool', icon: 'pool' },
        { id: 'local-2', name: 'Home Gym', icon: 'gym' },
        { id: 'local-3', name: '24/7 Security Patrol', icon: 'security' },
        { id: 'local-4', name: 'High-Speed Fibre WiFi', icon: 'wifi' },
        { id: 'local-5', name: 'Private Landscaped Garden', icon: 'leaf' },
        { id: 'local-6', name: 'Pet Friendly Policy', icon: 'heart' },
        { id: 'local-7', name: 'Air Conditioning', icon: 'wind' },
        { id: 'local-8', name: 'Garage / Carport', icon: 'car' }
      ]);
    } finally {
      setIsLoadingAmenities(false);
    }
  };

  if (!isOpen) return null;

  // Helper to format file sizes elegantly
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const newImages = imageFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: formatBytes(file.size)
    }));
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleAddPastedUrl = () => {
    if (!pastedUrl.trim()) return;
    const newImage = {
      id: Math.random().toString(36).substring(2, 9),
      previewUrl: pastedUrl.trim(),
      url: pastedUrl.trim(),
      name: 'External image link',
      size: 'Remote URL'
    };
    setUploadedImages(prev => [...prev, newImage]);
    setPastedUrl('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalImageUrls: string[] = [];
      
      // Process uploaded images - reading any raw files as base64 for reliable direct injection into db row
      for (const img of uploadedImages) {
        if (img.file) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(img.file);
          });
          finalImageUrls.push(base64);
        } else if (img.url) {
          finalImageUrls.push(img.url);
        }
      }

      // Beautiful fallback placeholder series if no images are custom-defined
      if (finalImageUrls.length === 0) {
        finalImageUrls.push(
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800'
        );
      }

      const { data: insertedProp, error: insertError } = await supabase.from('properties').insert({
        title: formData.title,
        price: parseFloat(formData.price) || 0,
        city: formData.city,
        area: formData.area,
        province: formData.province,
        beds: parseInt(formData.beds) || 0,
        baths: parseInt(formData.baths) || 0,
        parking: parseInt(formData.parking) || 0,
        size: parseFloat(formData.size) || 0,
        description: formData.description,
        listing_type: formData.listing_type,
        status: formData.status,
        image_url: finalImageUrls[0], // primary fallback
        image_urls: finalImageUrls,   // multiple gallery items
        agent_id: user?.role === 'agent' ? user.id : null,
        agency_id: user?.agency_id || (user?.role === 'agency' ? user.id : null),
        created_by_id: user?.id,
        created_by_role: user?.role || 'agent'
      }).select().single();

      if (insertError) throw insertError;

      // Create mapping relationship to link selected amenities to the property
      if (insertedProp?.id && selectedAmenities.length > 0) {
        try {
          const joinRecords = selectedAmenities.map(amenityId => ({
            property_id: insertedProp.id,
            amenity_id: amenityId
          }));
          const { error: joinError } = await supabase
            .from('property_amenities')
            .insert(joinRecords);

          if (joinError) {
            console.warn('Could not insert items to property_amenities join table. Falling back safely.', joinError);
          }
        } catch (joinErr) {
          console.warn('Silent skip of property_amenities mapping:', joinErr);
        }
      }

      onSuccess();
      setStep(1);
      setFormData({
        title: '', price: '', area: '', city: '', province: 'Gauteng',
        beds: '1', baths: '1', parking: '1', size: '', description: '',
        image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800',
        listing_type: 'sale',
        status: 'Active'
      });
      setUploadedImages([]);
      setSelectedAmenities([]);
    } catch (error) {
      console.error('Error adding property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Add New Listing</h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Step {step} of 3</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Type className="w-3 h-3 text-indigo-600" /> Property Title
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Modern 3-Bedroom Penthouse"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <CircleDollarSign className="w-3 h-3 text-indigo-600" /> Price (ZAR)
                    </label>
                    <input 
                      type="number"
                      placeholder="e.g. 2500000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-indigo-600" /> Province
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      {SA_PROVINCES.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      City
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Sandton"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      Area/Suburb
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Morningside"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      Listing Type
                    </label>
                    <select
                      value={formData.listing_type}
                      onChange={(e) => setFormData({ ...formData, listing_type: e.target.value as 'sale' | 'rent' })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="sale">For Sale</option>
                      <option value="rent">To Rent</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Sold">Sold</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Beds', icon: Bed, key: 'beds', placeholder: 'e.g. 3' },
                    { label: 'Baths', icon: Bath, key: 'baths', placeholder: 'e.g. 2' },
                    { label: 'Parking', icon: Car, key: 'parking', placeholder: 'e.g. 2' },
                    { label: 'Size (m²)', icon: Maximize, key: 'size', placeholder: 'e.g. 150' }
                  ].map(spec => (
                    <div key={spec.key} className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <spec.icon className="w-4 h-4 text-indigo-600 flex-shrink-0" /> {spec.label}
                      </label>
                      <input 
                        type="number"
                        min="0"
                        placeholder={spec.placeholder}
                        value={(formData as any)[spec.key]}
                        onChange={(e) => setFormData({ ...formData, [spec.key]: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3 h-3 text-indigo-600" /> Description
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Describe the property's best features..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Amenities Multi-Select Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Property Amenities & Features
                    </label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {selectedAmenities.length} Selected
                    </span>
                  </div>

                  {isLoadingAmenities ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading amenities...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {amenities.map(amenity => {
                        const isSelected = selectedAmenities.includes(amenity.id || amenity.name);
                        const IconComponent = amenityIconMap[amenity.icon] || Sparkles;
                        return (
                          <button
                            type="button"
                            key={amenity.id || amenity.name}
                            onClick={() => {
                              const identifier = amenity.id || amenity.name;
                              setSelectedAmenities(prev =>
                                prev.includes(identifier)
                                  ? prev.filter(id => id !== identifier)
                                  : [...prev, identifier]
                              );
                            }}
                            className={cn(
                              "flex items-center gap-3 p-3.5 rounded-2xl text-left border-2 font-bold text-xs transition-all duration-200 group relative overflow-hidden",
                              isSelected
                                ? "bg-indigo-50/50 border-indigo-600 text-indigo-950 shadow-md shadow-indigo-100/50"
                                : "bg-gray-50/50 border-transparent hover:border-gray-200 text-gray-600 hover:text-gray-900"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-100 text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50"
                            )}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <span className="flex-1 truncate">{amenity.name}</span>
                            {isSelected && (
                              <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-600 rounded-bl-lg flex items-center justify-center text-[8px] text-white">
                                ✓
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Advanced Multi-File Drag and Drop Component */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('property-multi-file-picker')?.click()}
                  className={cn(
                    "border-4 border-dashed rounded-[2rem] p-12 text-center group transition-all cursor-pointer relative overflow-hidden",
                    isDragging 
                      ? "border-indigo-600 bg-indigo-50/35 scale-[0.99]" 
                      : "border-gray-50 hover:border-indigo-100 hover:bg-gray-50/20"
                  )}
                >
                  <input 
                    type="file" 
                    id="property-multi-file-picker"
                    multiple 
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <UploadCloud className="w-10 h-10 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Drag & Drop Listing Photos</h3>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                    Supports selecting multiple high-res photos
                  </p>
                  <p className="text-[11px] text-indigo-600 font-black mt-3 flex items-center justify-center gap-1.5 hover:underline">
                    Or click here to browse files
                  </p>
                </div>

                {/* Paste URL Optional Flex Field */}
                <div className="bg-gray-50 rounded-2xl p-4 flex gap-2 items-center">
                  <div className="p-2 bg-white rounded-xl text-gray-400 flex-shrink-0">
                    <Link className="w-4 h-4" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Alternatively, paste external image URL..."
                    value={pastedUrl}
                    onChange={(e) => setPastedUrl(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold w-full text-gray-700 placeholder:text-gray-400 focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={handleAddPastedUrl}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest"
                  >
                    Add
                  </button>
                </div>

                {/* Beautiful dynamic grid displaying multi-image uploads */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Selected Photos ({uploadedImages.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {uploadedImages.map((img) => (
                        <div 
                          key={img.id}
                          className="group relative aspect-[1.4] bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
                        >
                          <img 
                            src={img.previewUrl} 
                            alt={img.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-white flex flex-col justify-end min-h-[50%]">
                            <span className="text-[10px] font-bold truncate block">{img.name}</span>
                            <span className="text-[8px] opacity-75 font-mono">{img.size}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(img.id);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-bold text-emerald-700 italic leading-snug">
                    Instant local file rendering enabled. Images will publish directly on the listing card.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
          {step > 1 ? (
            <button 
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-4 text-gray-400 font-black text-sm uppercase tracking-widest hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button 
              onClick={nextStep}
              disabled={!formData.title || !formData.price}
              className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              Next Step <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 stroke-[3px]" />}
              Publish Listing
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
