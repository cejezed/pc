import React, { useState } from 'react';
import { Save, Building, User, Mail, Phone, MapPin, Check } from 'lucide-react';

type ProfileData = {
  company_name: string;
  kvk_number: string;
  btw_number: string;
  address: string;
  iban: string;
  logo_url: string;
  name: string;
  email: string;
  phone: string;
};

const ProfileTab = () => {
  const [profile, setProfile] = useState<ProfileData>({
    company_name: 'Brikx Architecture',
    kvk_number: '12345678',
    btw_number: 'NL123456789B01',
    address: 'Hoofdstraat 123, 1234 AB Amsterdam',
    iban: 'NL12ABCD0123456789',
    logo_url: '',
    name: 'Jan Brikx',
    email: 'jan@brikx.nl',
    phone: '+31 6 12345678'
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-sm space-y-6">
      {/* Bedrijfsgegevens */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-[var(--zeus-primary)]" />
          <h2 className="text-xl font-bold text-[var(--zeus-text)]">Bedrijfsgegevens</h2>
        </div>
        <p className="text-sm text-[var(--zeus-text-secondary)] mb-4">Deze gegevens worden gebruikt op facturen</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
              Bedrijfsnaam *
            </label>
            <input
              type="text"
              value={profile.company_name}
              onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
              className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              placeholder="Naam van je bedrijf"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
              KVK nummer
            </label>
            <input
              type="text"
              value={profile.kvk_number}
              onChange={(e) => setProfile({ ...profile, kvk_number: e.target.value })}
              className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              placeholder="12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
              BTW nummer
            </label>
            <input
              type="text"
              value={profile.btw_number}
              onChange={(e) => setProfile({ ...profile, btw_number: e.target.value })}
              className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              placeholder="NL123456789B01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
              IBAN
            </label>
            <input
              type="text"
              value={profile.iban}
              onChange={(e) => setProfile({ ...profile, iban: e.target.value })}
              className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              placeholder="NL12ABCD0123456789"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Adres
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              placeholder="Straat 123, 1234 AB Plaats"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
              Logo
            </label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-[var(--zeus-text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--zeus-primary)] file:text-white hover:file:bg-[var(--zeus-primary)]/80 file:cursor-pointer"
            />
            <p className="text-xs text-[var(--zeus-text-secondary)] mt-1">
              Upload je bedrijfslogo (gebruikt op facturen)
            </p>
          </div>
        </div>
      </div>

      {/* Persoonlijke gegevens */}
      <div className="border-t border-[var(--zeus-border)] pt-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-[var(--zeus-primary)]" />
          <h2 className="text-xl font-bold text-[var(--zeus-text)]">Persoonlijke gegevens</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
              Naam *
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              placeholder="Je volledige naam"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email *
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              placeholder="email@voorbeeld.nl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Telefoon
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              placeholder="+31 6 12345678"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="border-t border-[var(--zeus-border)] pt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-zeus-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>

        {saved && (
          <span className="text-sm text-green-400 font-medium flex items-center gap-1">
            <Check className="w-4 h-4" />
            Opgeslagen!
          </span>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;

