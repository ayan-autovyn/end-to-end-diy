<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- App state (leads, advisors, WhatsApp log, advisor session) lives in an in-memory store in src/lib/store.ts — UI prototype; swap for Lovable Cloud when real persistence/OTP/calls are needed.
- Round-robin allocation logic is `pickRoundRobin` in src/lib/store.ts, covered by src/test/round-robin.test.ts.
- PSF is a scripted voice-bot conversation defined in src/lib/psf.ts (PSF_STEPS + nextStep), covered by src/test/psf.test.ts — no staff PSF form exists by design.
- Leads start with jcCreated=false; stages unlock only after SA taps "JC Created" (sends tracking link). Service stages are JC Open → Washing → Bay → Ready for delivery; each completed stage nudges the customer (including the move into Ready for delivery); then tapping "Mark ready" sends the ready-for-pickup WhatsApp and starts the 5-minute reply window before the AI call; "Mark Delivered" only follows that state. Callbacks requested during PSF live in store.callbacks. Covered by src/test/job-card-flow.test.ts.
- Customer WhatsApp previews on advisor actions render the latest customer message from the store in the shared dialog so previews match the recorded notification rather than regenerated text.
- DIY outbound AI calls use the deadline-based useAiCallCountdown hook before connecting the simulation; inbound calls remain manually initiated so the two flows do not share a wait state.
- WhatsApp prototype tracking links use TanStack Link rather than document navigation so opening customer tracking preserves the in-memory lead and service updates.
