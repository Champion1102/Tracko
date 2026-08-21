import { redirect } from "next/navigation";
import { currentRole, needsPinSetup } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Root() {
  const role = await currentRole();
  if (!role) redirect("/login");

  const { config } = await db().read();
  if (needsPinSetup(config, role)) redirect("/set-pin");
  if (role === "sponsor") redirect("/sponsor");
  redirect(config.onboardedAt ? "/today" : "/welcome");
}
