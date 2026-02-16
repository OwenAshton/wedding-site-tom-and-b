import { supabase } from "./supabaseClient";
import { DEV_BYPASS_AUTH, requireInvited } from "./requireInvite";

type MemberEntry = { email: string; name: string };
type MemberValue = { email: string; value: string };

export async function initRsvp() {
    let loadedUpdatedAt: string | null = null;
    let memberEmails: string[] = [];

    const statusBox = document.getElementById("statusBox") as HTMLDivElement;
    const statusText = document.getElementById("statusText") as HTMLParagraphElement;
    const form = document.getElementById("rsvpForm") as HTMLFormElement;
    const meta = document.getElementById("meta") as HTMLParagraphElement;
    const membersContainer = document.getElementById("membersContainer") as HTMLDivElement;

    const partySizeEl = document.getElementById("party_size") as HTMLInputElement;

    const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
    const signOutBtn = document.getElementById("signOutBtn") as HTMLButtonElement;
    const refreshBtn = document.getElementById("refreshBtn") as HTMLButtonElement;
    const exploreNudge = document.getElementById("exploreNudge") as HTMLDivElement | null;

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

    // --- Member section rendering ---

    function renderMemberSections(emails: string[]) {
        membersContainer.innerHTML = "";
        for (const email of emails) {
            const fieldset = document.createElement("fieldset");
            fieldset.className = "member-section";
            fieldset.dataset.email = email;

            const legend = document.createElement("legend");
            legend.className = "member-legend";
            legend.textContent = email;
            fieldset.appendChild(legend);

            // Name
            const nameLabel = document.createElement("label");
            nameLabel.className = "field";
            nameLabel.innerHTML = `
                <span class="field-label">Name</span>
                <input class="field-input member-name" type="text" autocomplete="name" data-email="${email}" />
            `;
            fieldset.appendChild(nameLabel);

            // Dietary
            const dietaryLabel = document.createElement("label");
            dietaryLabel.className = "field";
            dietaryLabel.innerHTML = `
                <span class="field-label">Dietary requirements</span>
                <textarea class="field-input member-dietary" rows="2" placeholder="e.g. vegetarian, allergies, etc." data-email="${email}"></textarea>
            `;
            fieldset.appendChild(dietaryLabel);

            // Access needs
            const accessLabel = document.createElement("label");
            accessLabel.className = "field";
            accessLabel.innerHTML = `
                <span class="field-label">Access needs</span>
                <textarea class="field-input member-access" rows="2" placeholder="e.g. step-free access, hearing assistance, etc." data-email="${email}"></textarea>
            `;
            fieldset.appendChild(accessLabel);

            membersContainer.appendChild(fieldset);
        }
    }

    // --- JSON parsing helpers ---

    function parseNameJson(raw: string | null | undefined, emails: string[]): MemberEntry[] {
        if (!raw) return emails.map(e => ({ email: e, name: "" }));
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                // Map stored entries to current member emails
                return emails.map(email => {
                    const match = parsed.find((p: MemberEntry) => p.email === email);
                    return { email, name: match?.name ?? "" };
                });
            }
        } catch {
            // Legacy plain string — assign to first member
        }
        return emails.map((email, i) => ({
            email,
            name: i === 0 ? raw : "",
        }));
    }

    function parseValueJson(raw: string | null | undefined, emails: string[]): MemberValue[] {
        if (!raw) return emails.map(e => ({ email: e, value: "" }));
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return emails.map(email => {
                    const match = parsed.find((p: MemberValue) => p.email === email);
                    return { email, value: match?.value ?? "" };
                });
            }
        } catch {
            // Legacy plain string — assign to first member
        }
        return emails.map((email, i) => ({
            email,
            value: i === 0 ? raw : "",
        }));
    }

    // --- Fill / collect form data ---

    function fillForm(rsvp: any) {
        if (!rsvp) return;

        const names = parseNameJson(rsvp.name, memberEmails);
        const dietaries = parseValueJson(rsvp.dietary_requirements, memberEmails);
        const accesses = parseValueJson(rsvp.access_needs, memberEmails);

        for (const email of memberEmails) {
            const nameInput = membersContainer.querySelector(
                `input.member-name[data-email="${email}"]`
            ) as HTMLInputElement | null;
            const dietaryInput = membersContainer.querySelector(
                `textarea.member-dietary[data-email="${email}"]`
            ) as HTMLTextAreaElement | null;
            const accessInput = membersContainer.querySelector(
                `textarea.member-access[data-email="${email}"]`
            ) as HTMLTextAreaElement | null;

            if (nameInput) nameInput.value = names.find(n => n.email === email)?.name ?? "";
            if (dietaryInput) dietaryInput.value = dietaries.find(d => d.email === email)?.value ?? "";
            if (accessInput) accessInput.value = accesses.find(a => a.email === email)?.value ?? "";
        }

        partySizeEl.value = String(rsvp.party_size ?? 0);
        loadedUpdatedAt = rsvp.updated_at ?? null;

        meta.textContent = rsvp.updated_at
            ? `Last updated: ${new Date(rsvp.updated_at).toLocaleString()}`
            : "";
    }

    function collectFormData(groupId: string) {
        const names: MemberEntry[] = [];
        const dietaries: MemberValue[] = [];
        const accesses: MemberValue[] = [];

        for (const email of memberEmails) {
            const nameInput = membersContainer.querySelector(
                `input.member-name[data-email="${email}"]`
            ) as HTMLInputElement | null;
            const dietaryInput = membersContainer.querySelector(
                `textarea.member-dietary[data-email="${email}"]`
            ) as HTMLTextAreaElement | null;
            const accessInput = membersContainer.querySelector(
                `textarea.member-access[data-email="${email}"]`
            ) as HTMLTextAreaElement | null;

            names.push({ email, name: nameInput?.value.trim() ?? "" });
            dietaries.push({ email, value: dietaryInput?.value.trim() ?? "" });
            accesses.push({ email, value: accessInput?.value.trim() ?? "" });
        }

        const hasAnyName = names.some(n => n.name.length > 0);
        if (!hasAnyName) throw new Error("At least one member must have a name.");

        const partySize = Number(partySizeEl.value);
        if (!Number.isInteger(partySize) || partySize < 0) {
            throw new Error("Additional guests must be a whole number (0 or more).");
        }

        const hasDietary = dietaries.some(d => d.value.length > 0);
        const hasAccess = accesses.some(a => a.value.length > 0);

        return {
            group_id: groupId,
            name: JSON.stringify(names),
            party_size: partySize,
            dietary_requirements: hasDietary ? JSON.stringify(dietaries) : null,
            access_needs: hasAccess ? JSON.stringify(accesses) : null,
            updated_at: new Date().toISOString(),
        };
    }

    // --- Load / refresh ---

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

    // --- Fetch group member emails ---

    async function fetchMemberEmails(groupId: string): Promise<string[]> {
        if (DEV_BYPASS_AUTH) {
            return ["dev-user-1@example.com", "dev-user-2@example.com"];
        }

        const { data, error } = await supabase
            .from("invited_emails")
            .select("email")
            .eq("group_id", groupId);

        if (error) throw error;
        return (data ?? []).map((row: { email: string }) => row.email);
    }

    // ===== Main init flow =====

    showStatus("Checking access…");
    const ctx = await requireInvited();
    if (!ctx) return;

    const groupId = ctx.groupId;

    // Fetch member emails and render sections
    try {
        memberEmails = await fetchMemberEmails(groupId);
    } catch (err: any) {
        showStatus(`Failed to load group members: ${err?.message ?? err}`, true);
        return;
    }

    if (memberEmails.length === 0) {
        // Fallback: single unknown member
        memberEmails = ["unknown"];
    }

    renderMemberSections(memberEmails);

    const existing = await loadRsvp(groupId);
    form.classList.remove("hidden");
    statusBox.classList.add("hidden");

    if (existing) {
        fillForm(existing);
    } else {
        partySizeEl.value = "0";
        loadedUpdatedAt = null;
        meta.textContent = "No RSVP saved yet.";
    }

    // --- Event handlers ---

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
            const payload = collectFormData(groupId);

            // Dev localStorage save + conflict simulation
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
                exploreNudge?.classList.remove("hidden");
                return;
            }

            let saved = null;

            if (loadedUpdatedAt) {
                // UPDATE with optimistic concurrency check
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
                    const latest = await loadRsvp(groupId);
                    if (latest) fillForm(latest);

                    showStatus(
                        "Your partner updated the RSVP while you were editing. We\u2019ve loaded the latest values. Please review and save again \u2014 or click \u201cRefresh latest\u201d.",
                        true
                    );
                    return;
                }

                saved = data;
            } else {
                // Check if a row already exists (e.g. created before
                // updated_at was populated). If so, update without the
                // concurrency check rather than attempting an INSERT that
                // would fail on the unique constraint.
                const existing = await loadRsvp(groupId);

                if (existing) {
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
                        .select()
                        .maybeSingle();

                    if (error) throw error;
                    saved = data;
                } else {
                    // INSERT (first one wins)
                    const { data, error } = await supabase
                        .from("rsvp")
                        .insert(payload)
                        .select()
                        .single();

                    if (error) {
                        const latest = await loadRsvp(groupId);
                        if (latest) fillForm(latest);

                        showStatus(
                            "An RSVP was created by your partner while you were editing. We\u2019ve loaded the latest values. Please review and save again \u2014 or click \u201cRefresh latest\u201d.",
                            true
                        );
                        return;
                    }

                    saved = data;
                }
            }

            fillForm(saved);
            showStatus("Saved successfully.");
            exploreNudge?.classList.remove("hidden");
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
