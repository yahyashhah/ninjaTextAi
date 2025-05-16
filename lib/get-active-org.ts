// lib/get-active-org.ts
import { auth } from "@clerk/nextjs/server";
import { getServerOrgId } from "./get-org-id";

export const getActiveOrganization = async () => {
  const { orgSlug, orgRole } = auth();
  const orgId = getServerOrgId();
  return orgId ? { id: orgId, slug: orgSlug, role: orgRole } : null;
};