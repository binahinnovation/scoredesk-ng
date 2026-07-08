import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserSchoolId } from "@/hooks/use-school-id";

interface LogEditParams {
  schoolId: string;
  actorId: string;
  actionType: 'insert' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  oldValue: object | null;
  newValue: object | null;
  reason?: string | null;
}

export async function logEdit({
  schoolId,
  actorId,
  actionType,
  tableName,
  recordId,
  oldValue,
  newValue,
  reason = null,
}: LogEditParams) {
  try {
    const { error } = await supabase.rpc('fn_log_edit', {
      p_school_id: schoolId,
      p_actor_id: actorId,
      p_action: actionType,
      p_table: tableName,
      p_record: recordId,
      p_old: oldValue,
      p_new: newValue,
      p_reason: reason,
    });

    if (error) {
      console.error(`Error logging edit for ${tableName} (${recordId}):`, error);
    }
  } catch (err) {
    console.error(`Unexpected error logging edit for ${tableName} (${recordId}):`, err);
  }
}

// Re-export for backwards compatibility
export { getCurrentUserSchoolId };
