import { supabase } from "./supabaseClient";
import { DEV_BYPASS_AUTH, requireInvited } from "./requireInvite";

export async function initRsvp() {
    let loadedUpdatedAt: string | null = null;

    const statusBox = document.getElementById("statusBox") as HTMLDivElement;
    const statusText = document.getElementById("statusText") as HTMLParagraphElement;
    const form = document.getElementById("rsvpForm") as HTMLFormElement;
    const meta = document.getElementById("meta") as HTMLParagraphElement;

    const nameEl = document.getElementById("name") as HTMLInputElement;
    const partySizeEl = document.getElementById("party_size") as HTMLInputElement;
    const dietaryEl = document.getElementById("dietary_requirements") as HTMLTextAreaElement;
    const accessEl = document.getElementById("access_needs") as HTMLTextAreaElement;

    const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
    const signOutBtn = document.getElementById("signOutBtn") as HTMLButtonElement;
    const refreshBtn = document.getElementById("refreshBtn") as HTMLButtonElement;

    function showStatus(text: string, isError = false) {
        statusBox.classList.remove("hidden");
        statusText.textContent = text;
        statusText.style.fontWeight = isError ? "600" : "400";
    }

    function setLoading(loading: boolean) {
        saveBtn.disabled = loading;
        saveBtn.textContent = loading ? "Saving…" : "Save RSVP";
    }

    function devStorageKey(groupId: string) {
        return `dev:rsvp:${groupId}`;
    }

    async function loadRsvp(groupId: string) {
        if (DEV_BYPASS_AUTH) {
        const raw = localStorage.getItem(devStorageKey(groupId));
        return raw ? JSON.parse(raw) : null;
        }

        const { data, error } = await supabase
        .from("rsvp")
        .select("*")
        .eq("group_id", groupId)
        .maybeSingle();

        if (error) throw error;
        return data;
    }

    function fillForm(rsvp: any) {
        if (!rsvp) return;

        nameEl.value = rsvp.name ?? "";
        partySizeEl.value = String(rsvp.party_size ?? 1);
        dietaryEl.value = rsvp.dietary_requirements ?? "";
        accessEl.value = rsvp.access_needs ?? "";

        loadedUpdatedAt = rsvp.updated_at ?? null;

        meta.textContent = rsvp.updated_at
        ? `Last updated: ${new Date(rsvp.updated_at).toLocaleString()}`
        : "";
    }

    async function refreshLatest(groupId: string) {
        const latest = await loadRsvp(groupId);
        if (latest) {
        fillForm(latest);
        showStatus("Refreshed to the latest saved version.");
        } else {
        loadedUpdatedAt = null;
        meta.textContent = "No RSVP saved yet.";
        showStatus("No RSVP has been saved yet.");
        }
    }

    // ✅ Access check happens here
    showStatus("Checking access…");
    const ctx = await requireInvited();
    if (!ctx) return;

    const groupId = ctx.groupId;

    const existing = await loadRsvp(groupId);
    form.classList.remove("hidden");
    statusBox.classList.add("hidden");

    if (existing) {
        fillForm(existing);
    } else {
        partySizeEl.value = "1";
        loadedUpdatedAt = null;
        meta.textContent = "No RSVP saved yet.";
    }

    refreshBtn.addEventListener("click", async () => {
        try {
        setLoading(true);
        await refreshLatest(groupId);
        } catch (err: any) {
        showStatus(`Refresh failed: ${err?.message ?? err}`, true);
        } finally {
        setLoading(false);
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setLoading(true);
        statusBox.classList.add("hidden");

        try {
                const nowIso = new Date().toISOString();

                const payload = {
                    group_id: groupId,
                    name: nameEl.value.trim(),
                    party_size: Number(partySizeEl.value),
                    dietary_requirements: dietaryEl.value.trim() || null,
                    access_needs: accessEl.value.trim() || null,
                    updated_at: nowIso,
                };

                if (!payload.name) throw new Error("Name is required.");
                if (!Number.isInteger(payload.party_size) || payload.party_size < 1) {
                    throw new Error("Party size must be a whole number (1 or more).");
                }

                // ✅ Dev localStorage save + conflict simulation
                if (DEV_BYPASS_AUTH) {
                    const current = await loadRsvp(groupId);

                    if (current?.updated_at && loadedUpdatedAt && current.updated_at !== loadedUpdatedAt) {
                    fillForm(current);
                    showStatus(
                        "Conflict (dev mock): it changed while you were editing. Reloaded latest values — review and save again.",
                        true
                    );
                    return;
                    }

                    localStorage.setItem(devStorageKey(groupId), JSON.stringify(payload));
                    fillForm(payload);
                    showStatus("Saved locally (dev bypass).");
                    return;
                }
                
                let saved = null;

                if (loadedUpdatedAt) {
                    // UPDATE with optimistic concurrency check:
                    // Only succeed if updated_at is still what we loaded.
                    const { data, error } = await supabase
                        .from("rsvp")
                        .update({
                        name: payload.name,
                        party_size: payload.party_size,
                        dietary_requirements: payload.dietary_requirements,
                        access_needs: payload.access_needs,
                        updated_at: payload.updated_at,
                        })
                        .eq("group_id", groupId)
                        .eq("updated_at", loadedUpdatedAt)
                        .select()
                        .maybeSingle();

                    if (error) throw error;

                    if (!data) {
                        // Conflict: row exists but updated_at changed since we loaded
                        const latest = await loadRsvp(groupId);
                        if (latest) fillForm(latest);

                        showStatus(
                            "Your partner updated the RSVP while you were editing. We’ve loaded the latest values. Please review and save again — or click “Refresh latest”.",
                            true
                        );
                        return;
                    }

                    saved = data;
                } else {
                    // INSERT (first one wins). If partner inserted first, we detect and handle it.
                    const { data, error } = await supabase
                        .from("rsvp")
                        .insert(payload)
                        .select()
                        .single();

                    if (error) {
                        // Likely a unique constraint conflict because partner inserted first.
                        // Reload and tell user.
                        const latest = await loadRsvp(groupId);
                        if (latest) fillForm(latest);

                        showStatus(
                            "An RSVP was created by your partner while you were editing. We’ve loaded the latest values. Please review and save again — or click “Refresh latest”.",
                            true
                        );
                        return;
                    }

                    saved = data;
                }

                fillForm(saved);
                showStatus("Saved successfully.");
            } catch (err: any) {
                showStatus(`Save failed: ${err?.message ?? err}`, true);
            } finally {
                setLoading(false);
            }
         });

        signOutBtn.addEventListener("click", async () => {
            if (DEV_BYPASS_AUTH) {
            localStorage.removeItem(devStorageKey(groupId));
            loadedUpdatedAt = null;
            showStatus("Cleared local mock RSVP (dev bypass).");
            return;
            }

            await supabase.auth.signOut();
            window.location.replace("/login-error");
        });
        
}