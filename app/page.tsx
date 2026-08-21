import { redirect } from "next/navigation";
import { currentRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Root() {
  const role = await currentRole();
  if (role === "sponsor") redirect("/sponsor");
  if (!role) redirect("/login");

  const { config } = await db().read();
  redirect(config.onboardedAt ? "/today" : "/welcome");
}
