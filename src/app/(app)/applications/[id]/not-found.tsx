import Link from "next/link";

import { PageHeader } from "@/components/page-header";

export default function ApplicationNotFound() {
  return (
    <>
      <PageHeader
        title="Application not found"
        description="This packet does not exist or was removed."
      />
      <div className="px-6 py-6">
        <Link
          href="/applications"
          className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline"
        >
          Back to applications
        </Link>
      </div>
    </>
  );
}
