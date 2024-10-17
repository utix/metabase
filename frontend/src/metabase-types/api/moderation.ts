export type VerifyItemRequest = {
  status: "verified" | "flagged" | null;
  moderated_item_id: number;
  moderated_item_type: "card";
  text?: string;
  expirey?: string | null;
};
