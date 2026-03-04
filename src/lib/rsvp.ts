import { supabase } from "./supabaseClient";
import { DEV_BYPASS_AUTH, requireInvited } from "./requireInvite";

type MemberEntry = { email: string; name: string };
type MemberValue = { email: string; value: string };
// key is the stable identifier (real email or synthetic __guest__{uuid} for email-less members)
type Member = { key: string; displayName: string };

export async function initRsvp() {
    let loadedUpdatedAt: string | null = null;
    let members: Member[] = [];

    const statusBox = document.getElementById("statusBox") as HTMLDivElement;
    const statusText = document.getElementById("statusText") as HTMLParagraphElement;
    const form = document.getElementById("rsvpForm") as HTMLFormElement;
    const meta = document.getElementById("meta") as HTMLParagraphElement;
    const membersContainer = document.getElementById("membersContainer") as HTMLDivElement;

    const additionalGuestsEl = document.getElementById("additional_guests") as HTMLInputElement;
    const additionalGuestFields = document.getElementById("additionalGuestFields") as HTMLDivElement;
    const additionalGuestNamesEl = document.getElementById("additional_guest_names") as HTMLInputElement;
    const additionalGuestDetailsEl = document.getElementById("additional_guest_details") as HTMLTextAreaElement;

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

    function toggleAdditionalGuestFields() {
        const show = Number(additionalGuestsEl.value) > 0;
        additionalGuestFields.classList.toggle("hidden", !show);
    }

    additionalGuestsEl.addEventListener("input", toggleAdditionalGuestFields);

    // --- Member section rendering ---

    function renderMemberSections(memberList: Member[]) {
        membersContainer.innerHTML = "";
        for (const member of memberList) {
            const fieldset = document.createElement("fieldset");
            fieldset.className = "member-section";
            fieldset.dataset.email = member.key;

            const legend = document.createElement("legend");
            legend.className = "member-legend";
            legend.textContent = member.displayName;
            fieldset.appendChild(legend);

            // Keep legend in sync with the name input as the user types
            fieldset.addEventListener("input", (e) => {
                const target = e.target as HTMLInputElement;
                if (target.classList.contains("member-name")) {
                    legend.textContent = target.value.trim() || member.displayName;
                }
            });

            // Name
            const nameLabel = document.createElement("label");
            nameLabel.className = "field";
            nameLabel.innerHTML = `
                <span class="field-label">Name</span>
                <input class="field-input member-name" type="text" autocomplete="name" data-email="${member.key}" />
            `;
            fieldset.appendChild(nameLabel);

            // Dietary
            const dietaryLabel = document.createElement("label");
            dietaryLabel.className = "field";
            dietaryLabel.innerHTML = `
                <span class="field-label">Dietary requirements</span>
                <textarea class="field-input member-dietary" rows="2" placeholder="e.g. vegetarian, allergies, etc." data-email="${member.key}"></textarea>
            `;
            fieldset.appendChild(dietaryLabel);

            // Access needs
            const accessLabel = document.createElement("label");
            accessLabel.className = "field";
            accessLabel.innerHTML = `
                <span class="field-label">Access needs</span>
                <textarea class="field-input member-access" rows="2" placeholder="e.g. step-free access, hearing assistance, etc." data-email="${member.key}"></textarea>
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

        const memberKeys = members.map(m => m.key);
        const names = parseNameJson(rsvp.name, memberKeys);
        const dietaries = parseValueJson(rsvp.dietary_requirements, memberKeys);
        const accesses = parseValueJson(rsvp.access_needs, memberKeys);

        for (const member of members) {
            const { key, displayName } = member;
            const nameInput = membersContainer.querySelector(
                `input.member-name[data-email="${key}"]`
            ) as HTMLInputElement | null;
            const dietaryInput = membersContainer.querySelector(
                `textarea.member-dietary[data-email="${key}"]`
            ) as HTMLTextAreaElement | null;
            const accessInput = membersContainer.querySelector(
                `textarea.member-access[data-email="${key}"]`
            ) as HTMLTextAreaElement | null;

            const name = names.find(n => n.email === key)?.name ?? "";
            if (nameInput) nameInput.value = name;
            if (dietaryInput) dietaryInput.value = dietaries.find(d => d.email === key)?.value ?? "";
            if (accessInput) accessInput.value = accesses.find(a => a.email === key)?.value ?? "";

            // Sync legend to saved name, fall back to displayName (never the raw key)
            const fieldset = membersContainer.querySelector(`fieldset[data-email="${key}"]`);
            const legend = fieldset?.querySelector(".member-legend");
            if (legend) legend.textContent = name || displayName;
        }

        additionalGuestsEl.value = String(rsvp.additional_guests ?? 0);
        additionalGuestNamesEl.value = rsvp.additional_guest_names ?? "";
        additionalGuestDetailsEl.value = rsvp.additional_guest_details ?? "";
        toggleAdditionalGuestFields();
        loadedUpdatedAt = rsvp.updated_at ?? null;

        meta.textContent = rsvp.updated_at
            ? `Last updated: ${new Date(rsvp.updated_at).toLocaleString()}`
            : "";
    }

    function collectFormData(groupId: string) {
        const names: MemberEntry[] = [];
        const dietaries: MemberValue[] = [];
        const accesses: MemberValue[] = [];

        for (const { key } of members) {
            const nameInput = membersContainer.querySelector(
                `input.member-name[data-email="${key}"]`
            ) as HTMLInputElement | null;
            const dietaryInput = membersContainer.querySelector(
                `textarea.member-dietary[data-email="${key}"]`
            ) as HTMLTextAreaElement | null;
            const accessInput = membersContainer.querySelector(
                `textarea.member-access[data-email="${key}"]`
            ) as HTMLTextAreaElement | null;

            names.push({ email: key, name: nameInput?.value.trim() ?? "" });
            dietaries.push({ email: key, value: dietaryInput?.value.trim() ?? "" });
            accesses.push({ email: key, value: accessInput?.value.trim() ?? "" });
        }

        const hasAnyName = names.some(n => n.name.length > 0);
        if (!hasAnyName) throw new Error("At least one member must have a name.");

        const additionalGuests = Number(additionalGuestsEl.value);
        if (!Number.isInteger(additionalGuests) || additionalGuests < 0) {
            throw new Error("Additional guests must be a whole number (0 or more).");
        }

        const hasDietary = dietaries.some(d => d.value.length > 0);
        const hasAccess = accesses.some(a => a.value.length > 0);

        return {
            group_id: groupId,
            name: JSON.stringify(names),
            additional_guests: additionalGuests,
            dietary_requirements: hasDietary ? JSON.stringify(dietaries) : null,
            access_needs: hasAccess ? JSON.stringify(accesses) : null,
            additional_guest_names: additionalGuests > 0 ? (additionalGuestNamesEl.value.trim() || null) : null,
            additional_guest_details: additionalGuests > 0 ? (additionalGuestDetailsEl.value.trim() || null) : null,
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

    // --- Fetch group members ---

    async function fetchMembers(groupId: string): Promise<Member[]> {
        if (DEV_BYPASS_AUTH) {
            return [
                { key: "dev-user-1@example.com", displayName: "dev-user-1@example.com" },
                { key: "dev-user-2@example.com", displayName: "dev-user-2@example.com" },
            ];
        }

        const { data, error } = await supabase
            .from("invited_emails")
            .select("email, display_name")
            .eq("group_id", groupId);

        if (error) throw error;
        return (data ?? []).map((row: { email: string; display_name: string | null }) => ({
            key: row.email,
            displayName: row.display_name || row.email,
        }));
    }

    // ===== Main init flow =====

    showStatus("Checking access…");
    const ctx = await requireInvited();
    if (!ctx) return;

    const groupId = ctx.groupId;

    // Fetch group members and render sections
    try {
        members = await fetchMembers(groupId);
    } catch (err: any) {
        showStatus(`Failed to load group members: ${err?.message ?? err}`, true);
        return;
    }

    if (members.length === 0) {
        // Fallback: single unknown member
        members = [{ key: "unknown", displayName: "Guest" }];
    }

    renderMemberSections(members);

    const existing = await loadRsvp(groupId);
    form.classList.remove("hidden");
    statusBox.classList.add("hidden");

    if (existing) {
        fillForm(existing);
    } else {
        additionalGuestsEl.value = "0";
        toggleAdditionalGuestFields();
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
                        additional_guests: payload.additional_guests,
                        dietary_requirements: payload.dietary_requirements,
                        access_needs: payload.access_needs,
                        additional_guest_names: payload.additional_guest_names,
                        additional_guest_details: payload.additional_guest_details,
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
                            additional_guests: payload.additional_guests,
                            dietary_requirements: payload.dietary_requirements,
                            access_needs: payload.access_needs,
                            additional_guest_names: payload.additional_guest_names,
                            additional_guest_details: payload.additional_guest_details,
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
