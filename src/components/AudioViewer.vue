<template>
    <div class="w-full h-full bg-gray-900 flex flex-column justify-content-end" style="overflow-y:auto">
        <div class="flex-grow-1 text-color-secondary flex flex-column justify-content-center align-items-center">
            <i class="pi pi-volume-up" style="font-size: 7rem"></i>
        </div>
        <div class="p-3">
            <VideoPlayer :options="{ controls: true, audioOnlyMode: true, sources: [{ src: source }] }" />
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
        source: {
            type: String,
            required: true,
        }
    }
}
</script>
