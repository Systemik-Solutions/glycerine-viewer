<template>
    <div class="w-full bg-gray-900 flex flex-column justify-content-end" :class="{ 'h-full': !compact }" style="overflow-y:auto">
        <div v-if="!compact" class="flex-grow-1 text-color-secondary flex flex-column justify-content-center align-items-center">
            <i class="pi pi-volume-up" style="font-size: 7rem"></i>
        </div>
        <div class="p-3">
            <VideoPlayer :options="{ controls: true, audioOnlyMode: true, autoplay: false, loop: false, sources: [{ src: source, type: format }] }" />
        </div>
    </div>
</template>

<script>
import VideoPlayer from "@/components/VideoPlayer.vue";
export default {
    name: "AudioViewer",
    components: {
        VideoPlayer
    },
    props: {
        // Show just the audio controls when accompanying an image.
        compact: {
            type: Boolean,
            default: false,
        },
        source: {
            type: String,
            required: true,
        },
        format: {
            type: String,
            default: null,
        }
    }
}
</script>
