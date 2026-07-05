import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import TipPageClient, {
  type FanLetterHistoryEntry,
  type TipJunior,
} from "./TipPageClient";

function getRegionLabel(region: string | null) {
  if (region === "kanto") return "関東ジュニア";
  if (region === "kansai") return "関西ジュニア";
  return "無所属";
}

export default async function TipPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileResult, juniorsResult, historyResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("oshi_junior_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("juniors")
      .select("id, name, image_path, region, group:groups(name)")
      .order("name"),
    supabase
      .from("support_payments")
      .select("id, junior_id, amount, message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error || juniorsResult.error || historyResult.error) {
    throw new Error("スーパーチャットの送信先情報を取得できませんでした。");
  }

  const juniors: TipJunior[] = (juniorsResult.data ?? []).map((junior) => ({
    id: junior.id,
    name: junior.name,
    imageUrl: junior.image_path
      ? supabase.storage.from("images").getPublicUrl(junior.image_path).data.publicUrl
      : null,
    affiliation: junior.group?.name ?? getRegionLabel(junior.region),
  }));

  const initialHistory: FanLetterHistoryEntry[] = (historyResult.data ?? []).map((entry) => ({
    id: entry.id,
    juniorId: entry.junior_id,
    amount: entry.amount,
    message: entry.message ?? "",
    createdAt: entry.created_at,
  }));

  return (
    <TipPageClient
      juniors={juniors}
      initialOshiId={profileResult.data.oshi_junior_id}
      initialHistory={initialHistory}
    />
  );
}
