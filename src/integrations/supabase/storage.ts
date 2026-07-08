import { supabase } from "./client";

export const getBucketExists = async (name: string) => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.warn("Could not check bucket existence:", error.message);
      return false;
    }
    
    return data.some(bucket => bucket.name === name);
  } catch (error) {
    console.warn("Storage service unavailable - assuming bucket does not exist");
    return false;
  }
};
