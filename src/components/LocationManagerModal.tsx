'use client';

import React, { useState } from 'react';
import { Location, SubLocation } from '@/types/league';
import { X, Building2, Plus, MapPin, Trash2, Edit3, Check, Layers } from 'lucide-react';

interface LocationManagerModalProps {
  locations: Location[];
  isOpen: boolean;
  onClose: () => void;
  onAddLocation: (name: string, address: string, parkingInfo?: string) => void;
  onUpdateLocation: (id: string, name: string, address: string, parkingInfo?: string) => void;
  onDeleteLocation: (id: string) => void;
  onAddSubLocation: (locationId: string, name: string, surface: SubLocation['surface']) => void;
  onUpdateSubLocation: (locationId: string, subLocationId: string, name: string, surface: SubLocation['surface']) => void;
  onRemoveSubLocation: (locationId: string, subLocationId: string) => void;
}

export const LocationManagerModal: React.FC<LocationManagerModalProps> = ({
  locations,
  isOpen,
  onClose,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onAddSubLocation,
  onUpdateSubLocation,
  onRemoveSubLocation,
}) => {
  // New Location Form State
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocParking, setNewLocParking] = useState('');

  // Editing Location State
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [editLocAddress, setEditLocAddress] = useState('');
  const [editLocParking, setEditLocParking] = useState('');

  // Sub-location Modal State per Location
  const [activeLocIdForSub, setActiveLocIdForSub] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubSurface, setNewSubSurface] = useState<SubLocation['surface']>('Hardwood');

  // Editing Sub-location State
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubSurface, setEditSubSurface] = useState<SubLocation['surface']>('Hardwood');

  if (!isOpen) return null;

  // Add primary location
  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim() || !newLocAddress.trim()) return;

    onAddLocation(newLocName.trim(), newLocAddress.trim(), newLocParking.trim() || undefined);
    setNewLocName('');
    setNewLocAddress('');
    setNewLocParking('');
    setShowAddLocationForm(false);
  };

  // Start editing location
  const startEditingLocation = (loc: Location) => {
    setEditingLocId(loc.id);
    setEditLocName(loc.name);
    setEditLocAddress(loc.address);
    setEditLocParking(loc.parkingInfo || '');
  };

  // Save location edit
  const handleSaveLocationEdit = (locId: string) => {
    if (!editLocName.trim() || !editLocAddress.trim()) return;
    onUpdateLocation(locId, editLocName.trim(), editLocAddress.trim(), editLocParking.trim() || undefined);
    setEditingLocId(null);
  };

  // Add sub-location
  const handleCreateSubLocation = (locationId: string) => {
    if (!newSubName.trim()) return;
    onAddSubLocation(locationId, newSubName.trim(), newSubSurface);
    setNewSubName('');
    setActiveLocIdForSub(null);
  };

  // Start editing sub-location
  const startEditingSubLocation = (sub: SubLocation) => {
    setEditingSubId(sub.id);
    setEditSubName(sub.name);
    setEditSubSurface(sub.surface);
  };

  // Save sub-location edit
  const handleSaveSubLocationEdit = (locationId: string, subId: string) => {
    if (!editSubName.trim()) return;
    onUpdateSubLocation(locationId, subId, editSubName.trim(), editSubSurface);
    setEditingSubId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#15171b] border border-[#e5e7eb] dark:border-[#1c1f24] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#0e1012] border-b border-[#e5e7eb] dark:border-[#1c1f24] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#1c1f24] text-[#242424] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#242424] dark:text-white">Locations & Sub-Locations Manager</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure Primary Facilities and Court/Gym Sub-locations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Top Bar with Add Location Button */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Primary Venues ({locations.length})
            </h4>
            {!showAddLocationForm && (
              <button
                onClick={() => setShowAddLocationForm(true)}
                className="px-3 py-1.5 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] dark:text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Primary Location</span>
              </button>
            )}
          </div>

          {/* Add New Location Form */}
          {showAddLocationForm && (
            <form onSubmit={handleCreateLocation} className="p-4 bg-slate-50 dark:bg-slate-950 border border-amber-500/30 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> New Primary Venue (e.g. Pioneer School)
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddLocationForm(false)}
                  className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Location Name (e.g. Pioneer School)"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Street Address (e.g. 750 Schoolhouse Road)"
                  value={newLocAddress}
                  onChange={(e) => setNewLocAddress(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Parking / Access Notes (Optional)"
                  value={newLocParking}
                  onChange={(e) => setNewLocParking(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] dark:text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                Save Location
              </button>
            </form>
          )}

          {/* Locations Cards List */}
          <div className="space-y-4">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-sm"
              >
                {/* Location Title Bar or Inline Edit Form */}
                {editingLocId === loc.id ? (
                  <div className="p-3 bg-white dark:bg-slate-900 border border-amber-500/30 rounded-xl space-y-2 shadow-sm">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">Edit Primary Venue</span>
                    <input
                      type="text"
                      value={editLocName}
                      onChange={(e) => setEditLocName(e.target.value)}
                      placeholder="Location Name"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-1.5"
                    />
                    <input
                      type="text"
                      value={editLocAddress}
                      onChange={(e) => setEditLocAddress(e.target.value)}
                      placeholder="Street Address"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-1.5"
                    />
                    <input
                      type="text"
                      value={editLocParking}
                      onChange={(e) => setEditLocParking(e.target.value)}
                      placeholder="Parking Notes"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-1.5"
                    />
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => handleSaveLocationEdit(loc.id)}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Save Changes</span>
                      </button>
                      <button
                        onClick={() => setEditingLocId(null)}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                        <h5 className="font-extrabold text-slate-900 dark:text-white text-base">{loc.name}</h5>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                        <span>{loc.address}</span>
                      </div>
                      {loc.parkingInfo && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-1 italic">
                          Parking: {loc.parkingInfo}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => startEditingLocation(loc)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-800 text-xs shadow-sm"
                        title="Edit Location"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete location "${loc.name}" and all of its courts? Matches booked on those courts will lose their court assignment.`)) {
                            onDeleteLocation(loc.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-rose-500 dark:text-rose-400 border border-slate-200 dark:border-slate-800 text-xs shadow-sm"
                        title="Delete Location"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setActiveLocIdForSub(activeLocIdForSub === loc.id ? null : loc.id)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center space-x-1 shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Court</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-location inline creation form */}
                {activeLocIdForSub === loc.id && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-500/30 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                      <span>Add Sub-Location to {loc.name}</span>
                      <button onClick={() => setActiveLocIdForSub(null)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Sub-location Name (e.g. Court 1, Court 2)"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs"
                      />
                      <select
                        value={newSubSurface}
                        onChange={(e) => setNewSubSurface(e.target.value as SubLocation['surface'])}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs"
                      >
                        <option value="Hardwood">Hardwood</option>
                        <option value="Sport Court">Sport Court</option>
                        <option value="Beach Sand">Beach Sand</option>
                        <option value="Turf">Turf</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleCreateSubLocation(loc.id)}
                      className="w-full py-1.5 bg-rose-500 text-white font-bold text-xs rounded-lg hover:bg-rose-600 dark:hover:bg-rose-400 shadow-md transition-all"
                    >
                      Add Court to {loc.name}
                    </button>
                  </div>
                )}

                {/* Sub-locations Grid List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Courts & Sub-locations ({loc.subLocations.length})
                  </span>

                  {loc.subLocations.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No courts added yet under {loc.name}.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {loc.subLocations.map((sub) => (
                        <div
                          key={sub.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs shadow-sm"
                        >
                          {editingSubId === sub.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editSubName}
                                onChange={(e) => setEditSubName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded px-2 py-1"
                              />
                              <select
                                value={editSubSurface}
                                onChange={(e) => setEditSubSurface(e.target.value as SubLocation['surface'])}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded px-2 py-1"
                              >
                                <option value="Hardwood">Hardwood</option>
                                <option value="Sport Court">Sport Court</option>
                                <option value="Beach Sand">Beach Sand</option>
                                <option value="Turf">Turf</option>
                              </select>
                              <div className="flex items-center space-x-1 pt-1">
                                <button
                                  onClick={() => handleSaveSubLocationEdit(loc.id, sub.id)}
                                  className="px-2 py-1 bg-emerald-500 text-white dark:text-slate-950 font-bold text-[10px] rounded"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingSubId(null)}
                                  className="px-2 py-1 text-slate-500 dark:text-slate-400 text-[10px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Layers className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white block">{sub.name}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{sub.surface}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => startEditingSubLocation(sub)}
                                  className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                                  title="Edit court"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => onRemoveSubLocation(loc.id, sub.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                  title="Remove sub-location"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors shadow-sm"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
