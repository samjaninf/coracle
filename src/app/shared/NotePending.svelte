<style>
  .loading-bar::after {
    content: "";
    position: absolute;
    top: 0;
    right: -50px;
    width: 50px;
    height: 100%;
    background: linear-gradient(to left, rgba(0, 0, 0, 0), var(--accent));
  }

  .loading-bar-content > * {
    @apply z-feature;
  }
</style>

<script lang="ts">
  import {remove} from "@welshman/lib"
  import {abortThunk, thunkCompleteUrls, thunkUrlsWithStatus} from "@welshman/app"
  import type {Thunk} from "@welshman/app"
  import {PublishStatus} from "@welshman/net"
  import {now} from "@welshman/signer"
  import {LOCAL_RELAY_URL} from "@welshman/relay"
  import {tweened} from "svelte/motion"
  import {userSettings} from "src/engine"
  import Anchor from "src/partials/Anchor.svelte"
  import {timestamp1} from "src/util/misc"

  const rendered = now()

  export let thunk: Thunk
  export let onReplyAbort: (thunk: Thunk) => void

  const completedDisplay = tweened(0)

  const abort = () => {
    abortThunk(thunk)
    onReplyAbort(thunk)
  }

  $: relays = remove(LOCAL_RELAY_URL, $thunk?.options?.relays)
  $: completed = remove(LOCAL_RELAY_URL, thunkCompleteUrls($thunk))
  $: pending = remove(LOCAL_RELAY_URL, thunkUrlsWithStatus($thunk, PublishStatus.Pending))
  $: success = remove(LOCAL_RELAY_URL, thunkUrlsWithStatus($thunk, PublishStatus.Success))
  $: showProgress = pending.length > 0 || completed.length > 0

  $: completedDisplay.set((completed.length / relays.length) * 80)
</script>

{#if $thunk}
  <div
    class="loading-bar-content relative flex h-6 w-full items-center justify-between overflow-hidden rounded-md pl-4 text-sm"
    class:bg-neutral-500={showProgress}
    class:border={!showProgress}
    class:px-4={pending.length > 0}
    on:click|stopPropagation>
    {#if showProgress}
      <div
        class="loading-bar absolute left-0 top-0 h-full bg-accent"
        style="width: {20 + $completedDisplay}%" />
      {#if pending.length > 0}
        <span class="sm:hidden">
          {success.length}/{relays.length} relays
        </span>
        <span class="hidden sm:inline">
          Publishing... {relays.length - pending.length} of {relays.length} relays
        </span>
      {:else}
        <span class="sm:hidden">
          {success.length}/{relays.length} relays
        </span>
        <span class="hidden sm:inline">
          Published to {success.length}/{relays.length} relays
        </span>
        <Anchor
          class="staatliches z-feature rounded-r-md bg-tinted-100-d px-4 py-1 uppercase text-tinted-700-d"
          modal
          href="/publishes">
          <span class="sm:hidden"> Details </span>
          <span class="hidden sm:inline"> See details </span>
        </Anchor>
      {/if}
    {:else if $userSettings.send_delay > 0}
      {@const seconds = rendered + Math.ceil($userSettings.send_delay / 1000) - $timestamp1}
      <span class="hidden sm:inline">
        Sending reply in {seconds} seconds
      </span>
      <span class="sm:hidden">
        Sending in {seconds}s
      </span>
      <button
        class="ml-2 cursor-pointer rounded-md bg-neutral-100-d px-4 py-1 text-tinted-700-d"
        on:click={abort}>Cancel</button>
    {/if}
  </div>
{/if}
