/**
 * File path: /client_profile/page.tsx
 * Authors:
 * - Frontend UI Build: Devni Wijesinghe
 * - Backend logic: Denise Alexander
 * Updated by Qingyue Zhao: 03-10-2025
 * Last Updated by Denise Alexander: 07-10-2025 (back-end integration)
 *
 * Notes:
 * - Fixed-height viewport section (h-[680px]) to avoid bottom gutters.
 * - Family view: two-column editable; Management: same layout, read-only.
 * - "Create one here" triggers AddAccessCodePanel.
 */

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import AddAccessCodePanel from '@/components/accesscode/access-code';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { useActiveClient } from '@/context/ActiveClientContext';

import {
  getClients,
  getClientById,
  getViewerRole,
  type Client as ApiClient,
} from '@/lib/data';

type Role = 'family' | 'carer' | 'management';

const colors = {
  pageBg: '#F7ECD9',
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  fieldBorder: 'rgba(58,0,0,0.45)',
};

export default function ClientProfilePage() {
  return (
    <Suspense
      fallback={<div style={{ padding: 24 }}>Loading client profile...</div>}
    >
      <ClientProfilePageInner />
    </Suspense>
  );
}

function ClientProfilePageInner() {
  const router = useRouter();
  const sp = useSearchParams();

  // --- Extract query parameters ---
  const clientIdParam = sp.get('id') || null;
  const isNew = sp.get('new') === 'true';

  // ---- Logged-in user role state ----
  const [role, setRole] = useState<Role>('family');
  useEffect(() => {
    (async () => {
      const r = await getViewerRole();
      if (r === 'family' || r === 'carer' || r === 'management') setRole(r);
    })();
  }, []);

  const isFamily = role === 'family';
  const isManagement = role === 'management';
  const isCarer = role === 'carer';

  // --- Back navigation based on role ---
  const backHref = isManagement
    ? '/management_dashboard/clients_list'
    : isCarer
      ? '/calendar_dashboard'
      : '/family_dashboard/people_list';

  // ---- top chrome client switcher ----
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const { client: activeClient, handleClientChange } = useActiveClient();

  // ---- profile fields ----
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');


  const [loading, setLoading] = useState<boolean>(!!clientIdParam && !isNew);
  const [error, setError] = useState('');

  // ---- access-code drawer ----
  const [showAccessCodeDrawer, setShowAccessCodeDrawer] = useState(false);

  // ---- avatar upload ----
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  // ---- load clients ----
  useEffect(() => {
    (async () => {
      try {
        const list = await getClients();
        const mapped = (list as ApiClient[]).map((c) => ({
          id: c._id as string,
          name: c.name,
        }));
        setClients(mapped);

        // Skip pre-filling for new client creation
        if (isNew) {
          return;
        }

        // Determine selected client
        const selectedClient = clientIdParam
          ? mapped.find((c) => c.id === clientIdParam)
          : mapped[0];

        // Update active client based on selected client
        if (selectedClient && activeClient?.id !== selectedClient.id) {
          handleClientChange(selectedClient.id, selectedClient.name);
        }
      } catch {
        setClients([]);
      }
    })();
  }, [clientIdParam, isNew, handleClientChange, activeClient?.id]);

  // ---- load one client (skip when new) ----
  useEffect(() => {
    if (isNew || !activeClient?.id) {
      setName('');
      setDob('');
      setAccessCode('');
      setAvatarUrl('');
      setSavedNotes([]);
      setNotesInput('');
      setLoading(false);
      setError('');
      return;
    }

    const clientId = activeClient.id;
    let alive = true;

    (async () => {
      try {
        // Fetch client from API
        const client = await getClientById(clientId);
        if (!alive) return;
        if (!client) throw new Error('Client not found');
        // Populate fields from API response
        setName(client.name || '');
        setDob(client.dob || '');
        setAccessCode(client.accessCode || '');
        setSavedNotes(
          Array.isArray(client.notes)
            ? client.notes
            : client.notes
              ? [client.notes]
              : []
        );
        setAvatarUrl(client.avatarUrl || '');
        setMedicalNotes(client.medicalNotes || '');
        setEmergencyContact(client.emergencyContact || '');
        setAddress(client.address || '');
      } catch {
        if (alive) setError('Failed to load client data.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeClient, isNew]);

  // ---- save client ----
  const saveClient = async () => {
    try {
      const payload = {
        name,
        dob,
        accessCode,
        avatarUrl,
        notes: isCarer
          ? [...savedNotes, notesInput].filter(Boolean)
          : [notesInput, ...savedNotes].filter(Boolean),
        medicalNotes,
        emergencyContact,
        address,
      };

      // Either create new entry or update current entry
      const url = isNew
        ? '/api/v1/clients'
        : `/api/v1/clients/${activeClient.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save client');
      }

      const saved = await res.json();

      // If new client, set as active in context
      if (isNew) {
        handleClientChange(saved._id, saved.name);
      }

      // Navigate back to appropriate list page
      router.push(backHref);
    } catch (err) {
      console.error(err);
      setError(
        'Failed to save client. Please check your inputs and try again.'
      );
    }
  };

  const onCancel = () => {
    setNotesInput('');
    router.push(backHref);
  };
  const onSave = saveClient;

  if (loading) {
    return (
      <DashboardChrome
        page="profile"
        clients={clients}
        onClientChange={(id) => router.push(`/client_profile?id=${id}`)}
        colors={{
          header: colors.header,
          banner: colors.banner,
          text: colors.text,
        }}
      >
        <div
          className="flex-1 flex items-center justify-center"
          style={{ backgroundColor: colors.pageBg }}
        >
          <h2 className="text-2xl md:text-3xl font-extrabold">
            Loading client profile…
          </h2>
        </div>
      </DashboardChrome>
    );
  }
  if (error) {
    return (
      <DashboardChrome
        page="profile"
        clients={clients}
        onClientChange={(id) => router.push(`/client_profile?id=${id}`)}
        colors={{
          header: colors.header,
          banner: colors.banner,
          text: colors.text,
        }}
      >
        <div
          className="flex-1 flex items-center justify-center"
          style={{ backgroundColor: colors.pageBg, color: 'red' }}
        >
          {error}
        </div>
      </DashboardChrome>
    );
  }

  const pageTitle = isNew
    ? 'New Client’s Profile'
    : `${activeClient?.name || 'Client'}’s Profile`;

  return (
    <DashboardChrome
      page="profile"
      clients={clients}
      onClientChange={(id) => {
        const selected = clients.find((c) => c.id === id);
        if (selected && activeClient?.id !== selected.id) {
          handleClientChange(selected.id, selected.name);
          router.push(`/client_profile?id=${id}`);
        }
      }}
      colors={{
        header: colors.header,
        banner: colors.banner,
        text: colors.text,
      }}
    >
      {/* Fixed-height body to avoid page gutter */}
      <div
        className="w-full h-[1000px] flex flex-col"
        style={{ backgroundColor: colors.pageBg, color: colors.text }}
      >
        {/* Section bar */}
        <div
          className="w-full flex items-center justify-between px-6 py-3 text-white"
          style={{ backgroundColor: colors.header }}
        >
          <div className="text-xl md:text-2xl font-extrabold">{pageTitle}</div>
          <button
            onClick={() => router.push(backHref)}
            className="text-base md:text-lg font-semibold bg-white/10 px-4 py-1.5 rounded hover:bg-white/20 transition"
            aria-label="Back"
          >
            &lt; Back
          </button>
        </div>

        {error && <div className="text-red-600 text-lg mb-4">{error}</div>}

        {/* Content: two columns*/}
        <div
          className={`max-w-[1100px] w-full mx-auto px-8 ${
            isManagement ? 'pt-30 pb-6' : 'pt-10 pb-6'
          } flex-none`}
        >
          <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-10 items-start">
            {/* Left: avatar */}
            <div className="flex flex-col items-center gap-6">
              <div
                className="rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  width: 260,
                  height: 260,
                  border: `10px solid ${colors.header}`,
                  backgroundColor: '#fff',
                }}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile avatar"
                    width={260}
                    height={260}
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="text-[64px]" style={{ color: colors.header }}>
                    •
                  </div>
                )}
              </div>

              {/* Upload only for family */}
              {isFamily && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={openFilePicker}
                    className="px-6 py-3 rounded-xl text-xl font-bold"
                    style={{ backgroundColor: '#D6C0B1', color: '#1b0b07' }}
                  >
                    Upload photo
                  </button>
                </>
              )}
            </div>

            {/* Right: fields (family editable; management static) */}
            <div className="w-full">
              {/* Name */}
              <FormRow label="Name">
                {isManagement || isCarer ? (
                  <StaticText
                    value={name}
                    placeholder="This information is not provided"
                  />
                ) : (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 rounded-md bg-white border px-3 outline-none text-black"
                    style={{ borderColor: colors.fieldBorder }}
                  />
                )}
              </FormRow>

              {/* DOB */}
              <FormRow label="Date of Birth">
                {isManagement || isCarer ? (
                  <StaticText
                    value={dob}
                    placeholder="This information is not provided"
                  />
                ) : (
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full h-12 rounded-md bg-white border px-3 outline-none text-black"
                    style={{ borderColor: colors.fieldBorder }}
                  />
                )}
              </FormRow>

              {/* Access Code — hidden for carers */}
              {!isCarer && (
                <FormRow label="Access Code">
                  {isManagement ? (
                    <StaticText
                      value={accessCode}
                      placeholder="This information is hidden"
                    />
                  ) : (
                    <>
                      <input
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        className="w-full h-12 rounded-md bg-white border px-3 outline-none text-black"
                        style={{ borderColor: colors.fieldBorder }}
                      />
                      <div className="text-[15px] mt-2 text-black/80">
                        Don’t have an access code?{' '}
                        <button
                          type="button"
                          className="underline"
                          onClick={() => setShowAccessCodeDrawer(true)}
                        >
                          Create one here
                        </button>
                      </div>
                    </>
                  )}
                </FormRow>
              )}

              {/* Address */}
              <FormRow label="Address">
                {isManagement || isCarer ? (
                  <StaticText
                    value={address}
                    placeholder="This information is not provided"
                  />
                ) : (
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-12 rounded-md bg-white border px-3 outline-none text-black"
                    style={{ borderColor: colors.fieldBorder }}
                  />
                )}
              </FormRow>

              {/* Emergency Contact */}
              <FormRow label="Emergency Contact">
                {isManagement || isCarer ? (
                  <StaticText
                    value={emergencyContact}
                    placeholder="This information is not provided"
                  />
                ) : (
                  <input
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full h-12 rounded-md bg-white border px-3 outline-none text-black"
                    style={{ borderColor: colors.fieldBorder }}
                  />
                )}
              </FormRow>

              {/* Medical Notes */}
              <FormRow label="Medical Notes">
                {isManagement || isCarer ? (
                  <div className="text-[16px] text-black/80 whitespace-pre-wrap">
                    {medicalNotes || 'This information is not provided'}
                  </div>
                ) : (
                  <textarea
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    className="w-full min-h-[120px] rounded-md bg-white border px-3 py-2 outline-none text-black"
                    style={{ borderColor: colors.fieldBorder }}
                  />
                )}
              </FormRow>


              {/* Notes */}
              <FormRow label="Notes">
                {isManagement ? (
                  <div className="text-[16px] text-black/80 whitespace-pre-wrap">
                    {savedNotes.length
                      ? savedNotes.join('\n')
                      : 'This information is not provided'}
                  </div>
                ) : (
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full min-h-[180px] rounded-md bg-white border px-3 py-2 outline-none text-black"
                    style={{ borderColor: colors.fieldBorder }}
                  />
                )}
              </FormRow>
            </div>
          </div>
        </div>

        {/* Footer buttons: hidden for management.
           NOTE: no bottom padding, no big top margin; stays close to content. */}
        {!isManagement && (
          <div className="flex items-center justify-center gap-20">
            <button
              onClick={onCancel}
              className="px-8 py-3 rounded-2xl text-2xl font-extrabold"
              style={{ backgroundColor: '#D6C0B1', color: '#1b0b07' }}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-8 py-3 rounded-2xl text-2xl font-extrabold disabled:opacity-50"
              style={{ backgroundColor: '#D6C0B1', color: '#1b0b07' }}
              disabled={isCarer && notesInput.trim().length === 0}
            >
              {isCarer ? 'Save Notes' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Access Code Drawer */}
      {isFamily && (
        <AddAccessCodePanel
          open={showAccessCodeDrawer}
          onClose={() => setShowAccessCodeDrawer(false)}
        />
      )}
    </DashboardChrome>
  );
}

/* ----- helpers ----- */
function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[220px_1fr] items-start gap-6 mb-6">
      <div className="text-[24px] font-black" style={{ color: '#1b0b07' }}>
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function StaticText({
  value,
  placeholder,
}: {
  value?: string;
  placeholder: string;
}) {
  const shown = (value ?? '').trim();
  return (
    <div className="text-[16px] text-black/80 min-h-12 flex items-center">
      {shown || placeholder}
    </div>
  );
}
