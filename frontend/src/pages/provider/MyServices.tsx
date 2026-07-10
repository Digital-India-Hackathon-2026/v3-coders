import React, { useState, useEffect } from "react";
import { Plus, Tractor, Edit2, Trash2, Combine, Droplets, Sprout, Info } from "lucide-react";
import { KSCard, KSButton, KSModal, KSBadge } from "../../components/ui";
import API from "../../services/api";

interface Service {
  id: number;
  provider_id: number;
  name: string;
  type: string;
  price_per_hour: string;
  description: string;
  status: "available" | "unavailable";
}

const MyServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add/Edit modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState("Tractor");
  const [pricePerHour, setPricePerHour] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"available" | "unavailable">("available");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchServices = async () => {
    try {
      const res = await API.get("/services/provider");
      setServices(res.data.services);
    } catch (err: any) {
      console.error("Error loading services", err);
      setError("Failed to load your services. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setName("");
    setType("Tractor");
    setPricePerHour("");
    setDescription("");
    setStatus("available");
    setError("");
    setIsOpen(true);
  };

  const openEditModal = (service: Service) => {
    setIsEditMode(true);
    setEditingId(service.id);
    setName(service.name);
    setType(service.type);
    setPricePerHour(parseFloat(service.price_per_hour).toString());
    setDescription(service.description);
    setStatus(service.status);
    setError("");
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pricePerHour) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        name,
        type,
        pricePerHour: parseFloat(pricePerHour),
        description,
        status,
      };

      if (isEditMode && editingId) {
        await API.put(`/services/${editingId}`, payload);
      } else {
        await API.post("/services", payload);
      }

      setIsOpen(false);
      fetchServices();
    } catch (err: any) {
      console.error("Error saving service", err);
      setError(err.response?.data?.message || "Failed to save equipment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this listing? All historical bookings will remain but farmers won't be able to request this service anymore.")) return;
    
    try {
      await API.delete(`/services/${id}`);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      console.error("Error deleting service", err);
      alert(err.response?.data?.message || "Failed to delete equipment listing.");
    }
  };

  // Helper to choose icon based on type
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "tractor":
        return <Tractor size={24} />;
      case "harvester":
        return <Combine size={24} />;
      case "seeder":
        return <Sprout size={24} />;
      case "sprayer":
        return <Droplets size={24} />;
      default:
        return <Tractor size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Equipment & Services</h1>
          <p className="text-slate-500 mt-1">Manage, add or update the machinery/services you offer to farmers.</p>
        </div>
        <KSButton onClick={openAddModal} className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 flex items-center gap-2 border-0">
          <Plus size={20} />
          Add Equipment
        </KSButton>
      </div>

      {error && !isOpen && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-12 text-center text-slate-400">
          No equipment registered yet. Click "Add Equipment" to get started.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((s) => (
            <KSCard key={s.id} className="flex justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-yellow-50 text-yellow-600 rounded-2xl shrink-0">
                  {getTypeIcon(s.type)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{s.name}</h3>
                  <p className="text-sm font-semibold text-slate-400 mt-1 capitalize">{s.type} Service</p>
                  <p className="text-green-700 font-bold mt-2">
                    ₹{parseFloat(s.price_per_hour).toLocaleString("en-IN")}/hour
                  </p>
                  {s.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic">{s.description}</p>
                  )}
                  <div className="mt-3">
                    <KSBadge variant={s.status === "available" ? "success" : "warning"}>
                      <span className="capitalize">{s.status}</span>
                    </KSBadge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(s)}
                  className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition cursor-pointer"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-2 border border-slate-100 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </KSCard>
          ))}
        </div>
      )}

      {/* Register/Edit Equipment Modal */}
      <KSModal isOpen={isOpen} onClose={() => setIsOpen(false)} title={isEditMode ? "Update Equipment Details" : "Register New Equipment"}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Equipment / Vehicle Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mahindra Arjun Novo 605"
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Service Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition bg-white text-sm"
              >
                <option value="Tractor">Tractor</option>
                <option value="Harvester">Harvester</option>
                <option value="Seeder">Seeder</option>
                <option value="Sprayer">Sprayer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rate (₹ per hour)</label>
              <input
                type="number"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                placeholder="e.g. 800"
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more info like model year, attachments included, transport charges extra, etc..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition text-sm"
            />
          </div>

          {isEditMode && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === "available"}
                    onChange={() => setStatus("available")}
                    className="accent-yellow-500"
                  />
                  Available
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === "unavailable"}
                    onChange={() => setStatus("unavailable")}
                    className="accent-yellow-500"
                  />
                  Unavailable
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <KSButton variant="outline" className="w-1/2 justify-center" disabled={submitting} onClick={() => setIsOpen(false)}>
              Cancel
            </KSButton>
            <KSButton type="submit" disabled={submitting} className="w-1/2 justify-center bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold border-0">
              {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Register"}
            </KSButton>
          </div>
        </form>
      </KSModal>
    </div>
  );
};

export default MyServices;
