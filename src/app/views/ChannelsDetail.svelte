<script lang="ts">
  import {derived} from "svelte/store"
  import {onMount, onDestroy} from "svelte"
  import {deriveEvents} from "@welshman/store"
  import {DIRECT_MESSAGE, isShareableRelayUrl, getRelaysFromList} from "@welshman/util"
  import {
    inboxRelaySelectionsByPubkey,
    session,
    repository,
    displayProfileByPubkey,
    loadInboxRelaySelections,
  } from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import Channel from "src/app/shared/Channel.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {router} from "src/app/util/router"
  import Popover from "src/partials/Popover.svelte"
  import {getChannelIdFromEvent, listenForMessages, setChecked} from "src/engine"

  export let pubkeys
  export let channelId

  const messages = derived(
    deriveEvents(repository, {filters: [{kinds: [4, DIRECT_MESSAGE]}]}),
    $events => $events.filter(e => getChannelIdFromEvent(e) === channelId),
  )

  const pubkeysWithoutInbox = derived(inboxRelaySelectionsByPubkey, $inboxRelaySelectionsByPubkey =>
    pubkeys.filter(
      pubkey =>
        !getRelaysFromList($inboxRelaySelectionsByPubkey.get(pubkey)).some(isShareableRelayUrl),
    ),
  )

  let isAccepted

  const showPerson = pubkey => router.at("people").of(pubkey).open()

  onMount(() => {
    const unsubscriber = listenForMessages(pubkeys)

    isAccepted = $messages.some(m => m.pubkey === $session.pubkey)
    setChecked("channels/" + channelId)

    for (const pubkey of pubkeys) {
      loadInboxRelaySelections(pubkey)
    }

    return () => {
      unsubscriber()
    }
  })

  onDestroy(() => {
    setChecked("channels/" + channelId)
  })

  document.title = `Direct Messages`
</script>

<Channel {pubkeys} {channelId} messages={$messages}>
  <div slot="header" class="flex h-16 justify-between px-4">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-4 pt-1">
        <Anchor
          class="fa fa-arrow-left cursor-pointer text-2xl"
          href={"/channels" + (isAccepted ? "" : "/requests")} />
        <PersonCircles {pubkeys} />
      </div>
      <div class:h-16={pubkeys.length === 1} class="flex flex-col items-start overflow-hidden pt-2">
        <div>
          {#each pubkeys as pubkey, i (pubkey)}
            {#if i > 0}&bullet;{/if}
            <Anchor class="hover:underline" on:click={() => showPerson(pubkey)}>
              {displayProfileByPubkey(pubkey)}
            </Anchor>
          {/each}
        </div>
        {#if pubkeys.length === 1}
          <PersonAbout truncate pubkey={pubkeys[0]} />
        {/if}
      </div>
    </div>
    {#if $pubkeysWithoutInbox.length > 0}
      <div class="flex items-center">
        <Popover triggerType="mouseenter" placement="left">
          <div
            slot="trigger"
            class="flex cursor-pointer items-center gap-1 rounded-full bg-danger px-2">
            <i class="fa fa-exclamation-triangle" />
            <span>
              {$pubkeysWithoutInbox.length}
            </span>
          </div>
          <div slot="tooltip">
            {$pubkeysWithoutInbox.length} inbox is not configured
          </div>
        </Popover>
      </div>
    {/if}
  </div>
</Channel>
