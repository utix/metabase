export type ApiKey = {
  name: string;
  id: number;
  group_id: number;
  group_name: string;
  creator_id: number;
  masked_key: string;
  created_at: string;
  updated_at: string;
  updated_by: {
    common_name: string;
    id: number;
  };
};
