import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, LogOut, ChevronRight, Bell, Shield, HelpCircle, Store, FileText, X } from 'lucide-react';
import { AppHeader, AppButton, InputField } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { restaurantsApi, type Restaurant, type UpdateRestaurantInput } from '@/api';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [editData, setEditData] = useState<UpdateRestaurantInput>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch restaurant data for owners
  useEffect(() => {
    if (user?.role === 'OWNER') {
      setIsLoading(true);
      restaurantsApi.getMyRestaurant()
        .then((response) => {
          if (response.success && response.data) {
            setRestaurant(response.data);
            setEditData({
              name: response.data.name,
              address: response.data.address,
              type: response.data.type || '',
              description: response.data.description || '',
              longDescription: response.data.longDescription || '',
              menuText: response.data.menuText || '',
            });
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/welcome', { replace: true });
  };

  const handleSaveRestaurant = async () => {
    setIsSaving(true);
    try {
      const response = await restaurantsApi.updateMyRestaurant(editData);
      if (response.success && response.data) {
        setRestaurant(response.data as Restaurant);
        setShowEditRestaurant(false);
      }
    } catch (error) {
      console.error('Failed to update restaurant:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    ...(user?.role === 'OWNER' && restaurant
      ? [
          {
            icon: Store,
            label: 'Restaurant Settings',
            description: 'Edit name, description, menu',
            onClick: () => setShowEditRestaurant(true),
          },
        ]
      : []),
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage notification preferences',
      onClick: () => alert('Notifications settings coming soon!'),
    },
    {
      icon: Shield,
      label: 'Privacy & Security',
      description: 'Password, data preferences',
      onClick: () => alert('Privacy settings coming soon!'),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'FAQ, contact us',
      onClick: () => alert('Help & Support coming soon!'),
    },
  ];

  return (
    <div className="min-h-screen bg-navy-50">
      <AppHeader showBack title="Profile" />

      {/* Profile Card */}
      <div className="px-6 pt-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
              <User className="w-8 h-8 text-brand-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-display font-bold text-navy-900">
                {user?.name || 'User'}
              </h2>
              <p className="text-sm text-navy-500 capitalize">
                {user?.role?.toLowerCase() || 'Customer'}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 text-navy-600">
              <Mail className="w-5 h-5 text-navy-400" />
              <span className="text-sm">{user?.email || 'No email'}</span>
            </div>
            {user?.phone && (
              <div className="flex items-center gap-3 text-navy-600">
                <Phone className="w-5 h-5 text-navy-400" />
                <span className="text-sm">{user.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant Info for Owners */}
      {user?.role === 'OWNER' && restaurant && (
        <div className="px-6 mt-4">
          <div className="bg-brand-50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Store className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold text-brand-900">Your Restaurant</h3>
            </div>
            <p className="font-medium text-navy-900">{restaurant.name}</p>
            <p className="text-sm text-navy-600">{restaurant.address}</p>
            {restaurant.type && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded-full">
                {restaurant.type}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-navy-50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-navy-100' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-navy-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-navy-900">{item.label}</p>
                <p className="text-xs text-navy-500">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-navy-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-6 mt-6">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-medium hover:bg-red-50 rounded-2xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>

      {/* Version */}
      <div className="text-center mt-8 pb-8">
        <p className="text-xs text-navy-400">QueueKill v1.0.0</p>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-display font-bold text-navy-900 mb-2">
              Sign Out?
            </h3>
            <p className="text-navy-500 text-sm mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-2xl border border-navy-200 text-navy-700 font-medium hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <AppButton onClick={handleLogout} className="flex-1">
                Sign Out
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Restaurant Modal */}
      {showEditRestaurant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="text-lg font-display font-bold text-navy-900">Edit Restaurant</h2>
              <button
                onClick={() => setShowEditRestaurant(false)}
                className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-navy-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <InputField
                label="Restaurant Name"
                value={editData.name || ''}
                onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
              />

              <InputField
                label="Address"
                value={editData.address || ''}
                onChange={(e) => setEditData((prev) => ({ ...prev, address: e.target.value }))}
              />

              <div className="w-full">
                <label className="block text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">
                  Restaurant Type
                </label>
                <select
                  value={editData.type || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-4 rounded-2xl bg-navy-50 border border-navy-100 text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Select type...</option>
                  {['Italian', 'Japanese', 'Chinese', 'Thai', 'Mexican', 'Indian', 'American', 'French', 'Korean', 'Vietnamese', 'Mediterranean', 'Cafe', 'Fast Food', 'Bakery', 'Other'].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  value={editData.description || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                  maxLength={100}
                  className="w-full px-4 py-4 rounded-2xl bg-navy-50 border border-navy-100 text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Brief description for listing cards"
                />
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">
                  Detailed Description
                </label>
                <textarea
                  value={editData.longDescription || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, longDescription: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-4 rounded-2xl bg-navy-50 border border-navy-100 text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                  placeholder="Full description shown on detail page"
                />
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Menu (Text)
                  </div>
                </label>
                <textarea
                  value={editData.menuText || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, menuText: e.target.value }))}
                  rows={8}
                  className="w-full px-4 py-4 rounded-2xl bg-navy-50 border border-navy-100 text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none font-mono text-sm"
                  placeholder="List your menu items and prices..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-navy-100">
              <AppButton fullWidth onClick={handleSaveRestaurant} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
