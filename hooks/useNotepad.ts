"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "speehive_notepad";

export function useNotepadMigration() {
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function migrate() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const localText = localStorage.getItem(STORAGE_KEY);
      if (!localText) return;

      const { count, error } = await supabase
        .from("notes")
        .select("id", { count: "exact", head: true });

      if (error || (count && count > 0)) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: "Quick Notes",
          content: localText,
        });

      localStorage.removeItem(STORAGE_KEY);
      setMigrated(true);
    }
    migrate();
  }, []);

  return migrated;
}
