<script lang="ts">
  import {first, formatTimestamp} from "@welshman/lib"
  import {getTags, toNostrURI, Address} from "@welshman/util"
  import {defaultTagFeedMappings} from "@welshman/feeds"
  import {repository} from "@welshman/app"
  import {slide} from "src/util/transition"
  import {boolCtrl} from "src/partials/utils"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {readUserList, displayUserList, mapListToFeed} from "src/domain"
  import {router} from "src/app/util"
  import {quantify} from "src/util/misc"

  export let address
  export let inert = false

  const expandTags = boolCtrl()
  const tagTypes = defaultTagFeedMappings.map(first) as string[]
  const event = repository.getEvent(address)
  const deleted = repository.isDeleted(event)
  const list = readUserList(event)

  const loadFeed = () => {
    if (!inert) {
      router
        .at("notes")
        .cx({feed: mapListToFeed(list)})
        .push()
    }
  }
</script>

<div class="flex justify-end text-xs">
  {formatTimestamp(event.created_at)}
</div>
<div class="flex gap-3">
  <div class="mt-[6px]">
    <i class="fa fa-list fa-2xl" />
  </div>
  <FlexColumn small>
    <div class="flex items-center justify-between">
      <span class="flex items-center gap-3">
        <div>
          <span
            class="staatliches text-xl"
            class:text-neutral-400={!list.title}
            class:line-through={deleted}>
            {displayUserList(list)}
          </span>
          {#if deleted}
            <Chip danger small>Deleted</Chip>
          {/if}
        </div>
        <div class="flex gap-1">
          by <PersonBadgeSmall pubkey={list.event.pubkey} />
        </div>
      </span>
      <slot name="controls">
        <Anchor underline on:click={loadFeed}>Load feed</Anchor>
      </slot>
    </div>
    {#if list.description}
      <p>{list.description}</p>
    {/if}
    <div class="flex items-center justify-between">
      {quantify(getTags(tagTypes, event.tags).length, "item")}
      <div class="flex gap-1">
        <div
          class="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-neutral-100"
          on:click={$expandTags.toggle}>
          {#if $expandTags.enabled}
            <i class="fa fa-angle-down" />
          {:else}
            <i class="fa fa-angle-right" />
          {/if}
        </div>
        <CopyValueSimple
          label="List address"
          value={toNostrURI(Address.from(address).toNaddr())}
          class="text-neutral-400" />
      </div>
    </div>
    {#if $expandTags.enabled}
      <pre class="overflow-auto rounded bg-neutral-900" transition:slide|local>{JSON.stringify(
          event.tags,
          null,
          2,
        )}</pre>
    {/if}
  </FlexColumn>
</div>
