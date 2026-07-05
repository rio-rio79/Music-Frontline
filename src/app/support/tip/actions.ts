"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";

export type SendFanLetterResult =
  | {
      status: "success";
      entry: {
        id: string;
        juniorId: string;
        amount: number;
        message: string;
        createdAt: string;
      };
    }
  | { status: "error"; message: string };

type SendFanLetterInput = {
  juniorId: string;
  amount: number;
  message: string;
};

type FanLetterRpcResponse = {
  id: string;
  junior_id: string;
  amount: number;
  message: string;
  created_at: string;
};

export async function sendFanLetter(input: SendFanLetterInput): Promise<SendFanLetterResult> {
  const juniorId = input.juniorId;
  const amount = input.amount;
  const message = input.message.trim();

  if (!juniorId) {
    return { status: "error", message: "送るジュニアを選択してください。" };
  }

  if (!Number.isInteger(amount) || amount < 100 || amount > 50000) {
    return { status: "error", message: "金額は100円以上50,000円以下で入力してください。" };
  }

  if (!message) {
    return { status: "error", message: "メッセージを入力してください。" };
  }

  if (message.length > 300) {
    return { status: "error", message: "メッセージは300文字以内で入力してください。" };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: "error", message: "ログイン情報を確認できませんでした。" };
  }

  const { data, error } = await supabase.rpc("send_fan_letter", {
    p_junior_id: juniorId,
    p_amount: amount,
    p_message: message,
  });

  if (error) {
    console.error("Failed to send fan letter:", error);
    return { status: "error", message: "ファンレターを送信できませんでした。" };
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { status: "error", message: "送信結果を確認できませんでした。" };
  }

  const response = data as FanLetterRpcResponse;

  revalidatePath("/support/tip");
  revalidatePath("/ranking");

  return {
    status: "success",
    entry: {
      id: response.id,
      juniorId: response.junior_id,
      amount: response.amount,
      message: response.message,
      createdAt: response.created_at,
    },
  };
}
