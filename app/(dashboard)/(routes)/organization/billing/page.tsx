"use client";

import { OrgBillingCard } from "@/components/org-billing-card";
import { OrgMembersSelector } from "@/components/org-members-selector";
import { useOrganization } from "@clerk/nextjs";

export default function OrgBillingPage() {
  const { organization } = useOrganization();

  if (!organization) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Organization Settings</h1>
        <div className="text-center py-8">
          <p>Please select an organization first</p>
          <p className="text-sm text-gray-400">
            Use the organization switcher in the navbar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6">
        {organization.name} Settings
      </h1>
      <div className="grid gap-6">
        <OrgBillingCard />
      </div>
      <div className="mt-4">
        <OrgMembersSelector/>
      </div>
    </div>
  );
}